import { Router } from 'express';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { conversationService } from './conversation.service.js';
import {
  conversationIdSchema,
  createConversationSchema,
  listConversationsSchema,
  listMessagesSchema,
  sendImageMessageSchema,
  sendMessageSchema
} from './conversation.schemas.js';
import { singleImage } from '../../http/middlewares/image-upload.middleware.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { validate } from '../../http/middlewares/validate.middleware.js';

export const conversationRoutes = Router();
conversationRoutes.use(authenticate, requireVerifiedEmail);
conversationRoutes.get('/', validate(listConversationsSchema), asyncHandler(async (req, res) => {
  const { query } = req.validated as { query: { cursor?: string; limit: number } };
  const result = await conversationService.list(req.auth!.userId, query.cursor, query.limit);
  return sendSuccess(res, {
    data: result.items,
    meta: { nextCursor: result.nextCursor, unreadCount: result.unreadCount }
  });
}));
conversationRoutes.post('/', validate(createConversationSchema), asyncHandler(async (req, res) => {
  const { body } = req.validated as { body: { productId: string } };
  const result = await conversationService.createOrGet(req.auth!.userId, body.productId);
  return sendSuccess(res, { statusCode: result.created ? 201 : 200, data: result.data, message: 'Conversation prête.' });
}));
conversationRoutes.get('/:conversationId', validate(conversationIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { conversationId: string } };
  return sendSuccess(res, { data: await conversationService.detail(req.auth!.userId, params.conversationId) });
}));
conversationRoutes.get('/:conversationId/messages', validate(listMessagesSchema), asyncHandler(async (req, res) => {
  const { params, query } = req.validated as {
    params: { conversationId: string };
    query: { cursor?: string; limit: number };
  };
  const result = await conversationService.messages(
    req.auth!.userId,
    params.conversationId,
    query.cursor,
    query.limit
  );
  return sendSuccess(res, {
    data: result.items,
    meta: {
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
      limit: query.limit
    }
  });
}));
conversationRoutes.post('/:conversationId/messages', validate(sendMessageSchema), asyncHandler(async (req, res) => {
  const { params, body } = req.validated as { params: { conversationId: string }; body: { text: string; clientId?: string } };
  const result = await conversationService.send(req.auth!.userId, params.conversationId, body.text, body.clientId);
  return sendSuccess(res, { statusCode: result.created ? 201 : 200, data: result.message });
}));
conversationRoutes.post(
  '/:conversationId/messages/images',
  singleImage,
  validate(sendImageMessageSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'Image obligatoire.', 'IMAGE_REQUIRED');
    }
    const { params, query } = req.validated as {
      params: { conversationId: string };
      query: { clientId?: string };
    };
    const result = await conversationService.sendImage(
      req.auth!.userId,
      params.conversationId,
      req.file.buffer,
      query.clientId
    );
    return sendSuccess(res, {
      statusCode: result.created ? 201 : 200,
      data: result.message
    });
  })
);
conversationRoutes.patch('/:conversationId/read', validate(conversationIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { conversationId: string } };
  await conversationService.read(req.auth!.userId, params.conversationId);
  return sendSuccess(res, { data: null, message: 'Conversation lue.' });
}));
conversationRoutes.post('/:conversationId/archive', validate(conversationIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { conversationId: string } };
  await conversationService.archive(req.auth!.userId, params.conversationId);
  return sendSuccess(res, { data: null, message: 'Conversation archivée.' });
}));
