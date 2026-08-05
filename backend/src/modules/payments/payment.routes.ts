import { Router } from 'express';
import { z } from 'zod';
import { authRateLimit } from '../../http/middlewares/rate-limit.middleware.js';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import {
  initiatePaymentSchema,
  listPaymentsSchema,
  mockConfirmPaymentSchema,
  paymentIdSchema,
  payoutWebhookSchema,
  refundWebhookSchema,
  webhookSchema
} from './payment.schemas.js';
import { paymentService } from './payment.service.js';

export const paymentRoutes = Router();

paymentRoutes.post(
  '/webhook/:provider/payouts',
  authRateLimit,
  validate(payoutWebhookSchema),
  asyncHandler(async (request, response) => {
    const { params, body } = request.validated as {
      params: { provider: 'mock' | 'orange-money' | 'mtn-momo' | 'other' };
      body: {
        internalReference: string;
        providerEventId: string;
        providerTransactionId?: string;
        status: 'SUCCEEDED' | 'FAILED';
        failureReason?: string;
      };
    };
    const result = await paymentService.handlePayoutWebhook({
      providerSlug: params.provider,
      rawBody: request.rawBody,
      signature: request.get('x-fifow-signature'),
      payload: body
    });
    return sendSuccess(response, {
      data: result,
      message: 'Webhook de reversement traité.'
    });
  })
);

paymentRoutes.post(
  '/webhook/:provider/refunds',
  authRateLimit,
  validate(refundWebhookSchema),
  asyncHandler(async (request, response) => {
    const { params, body } = request.validated as {
      params: { provider: 'mock' | 'orange-money' | 'mtn-momo' | 'other' };
      body: {
        internalReference: string;
        providerEventId: string;
        providerTransactionId?: string;
        status: 'SUCCEEDED' | 'FAILED';
        failureReason?: string;
      };
    };
    const result = await paymentService.handleRefundWebhook({
      providerSlug: params.provider,
      rawBody: request.rawBody,
      signature: request.get('x-fifow-signature'),
      payload: body
    });
    return sendSuccess(response, { data: result, message: 'Webhook de remboursement traité.' });
  })
);

paymentRoutes.post(
  '/webhook/:provider',
  authRateLimit,
  validate(webhookSchema),
  asyncHandler(async (request, response) => {
    const { params, body } = request.validated as {
      params: { provider: 'mock' | 'orange-money' | 'mtn-momo' | 'other' };
      body: {
        internalReference: string;
        providerEventId: string;
        providerTransactionId?: string;
        status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
        failureCode?: string;
        failureReason?: string;
      };
    };
    const result = await paymentService.handleWebhook({
      providerSlug: params.provider,
      rawBody: request.rawBody,
      signature: request.get('x-fifow-signature'),
      payload: body
    });
    return sendSuccess(response, { data: result, message: 'Webhook traité.' });
  })
);

paymentRoutes.use(authenticate, requireVerifiedEmail);
paymentRoutes.post(
  '/initiate',
  validate(initiatePaymentSchema),
  asyncHandler(async (request, response) => {
    const idempotencyKey = request.get('idempotency-key');
    if (!idempotencyKey || !z.string().min(16).max(120).safeParse(idempotencyKey).success) {
      throw new ApiError(400, 'Clé d’idempotence requise.', 'IDEMPOTENCY_KEY_REQUIRED');
    }
    const { body } = request.validated as { body: { orderId: string; phone?: string } };
    return sendSuccess(response, {
      statusCode: 201,
      data: await paymentService.initiate(
        request.auth!.userId,
        body.orderId,
        idempotencyKey,
        body.phone
      ),
      message: 'Paiement initialisé.'
    });
  })
);
paymentRoutes.get(
  '/',
  validate(listPaymentsSchema),
  asyncHandler(async (request, response) => {
    const { query } = request.validated as { query: { cursor?: string; limit: number } };
    const result = await paymentService.list(request.auth!.userId, query.cursor, query.limit);
    return sendSuccess(response, {
      data: result.items,
      meta: { nextCursor: result.nextCursor }
    });
  })
);
paymentRoutes.post(
  '/:paymentId/mock-confirm',
  validate(mockConfirmPaymentSchema),
  asyncHandler(async (request, response) => {
    const { params, body } = request.validated as {
      params: { paymentId: string };
      body: { outcome: 'SUCCEEDED' | 'FAILED'; failureReason?: string };
    };
    return sendSuccess(response, {
      data: await paymentService.mockConfirm(
        request.auth!.userId,
        params.paymentId,
        body.outcome,
        body.failureReason
      ),
      message: body.outcome === 'SUCCEEDED'
        ? 'Paiement confirme dans le bac a sable.'
        : 'Echec simule dans le bac a sable.'
    });
  })
);
paymentRoutes.get(
  '/:paymentId',
  validate(paymentIdSchema),
  asyncHandler(async (request, response) => {
    const { params } = request.validated as { params: { paymentId: string } };
    return sendSuccess(response, {
      data: await paymentService.detail(request.auth!.userId, params.paymentId)
    });
  })
);
