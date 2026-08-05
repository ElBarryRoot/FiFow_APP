import { z } from 'zod';

const uuid = z.string().uuid();
const phone = z.string().trim().regex(/^\+?[0-9]{8,20}$/);
const optionalInstructions = z.string().trim().min(2).max(500).optional();

const quoteBase = {
  productId: uuid,
  offerId: uuid.optional()
};

export const quoteSchema = z.object({
  body: z.discriminatedUnion('handoverMode', [
    z.object({
      ...quoteBase,
      handoverMode: z.literal('HOME_DELIVERY'),
      handoverDetails: z.object({
        recipientName: z.string().trim().min(2).max(80),
        phone,
        commune: z.string().trim().min(2).max(80),
        quartier: z.string().trim().min(2).max(80),
        addressLine: z.string().trim().min(5).max(300),
        instructions: optionalInstructions
      }).strict()
    }).strict(),
    z.object({
      ...quoteBase,
      handoverMode: z.literal('PICKUP_POINT'),
      handoverDetails: z.object({
        pickupLocation: z.string().trim().min(3).max(300),
        phone
      }).strict()
    }).strict(),
    z.object({
      ...quoteBase,
      handoverMode: z.literal('HAND_TO_HAND'),
      handoverDetails: z.object({
        meetingLocation: z.string().trim().min(3).max(300),
        phone
      }).strict()
    }).strict()
  ]),
  params: z.object({}),
  query: z.object({})
});

export type QuoteBody = z.infer<typeof quoteSchema>['body'];

export const createOrderSchema = z.object({
  body: z.object({ quoteId: uuid, conversationId: uuid.optional() }).strict(),
  params: z.object({}),
  query: z.object({})
});

export const listOrdersSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    role: z.enum(['buyer', 'seller', 'all']).default('all'),
    status: z.enum([
      'AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'RESERVED', 'PREPARING',
      'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED', 'COMPLETED', 'CANCELLED',
      'DISPUTED', 'REFUNDED'
    ]).optional(),
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const orderIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ orderId: uuid }),
  query: z.object({})
});

export const orderReasonSchema = z.object({
  body: z.object({ reason: z.string().trim().min(3).max(1_000) }).strict(),
  params: z.object({ orderId: uuid }),
  query: z.object({})
});
