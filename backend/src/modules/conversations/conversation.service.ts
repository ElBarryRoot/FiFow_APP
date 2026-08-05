import type { Message, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { emitToConversation, emitToUser } from '../../shared/realtime.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { createNotification } from '../notifications/notification.service.js';

const include = {
  buyer: { select: { id: true, fullName: true, avatarKey: true, sellerVerificationStatus: true } },
  seller: { select: { id: true, fullName: true, avatarKey: true, sellerVerificationStatus: true } },
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      status: true,
      isNegotiable: true,
      handoverModes: true,
      commune: true,
      quartier: true,
      images: {
        where: { archivedAt: null },
        orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
        take: 1,
        select: { id: true, storageKey: true, width: true, height: true }
      }
    }
  }
} satisfies Prisma.ConversationInclude;

async function getParticipant(id: string, userId: string) {
  const row = await prisma.conversation.findFirst({
    where: { id, OR: [{ buyerId: userId }, { sellerId: userId }] },
    include
  });
  if (!row) throw new ApiError(404, 'Conversation introuvable.', 'CONVERSATION_NOT_FOUND');
  return row;
}

async function assertNotBlocked(firstId: string, secondId: string) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: firstId, blockedId: secondId },
        { blockerId: secondId, blockedId: firstId }
      ]
    },
    select: { id: true }
  });
  if (block) throw new ApiError(403, 'Interaction impossible.', 'USER_BLOCKED');
}

function dto(row: Awaited<ReturnType<typeof getParticipant>>, userId: string) {
  const storage = getStorage();
  const participant = (user: typeof row.buyer) => ({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarKey ? storage.publicUrl(user.avatarKey) : null,
    verified: user.sellerVerificationStatus === 'APPROVED'
  });
  const { images, ...product } = row.product;
  const mainImage = images[0]
    ? {
        id: images[0].id,
        url: storage.publicUrl(images[0].storageKey),
        width: images[0].width,
        height: images[0].height
      }
    : null;
  const buyer = participant(row.buyer);
  const seller = participant(row.seller);
  return {
    ...row,
    buyer,
    seller,
    counterpart: row.buyerId === userId ? seller : buyer,
    product: { ...product, price: product.price.toString(), mainImage },
    unreadCount: row.buyerId === userId ? row.unreadCountBuyer : row.unreadCountSeller
  };
}

function messageDto(message: Message) {
  const { mediaKey, ...publicMessage } = message;
  return {
    ...publicMessage,
    mediaUrl: mediaKey ? getStorage().publicUrl(mediaKey) : null
  };
}

export function buildChronologicalMessagePage<T extends { id: string }>(rows: T[], limit: number) {
  const hasNextPage = rows.length > limit;
  const newestFirst = hasNextPage ? rows.slice(0, limit) : rows.slice();
  const nextCursor = hasNextPage ? newestFirst.at(-1)?.id ?? null : null;

  return {
    items: newestFirst.reverse(),
    nextCursor,
    hasNextPage
  };
}

export function reopenConversationForBuyer() {
  return { buyerArchivedAt: null } as const;
}

export function messageActivityUpdate(senderIsBuyer: boolean) {
  return {
    buyerArchivedAt: null,
    sellerArchivedAt: null,
    ...(senderIsBuyer
      ? { unreadCountSeller: { increment: 1 } as const }
      : { unreadCountBuyer: { increment: 1 } as const })
  };
}

function offerDto<T extends { amount: bigint; expiresAt: Date; createdAt: Date; updatedAt: Date; respondedAt: Date | null }>(offer: T) {
  return {
    ...offer,
    amount: offer.amount.toString(),
    expiresAt: offer.expiresAt.toISOString(),
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    respondedAt: offer.respondedAt?.toISOString() ?? null
  };
}

