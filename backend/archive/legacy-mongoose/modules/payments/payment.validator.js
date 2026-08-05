import { z } from 'zod';

const providerEnum = z.enum(['ORANGE_MONEY', 'MOMO', 'OTHER', 'MOCK']);
const paymentStatusEnum = z.enum(['SUCCESS', 'FAILED', 'CANCELLED']);

export const initiatePaymentSchema = z.object({
  body: z.object({
    type: z.enum(['ORDER_PAYMENT', 'DELIVERY_FEE', 'SUBSCRIPTION']).default('ORDER_PAYMENT'),
    amount: z.coerce.number().positive(),
    provider: providerEnum,
    phone: z.string().trim().min(8).max(20),
    relatedModel: z.enum(['Order', 'Delivery']).optional(),
    relatedId: z.string().regex(/^[a-f\d]{24}$/i, 'ID lié invalide.').optional(),
    metadata: z.record(z.any()).optional().default({})
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const getPaymentSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'ID paiement invalide.') }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listMyPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
    type: z.enum(['BOOST', 'ORDER_PAYMENT', 'DELIVERY_FEE', 'SUBSCRIPTION']).optional()
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional()
});

export const paymentWebhookSchema = z.object({
  body: z.object({
    internalReference: z.string().trim().min(10),
    providerTransactionId: z.string().trim().min(3).optional(),
    status: paymentStatusEnum,
    failureReason: z.string().trim().max(800).optional()
  }),
  params: z.object({ provider: z.string().trim().min(2).max(40) }),
  query: z.object({}).optional()
});

export const adminListPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
    type: z.enum(['BOOST', 'ORDER_PAYMENT', 'DELIVERY_FEE', 'SUBSCRIPTION']).optional(),
    provider: providerEnum.optional()
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional()
});
