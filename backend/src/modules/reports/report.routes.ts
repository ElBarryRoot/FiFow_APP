import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { reportService } from './report.service.js';

const schema = z.object({
  body: z.object({
    targetType: z.enum(['PRODUCT', 'USER', 'MESSAGE', 'REVIEW', 'PAYMENT', 'CONVERSATION', 'ORDER']),
    targetId: z.string().uuid(),
    reason: z.enum([
      'SCAM', 'FAKE_PRODUCT', 'FORBIDDEN_PRODUCT', 'BAD_BEHAVIOR', 'OFFENSIVE_CONTENT',
      'MISLEADING_PRICE', 'STOLEN_IMAGE', 'UNREACHABLE_SELLER', 'PAYMENT_ISSUE',
      'DELIVERY_ISSUE', 'OTHER'
    ]),
    description: z.string().trim().max(1_200).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const reportRoutes = Router();
reportRoutes.post('/', authenticate, requireVerifiedEmail, validate(schema), asyncHandler(async (req, res) => {
  const { body } = req.validated as { body: Parameters<typeof reportService.create>[0] };
  return sendSuccess(res, {
    statusCode: 201,
    data: await reportService.create({ ...body, reporterId: req.auth!.userId }),
    message: 'Signalement transmis.'
  });
}));
