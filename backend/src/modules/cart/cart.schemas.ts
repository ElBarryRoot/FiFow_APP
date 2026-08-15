import { z } from 'zod';

const uuid = z.string().uuid();
const quantity = z.coerce.number().int().min(1).max(99);
const empty = z.unknown().optional();

export const cartReadSchema = z.object({
  body: empty,
  params: z.object({}),
  query: z.object({})
});

export const addCartItemSchema = z.object({
  body: z.object({ productId: uuid, quantity: quantity.default(1) }).strict(),
  params: z.object({}),
  query: z.object({})
});

export const updateCartItemSchema = z.object({
  body: z.object({ quantity }).strict(),
  params: z.object({ itemId: uuid }),
  query: z.object({})
});

export const cartItemIdSchema = z.object({
  body: empty,
  params: z.object({ itemId: uuid }),
  query: z.object({})
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>['body'];