export const conversationService = {
  async createOrGet(buyerId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null },
      select: { sellerId: true }
    });
    if (!product) throw new ApiError(404, 'Annonce indisponible.', 'PRODUCT_NOT_AVAILABLE');
    if (product.sellerId === buyerId) throw new ApiError(400, 'Conversation avec soi-même interdite.', 'CANNOT_CHAT_WITH_SELF');
    await assertNotBlocked(buyerId, product.sellerId);
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.conversation.createMany({
        data: [{ productId, buyerId, sellerId: product.sellerId, lastMessageAt: new Date() }],
        skipDuplicates: true
      });
      if (created.count) {
        await tx.product.update({ where: { id: productId }, data: { conversationsCount: { increment: 1 } } });
      }
      const row = await tx.conversation.update({
        where: { productId_buyerId_sellerId: { productId, buyerId, sellerId: product.sellerId } },
        data: reopenConversationForBuyer(),
        select: { id: true }
      });
      return { id: row.id, created: Boolean(created.count) };
    });
    return { data: dto(await getParticipant(result.id, buyerId), buyerId), created: result.created };
  },
  async list(userId: string, cursor?: string, limit = 20) {
    const [rows, buyerUnread, sellerUnread] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          OR: [
            { buyerId: userId, buyerArchivedAt: null },
            { sellerId: userId, sellerArchivedAt: null }
          ]
        },
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include
      }),
      prisma.conversation.aggregate({
        where: { buyerId: userId, buyerArchivedAt: null },
        _sum: { unreadCountBuyer: true }
      }),
      prisma.conversation.aggregate({
        where: { sellerId: userId, sellerArchivedAt: null },
        _sum: { unreadCountSeller: true }
      })
    ]);
    const more = rows.length > limit;
    const page = more ? rows.slice(0, limit) : rows;
    return {
      items: page.map((row) => dto(row, userId)),
      nextCursor: more ? page.at(-1)?.id ?? null : null,
      unreadCount: (buyerUnread._sum.unreadCountBuyer ?? 0) + (sellerUnread._sum.unreadCountSeller ?? 0)
    };
  },
  async detail(userId: string, id: string) {
    const conversation = await getParticipant(id, userId);
    const [messages, offers] = await Promise.all([prisma.message.findMany({
      where: { conversationId: id, archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
      select: {
        id: true,
        clientId: true,
        conversationId: true,
        senderId: true,
        type: true,
        text: true,
        mediaKey: true,
        readAt: true,
        editedAt: true,
        archivedAt: true,
        isReported: true,
        reportCount: true,
        createdAt: true,
        updatedAt: true
      }
    }), prisma.offer.findMany({
      where: { conversationId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        productId: true,
        conversationId: true,
        creatorId: true,
        recipientId: true,
        parentOfferId: true,
        amount: true,
        currency: true,
        handoverMode: true,
        status: true,
        message: true,
        expiresAt: true,
        respondedAt: true,
        createdAt: true,
        updatedAt: true
      }
    })]);
    return {
      conversation: dto(conversation, userId),
      messages: messages.reverse().map(messageDto),
      offers: offers.map(offerDto)
    };
  },
  async messages(userId: string, id: string, cursor?: string, limit = 50) {
    await getParticipant(id, userId);

    if (cursor) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: cursor },
        select: { conversationId: true }
      });
      if (!cursorMessage || cursorMessage.conversationId !== id) {
        throw new ApiError(400, 'Curseur de messages invalide.', 'INVALID_MESSAGE_CURSOR');
      }
    }

    const rows = await prisma.message.findMany({
      where: { conversationId: id, archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
    const page = buildChronologicalMessagePage(rows, limit);

    return {
      ...page,
      items: page.items.map(messageDto)
    };
  },
  async send(userId: string, id: string, text: string, clientId?: string) {
    const conversation = await getParticipant(id, userId);
    if (conversation.status !== 'ACTIVE') throw new ApiError(409, 'Conversation inactive.', 'CONVERSATION_NOT_ACTIVE');
    const receiverId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    await assertNotBlocked(userId, receiverId);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM conversations WHERE id = ${id}::uuid FOR UPDATE`;
      if (clientId) {
        const existing = await tx.message.findFirst({ where: { conversationId: id, clientId } });
        if (existing) return { message: existing, created: false, notification: null };
      }
      const message = await tx.message.create({
        data: { conversationId: id, senderId: userId, text, ...(clientId ? { clientId } : {}) }
      });
      await tx.conversation.update({
        where: { id },
        data: {
          lastMessageText: text.slice(0, 220),
          lastMessageAt: message.createdAt,
          ...messageActivityUpdate(conversation.buyerId === userId)
        }
      });
      const notification = await createNotification({
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: 'Nouveau message',
        body: text.slice(0, 120),
        data: { conversationId: id, messageId: message.id, productId: conversation.productId }
      }, tx);
      return { message, created: true, notification };
    });
    const publicMessage = messageDto(result.message);
    if (result.created) {
      emitToConversation(id, 'message:new', publicMessage);
      emitToUser(receiverId, 'notification:new', result.notification);
    }
    return { message: publicMessage, created: result.created };
  },
  async sendImage(userId: string, id: string, buffer: Buffer, clientId?: string) {
    const conversation = await getParticipant(id, userId);
    if (conversation.status !== 'ACTIVE') {
      throw new ApiError(409, 'Conversation inactive.', 'CONVERSATION_NOT_ACTIVE');
    }
    const receiverId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    await assertNotBlocked(userId, receiverId);

    const storage = getStorage();
    const stored = await storage.saveImage({
      buffer,
      namespace: `messages/${id}`
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM conversations WHERE id = ${id}::uuid FOR UPDATE`;
        if (clientId) {
          const existing = await tx.message.findFirst({
            where: { conversationId: id, clientId }
          });
          if (existing) return { message: existing, created: false, notification: null };
        }

        const message = await tx.message.create({
          data: {
            conversationId: id,
            senderId: userId,
            type: 'IMAGE',
            mediaKey: stored.key,
            ...(clientId ? { clientId } : {})
          }
        });
        await tx.conversation.update({
          where: { id },
          data: {
            lastMessageText: 'Photo',
            lastMessageAt: message.createdAt,
            ...messageActivityUpdate(conversation.buyerId === userId)
          }
        });
        const notification = await createNotification(
          {
            userId: receiverId,
            type: 'NEW_MESSAGE',
            title: 'Nouvelle photo',
            body: 'Une photo a été envoyée dans la conversation.',
            data: {
              conversationId: id,
              messageId: message.id,
              productId: conversation.productId
            }
          },
          tx
        );
        return { message, created: true, notification };
      });

      if (!result.created) {
        await storage.delete(stored.key).catch(() => undefined);
      }
      const publicMessage = messageDto(result.message);
      if (result.created) {
        emitToConversation(id, 'message:new', publicMessage);
        emitToUser(receiverId, 'notification:new', result.notification);
      }
      return { message: publicMessage, created: result.created };
    } catch (error) {
      await storage.delete(stored.key).catch(() => undefined);
      throw error;
    }
  },
  async read(userId: string, id: string) {
    const conversation = await getParticipant(id, userId);
    const now = new Date();
    await prisma.$transaction([
      prisma.message.updateMany({ where: { conversationId: id, senderId: { not: userId }, readAt: null }, data: { readAt: now } }),
      prisma.conversation.update({
        where: { id },
        data: conversation.buyerId === userId ? { unreadCountBuyer: 0 } : { unreadCountSeller: 0 }
      })
    ]);
    emitToConversation(id, 'message:read', { conversationId: id, readerId: userId, readAt: now.toISOString() });
  },
  async archive(userId: string, id: string) {
    const conversation = await getParticipant(id, userId);
    await prisma.conversation.update({
      where: { id },
      data: conversation.buyerId === userId ? { buyerArchivedAt: new Date() } : { sellerArchivedAt: new Date() }
    });
  }
};
