import { z } from 'zod';

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    isRead: z.enum(['true', 'false']).optional()
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional()
});

export const notificationIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'ID invalide.') }),
  query: z.object({}).optional(),
  body: z.object({}).optional()
});
