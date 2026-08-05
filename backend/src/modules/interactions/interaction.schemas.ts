import { z } from 'zod';

export const interactionProductSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ productId: z.string().uuid() }),
  query: z.object({})
});
