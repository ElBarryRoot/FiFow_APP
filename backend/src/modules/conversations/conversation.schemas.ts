import { z } from 'zod';
const uuid = z.string().uuid();
export const createConversationSchema = z.object({
  body: z.object({ productId: uuid }),
  params: z.object({}),
  query: z.object({})
});
export const conversationIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ conversationId: uuid }),
  query: z.object({})
});

export const listMessagesSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ conversationId: uuid }),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
});

export const listConversationsSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});
export const sendMessageSchema = z.object({
  body: z.object({ text: z.string().trim().min(1).max(2_000), clientId: uuid.optional() }),
  params: z.object({ conversationId: uuid }),
  query: z.object({})
});

export const sendImageMessageSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ conversationId: uuid }),
  query: z.object({ clientId: uuid.optional() })
});
