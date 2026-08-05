import { Router } from 'express';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import {
  adminSupportIdSchema,
  adminSupportListSchema,
  adminSupportMessageSchema,
  adminSupportStatusSchema
} from './support.schemas.js';
import { supportService, type SupportAuditContext } from './support.service.js';

function context(request: import('express').Request): SupportAuditContext {
  return {
    ...(request.requestId ? { requestId: request.requestId } : {}),
    ...(request.ip ? { ipAddress: request.ip } : {}),
    ...(request.get('user-agent') ? { userAgent: request.get('user-agent')! } : {})
  };
}

export const supportAdminRoutes = Router();

supportAdminRoutes.get('/', validate(adminSupportListSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as {
    query: {
      status?: import('@prisma/client').SupportTicketStatus;
      priority?: import('@prisma/client').SupportTicketPriority;
      assigned: 'me' | 'unassigned' | 'all';
      search?: string;
      cursor?: string;
      limit: number;
    };
  };
  const result = await supportService.adminList(request.auth!.userId, query);
  return sendSuccess(response, { data: result.items, meta: { nextCursor: result.nextCursor } });
}));

supportAdminRoutes.get('/:id', validate(adminSupportIdSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  return sendSuccess(response, { data: await supportService.detailForAdmin(params.id) });
}));

supportAdminRoutes.patch('/:id/assign', validate(adminSupportIdSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  return sendSuccess(response, {
    data: await supportService.assign(request.auth!.userId, params.id, context(request)),
    message: 'Ticket assigne.'
  });
}));

supportAdminRoutes.patch('/:id/status', validate(adminSupportStatusSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { id: string };
    body: { status: import('@prisma/client').SupportTicketStatus };
  };
  return sendSuccess(response, {
    data: await supportService.adminStatus(request.auth!.userId, params.id, body.status, context(request)),
    message: 'Statut du ticket mis a jour.'
  });
}));

supportAdminRoutes.post('/:id/messages', validate(adminSupportMessageSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as { params: { id: string }; body: { message: string } };
  return sendSuccess(response, {
    statusCode: 201,
    data: await supportService.adminMessage(request.auth!.userId, params.id, body.message, context(request)),
    message: 'Reponse envoyee.'
  });
}));
