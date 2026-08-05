import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant MongoDB invalide.');
const reportReason = z.enum([
  'SCAM',
  'FAKE_PRODUCT',
  'FORBIDDEN_PRODUCT',
  'BAD_BEHAVIOR',
  'OFFENSIVE_CONTENT',
  'MISLEADING_PRICE',
  'STOLEN_IMAGE',
  'UNREACHABLE_SELLER',
  'OTHER'
]);

export const createConversationSchema = z.object({
  body: z.object({
    productId: objectId
  })
});

export const createMessageSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(2000)
  })
});

export const conversationListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});

export const reportConversationSchema = z.object({
  body: z.object({
    reason: reportReason,
    description: z.string().trim().max(1000).optional()
  })
});
