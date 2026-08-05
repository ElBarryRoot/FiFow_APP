import { z } from 'zod';

const uuid = z.string().uuid();
const topic = z.string().trim().min(2).max(80);

export const createSupportTicketSchema = z.object({
  body: z.object({
    topic: topic.optional(),
    category: topic.optional(),
    subject: z.string().trim().min(3).max(160).optional(),
    reference: z.string().trim().min(2).max(120).optional(),
    message: z.string().trim().min(5).max(3_000)
  }).strict().refine((body) => Boolean(body.topic || body.category), {
    message: 'Un sujet de support est requis.',
    path: ['topic']
  }),
  params: z.object({}),
  query: z.object({})
});

export const listSupportTicketsSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']).optional(),
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const supportTicketIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ ticketId: uuid }),
  query: z.object({})
});

export const supportMessageSchema = z.object({
  body: z.object({ message: z.string().trim().min(2).max(3_000) }).strict(),
  params: z.object({ ticketId: uuid }),
  query: z.object({})
});

export const adminSupportListSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assigned: z.enum(['me', 'unassigned', 'all']).default('all'),
    search: z.string().trim().max(100).optional(),
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30)
  })
});

export const adminSupportIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ id: uuid }),
  query: z.object({})
});

export const adminSupportMessageSchema = z.object({
  body: z.object({ message: z.string().trim().min(2).max(3_000) }).strict(),
  params: z.object({ id: uuid }),
  query: z.object({})
});

export const adminSupportStatusSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'])
  }).strict(),
  params: z.object({ id: uuid }),
  query: z.object({})
});
