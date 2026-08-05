import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant MongoDB invalide.');

export const createOrderSchema = z.object({
  body: z.object({
    productId: objectId,
    conversationId: objectId.optional(),
    priceAgreed: z.coerce.number().positive(),
    handoverMode: z.enum(['HAND_TO_HAND', 'EXTERNAL_DELIVERY', 'FUTURE_DELIVERY'])
  })
});

export const orderListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: z.enum(['buyer', 'seller', 'all']).default('all'),
    status: z.enum(['PENDING', 'RESERVED', 'SELLER_CONFIRMED', 'BUYER_CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional()
  })
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(3).max(600)
  })
});

export const disputeOrderSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(5).max(1000)
  })
});
