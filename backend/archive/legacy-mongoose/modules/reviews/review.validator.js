import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Identifiant invalide.');
const rating = z.coerce.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  body: z
    .object({
      orderId: objectId.optional(),
      conversationId: objectId.optional(),
      productId: objectId.optional(),
      reviewedUserId: objectId.optional(),
      rating,
      communicationRating: rating.optional(),
      productAccuracyRating: rating.optional(),
      behaviorRating: rating.optional(),
      comment: z.string().trim().min(10).max(1000)
    })
    .refine((data) => data.orderId || (data.conversationId && data.productId && data.reviewedUserId), {
      message: 'Fournir orderId ou conversationId + productId + reviewedUserId.',
      path: ['orderId']
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listUserReviewsSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['PUBLISHED', 'PENDING_MODERATION', 'HIDDEN', 'DELETED']).optional()
  }),
  body: z.object({}).optional()
});

export const replyReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ reply: z.string().trim().min(2).max(600) }),
  query: z.object({}).optional()
});

export const reportReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    reason: z.enum([
      'SCAM',
      'FAKE_PRODUCT',
      'FORBIDDEN_PRODUCT',
      'BAD_BEHAVIOR',
      'OFFENSIVE_CONTENT',
      'MISLEADING_PRICE',
      'STOLEN_IMAGE',
      'UNREACHABLE_SELLER',
      'OTHER'
    ]),
    description: z.string().trim().max(1200).optional()
  }),
  query: z.object({}).optional()
});

export const adminListReviewsSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PUBLISHED', 'PENDING_MODERATION', 'HIDDEN', 'DELETED']).optional(),
    isReported: z.coerce.boolean().optional()
  }),
  body: z.object({}).optional()
});

export const hideReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ reason: z.string().trim().min(5).max(800) }),
  query: z.object({}).optional()
});
