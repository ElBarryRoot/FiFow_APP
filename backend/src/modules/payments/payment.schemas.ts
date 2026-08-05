import { z } from 'zod';

const uuid = z.string().uuid();

export const initiatePaymentSchema = z.object({
  body: z.object({
    orderId: uuid,
    phone: z.string().trim().regex(/^\+?[0-9]{8,20}$/).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const paymentIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ paymentId: uuid }),
  query: z.object({})
});

export const mockConfirmPaymentSchema = z.object({
  body: z.object({
    outcome: z.enum(['SUCCEEDED', 'FAILED']).default('SUCCEEDED'),
    failureReason: z.string().trim().min(3).max(800).optional()
  }).strict().default({ outcome: 'SUCCEEDED' }),
  params: z.object({ paymentId: uuid }),
  query: z.object({})
});

export const listPaymentsSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const webhookSchema = z.object({
  body: z.object({
    internalReference: z.string().min(10).max(80),
    providerEventId: z.string().min(5).max(160),
    providerTransactionId: z.string().min(3).max(160).optional(),
    status: z.enum(['SUCCEEDED', 'FAILED', 'CANCELLED']),
    failureCode: z.string().max(100).optional(),
    failureReason: z.string().max(800).optional()
  }),
  params: z.object({
    provider: z.enum(['mock', 'orange-money', 'mtn-momo', 'other'])
  }),
  query: z.object({})
});

export const refundWebhookSchema = z.object({
  body: z.object({
    internalReference: z.string().min(10).max(80),
    providerEventId: z.string().min(5).max(160),
    providerTransactionId: z.string().min(3).max(160).optional(),
    status: z.enum(['SUCCEEDED', 'FAILED']),
    failureReason: z.string().max(800).optional()
  }),
  params: z.object({
    provider: z.enum(['mock', 'orange-money', 'mtn-momo', 'other'])
  }),
  query: z.object({})
});

export const payoutWebhookSchema = z.object({
  body: z.object({
    internalReference: z.string().min(5).max(80),
    providerEventId: z.string().min(5).max(160),
    providerTransactionId: z.string().min(3).max(160).optional(),
    status: z.enum(['SUCCEEDED', 'FAILED']),
    failureReason: z.string().max(800).optional()
  }),
  params: z.object({
    provider: z.enum(['mock', 'orange-money', 'mtn-momo', 'other'])
  }),
  query: z.object({})
});
