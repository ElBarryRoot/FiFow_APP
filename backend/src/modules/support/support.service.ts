import { randomBytes } from 'node:crypto';
import type { Prisma, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { emitToUser } from '../../shared/realtime.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { createNotification } from '../notifications/notification.service.js';

const detailInclude = {
  requester: { select: { id: true, fullName: true, avatarKey: true } },
  assignedTo: { select: { id: true, fullName: true, role: true } },
  messages: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    include: { author: { select: { id: true, fullName: true, avatarKey: true, role: true } } }
  }
} satisfies Prisma.SupportTicketInclude;

const listInclude = {
  requester: { select: { id: true, fullName: true, avatarKey: true } },
  assignedTo: { select: { id: true, fullName: true, role: true } },
  messages: {
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    take: 1,
    include: { author: { select: { id: true, fullName: true, avatarKey: true, role: true } } }
  },
  _count: { select: { messages: true } }
} satisfies Prisma.SupportTicketInclude;

type TicketWithDetails = Prisma.SupportTicketGetPayload<{ include: typeof detailInclude }>;
type TicketSummary = Prisma.SupportTicketGetPayload<{ include: typeof listInclude }>;

function reference() {
  return `SUP-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function priorityFor(topic: string): SupportTicketPriority {
  const normalized = topic.toUpperCase();
  if (normalized.includes('SECURITY') || normalized.includes('SECURITE')) return 'URGENT';
  if (normalized.includes('PAYMENT') || normalized.includes('REFUND') || normalized.includes('ORDER')) return 'HIGH';
  return 'MEDIUM';
}

function avatarUrl(key: string | null) {
  return key ? getStorage().publicUrl(key) : null;
}

function toDto(ticket: TicketWithDetails) {
  return {
    ...ticket,
    requester: { ...ticket.requester, avatarKey: undefined, avatarUrl: avatarUrl(ticket.requester.avatarKey) },
    messages: ticket.messages.map((message) => ({
      ...message,
      author: {
        ...message.author,
        avatarKey: undefined,
        avatarUrl: avatarUrl(message.author.avatarKey)
      }
    }))
  };
}

function toSummaryDto(ticket: TicketSummary) {
  const lastMessage = ticket.messages[0];
  return {
    id: ticket.id,
    reference: ticket.reference,
    topic: ticket.topic,
    subject: ticket.subject,
    relatedReference: ticket.relatedReference,
    status: ticket.status,
    priority: ticket.priority,
    requester: {
      ...ticket.requester,
      avatarKey: undefined,
      avatarUrl: avatarUrl(ticket.requester.avatarKey)
    },
    assignedTo: ticket.assignedTo,
    lastMessage: lastMessage ? {
      id: lastMessage.id,
      message: lastMessage.message,
      createdAt: lastMessage.createdAt,
      author: {
        ...lastMessage.author,
        avatarKey: undefined,
        avatarUrl: avatarUrl(lastMessage.author.avatarKey)
      }
    } : null,
    messageCount: ticket._count.messages,
    lastMessageAt: ticket.lastMessageAt,
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt
  };
}

async function hydrated(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, include: detailInclude });
  if (!ticket) throw new ApiError(404, 'Ticket support introuvable.', 'SUPPORT_TICKET_NOT_FOUND');
  return toDto(ticket);
}

export type SupportAuditContext = {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  ticketId: string,
  context: SupportAuditContext,
  note?: string
) {
  await tx.adminLog.create({
    data: {
      actorId,
      action,
      targetType: 'SUPPORT_TICKET',
      targetId: ticketId,
      ...(context.requestId ? { requestId: context.requestId } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(note ? { note } : {})
    }
  });
}

export const supportService = {
  async create(
    requesterId: string,
    input: { topic?: string; category?: string; subject?: string; reference?: string; message: string }
  ) {
    const topic = input.topic ?? input.category!;
    const id = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          reference: reference(),
          requesterId,
          topic,
          subject: input.subject ?? topic,
          ...(input.reference ? { relatedReference: input.reference } : {}),
          priority: priorityFor(topic),
          messages: { create: { authorId: requesterId, message: input.message } }
        },
        select: { id: true }
      });
      return ticket.id;
    });
    return hydrated(id);
  },

  async list(requesterId: string, input: { status?: SupportTicketStatus; cursor?: string; limit: number }) {
    const rows = await prisma.supportTicket.findMany({
      where: { requesterId, ...(input.status ? { status: input.status } : {}) },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: listInclude
    });
    const more = rows.length > input.limit;
    const page = more ? rows.slice(0, input.limit) : rows;
    return { items: page.map(toSummaryDto), nextCursor: more ? page.at(-1)?.id ?? null : null };
  },

  async detailForUser(requesterId: string, ticketId: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, requesterId },
      include: listInclude
    });
    if (!ticket) throw new ApiError(404, 'Ticket support introuvable.', 'SUPPORT_TICKET_NOT_FOUND');
    return toDto(ticket);
  },

  async userMessage(requesterId: string, ticketId: string, message: string) {
    let notification: Awaited<ReturnType<typeof createNotification>> | null = null;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM support_tickets WHERE id = ${ticketId}::uuid FOR UPDATE`;
      const ticket = await tx.supportTicket.findFirst({ where: { id: ticketId, requesterId } });
      if (!ticket) throw new ApiError(404, 'Ticket support introuvable.', 'SUPPORT_TICKET_NOT_FOUND');
      if (ticket.status === 'CLOSED') {
        throw new ApiError(409, 'Ce ticket est ferme.', 'SUPPORT_TICKET_CLOSED');
      }
      await tx.supportTicketMessage.create({ data: { ticketId, authorId: requesterId, message } });
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: ticket.assignedToId ? 'IN_PROGRESS' : 'OPEN',
          resolvedAt: null,
          lastMessageAt: new Date()
        }
      });
      if (ticket.assignedToId) {
        notification = await createNotification({
          userId: ticket.assignedToId,
          type: 'SYSTEM',
          title: 'Nouvelle reponse support',
          body: `Le ticket ${ticket.reference} a recu une reponse.`,
          data: { supportTicketId: ticket.id }
        }, tx);
      }
    });
    if (notification) emitToUser((notification as { userId: string }).userId, 'notification:new', notification);
    return hydrated(ticketId);
  },

  async adminList(
    actorId: string,
    input: {
      status?: SupportTicketStatus;
      priority?: SupportTicketPriority;
      assigned: 'me' | 'unassigned' | 'all';
      search?: string;
      cursor?: string;
      limit: number;
    }
  ) {
    const rows = await prisma.supportTicket.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.assigned === 'me'
          ? { assignedToId: actorId }
          : input.assigned === 'unassigned'
            ? { assignedToId: null }
            : {}),
        ...(input.search ? {
          OR: [
            { reference: { contains: input.search, mode: 'insensitive' } },
            { subject: { contains: input.search, mode: 'insensitive' } },
            { relatedReference: { contains: input.search, mode: 'insensitive' } },
            { requester: { fullName: { contains: input.search, mode: 'insensitive' } } }
          ]
        } : {})
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: listInclude
    });
    const more = rows.length > input.limit;
    const page = more ? rows.slice(0, input.limit) : rows;
    return { items: page.map(toSummaryDto), nextCursor: more ? page.at(-1)?.id ?? null : null };
  },

  detailForAdmin: hydrated,

  async assign(actorId: string, ticketId: string, context: SupportAuditContext) {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM support_tickets WHERE id = ${ticketId}::uuid FOR UPDATE`;
      const ticket = await tx.supportTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new ApiError(404, 'Ticket support introuvable.', 'SUPPORT_TICKET_NOT_FOUND');
      if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
        throw new ApiError(409, 'Ce ticket ne peut plus etre assigne.', 'SUPPORT_TICKET_NOT_ASSIGNABLE');
      }
      if (ticket.assignedToId && ticket.assignedToId !== actorId) {
        throw new ApiError(409, 'Ce ticket est deja assigne.', 'SUPPORT_TICKET_ALREADY_ASSIGNED');
      }
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { assignedToId: actorId, status: 'IN_PROGRESS' }
      });
      await audit(tx, actorId, 'SUPPORT_TICKET_ASSIGNED', ticketId, context);
    });
    return hydrated(ticketId);
  },

  async adminStatus(
    actorId: string,
    ticketId: string,
    status: SupportTicketStatus,
    context: SupportAuditContext
  ) {
    let notification: Awaited<ReturnType<typeof createNotification>>;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM support_tickets WHERE id = ${ticketId}::uuid FOR UPDATE`;
      const ticket = await tx.supportTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new ApiError(404, 'Ticket support introuvable.', 'SUPPORT_TICKET_NOT_FOUND');
      if (ticket.assignedToId && ticket.assignedToId !== actorId) {
        throw new ApiError(403, 'Ticket assigne a un autre agent.', 'SUPPORT_TICKET_ASSIGNEE_MISMATCH');
      }
      const allowed: Record<SupportTicketStatus, SupportTicketStatus[]> = {
        OPEN: ['IN_PROGRESS', 'CLOSED'],
        IN_PROGRESS: ['WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
        WAITING_FOR_USER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        RESOLVED: ['IN_PROGRESS', 'CLOSED'],
        CLOSED: []
      };
      if (ticket.status !== status && !allowed[ticket.status].includes(status)) {
        throw new ApiError(409, 'Transition de support invalide.', 'INVALID_SUPPORT_TRANSITION');
      }
      const now = new Date();
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status,
          assignedToId: ticket.assignedToId ?? actorId,
          resolvedAt: status === 'RESOLVED' ? now : status === 'IN_PROGRESS' ? null : ticket.resolvedAt,
          closedAt: status === 'CLOSED' ? now : null
        }
      });
      await audit(tx, actorId, 'SUPPORT_TICKET_STATUS_UPDATED', ticketId, context, `${ticket.status}->${status}`);
      notification = await createNotification({
        userId: ticket.requesterId,
        type: 'SYSTEM',
        title: 'Mise a jour de votre demande',
        body: `Le ticket ${ticket.reference} est maintenant ${status}.`,
        data: { supportTicketId: ticket.id, status }
      }, tx);
    });
    emitToUser(notification!.userId, 'notification:new', notification!);
    return hydrated(ticketId);
  },

  async adminMessage(
    actorId: string,
    ticketId: string,
    message: string,
    context: SupportAuditContext
  ) {
    let notification: Awaited<ReturnType<typeof createNotification>>;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM support_tickets WHERE id = ${ticketId}::uuid FOR UPDATE`;
      const ticket = await tx.supportTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new ApiError(404, 'Ticket support introuvable.', 'SUPPORT_TICKET_NOT_FOUND');
      if (ticket.status === 'CLOSED') throw new ApiError(409, 'Ce ticket est ferme.', 'SUPPORT_TICKET_CLOSED');
      if (ticket.assignedToId && ticket.assignedToId !== actorId) {
        throw new ApiError(403, 'Ticket assigne a un autre agent.', 'SUPPORT_TICKET_ASSIGNEE_MISMATCH');
      }
      await tx.supportTicketMessage.create({ data: { ticketId, authorId: actorId, message } });
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { assignedToId: ticket.assignedToId ?? actorId, status: 'WAITING_FOR_USER', lastMessageAt: new Date() }
      });
      await audit(tx, actorId, 'SUPPORT_TICKET_MESSAGE_SENT', ticketId, context);
      notification = await createNotification({
        userId: ticket.requesterId,
        type: 'SYSTEM',
        title: 'Reponse du support Fi Fow',
        body: message.slice(0, 300),
        data: { supportTicketId: ticket.id }
      }, tx);
    });
    emitToUser(notification!.userId, 'notification:new', notification!);
    return hydrated(ticketId);
  }
};
