import { Router } from 'express';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import {
  createSupportTicketSchema,
  listSupportTicketsSchema,
  supportMessageSchema,
  supportTicketIdSchema
} from './support.schemas.js';
import { supportService } from './support.service.js';

export const supportRoutes = Router();
supportRoutes.use(authenticate, requireVerifiedEmail);

supportRoutes.post('/tickets', validate(createSupportTicketSchema), asyncHandler(async (request, response) => {
  const { body } = request.validated as {
    body: { topic?: string; category?: string; subject?: string; reference?: string; message: string };
  };
  return sendSuccess(response, {
    statusCode: 201,
    data: await supportService.create(request.auth!.userId, body),
    message: 'Votre demande a ete transmise au support.'
  });
}));

supportRoutes.get('/tickets', validate(listSupportTicketsSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as {
    query: {
      status?: import('@prisma/client').SupportTicketStatus;
      cursor?: string;
      limit: number;
    };
  };
  const result = await supportService.list(request.auth!.userId, query);
  return sendSuccess(response, { data: result.items, meta: { nextCursor: result.nextCursor } });
}));

supportRoutes.get('/tickets/:ticketId', validate(supportTicketIdSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { ticketId: string } };
  return sendSuccess(response, {
    data: await supportService.detailForUser(request.auth!.userId, params.ticketId)
  });
}));

supportRoutes.post('/tickets/:ticketId/messages', validate(supportMessageSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { ticketId: string };
    body: { message: string };
  };
  return sendSuccess(response, {
    statusCode: 201,
    data: await supportService.userMessage(request.auth!.userId, params.ticketId, body.message),
    message: 'Message envoye au support.'
  });
}));
