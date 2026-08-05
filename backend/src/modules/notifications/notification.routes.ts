import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { notificationService } from './notification.service.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { validate } from '../../http/middlewares/validate.middleware.js';

const listSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30)
  })
});
const idSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ notificationId: z.string().uuid() }),
  query: z.object({})
});

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get('/', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number } };
  const result = await notificationService.list(request.auth!.userId, query.cursor, query.limit);
  return sendSuccess(response, {
    data: result.items,
    meta: { nextCursor: result.nextCursor, unreadCount: result.unreadCount }
  });
}));
notificationRoutes.patch('/read-all', asyncHandler(async (request, response) => {
  await notificationService.markAllRead(request.auth!.userId);
  return sendSuccess(response, { data: null, message: 'Notifications marquées comme lues.' });
}));
notificationRoutes.patch('/:notificationId/read', validate(idSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { notificationId: string } };
  await notificationService.markRead(request.auth!.userId, params.notificationId);
  return sendSuccess(response, { data: null, message: 'Notification marquée comme lue.' });
}));
