import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { emitToConversation, emitToUser } from '../../shared/realtime.js';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { offerService } from './offer.service.js';

const uuid = z.string().uuid();
const amount = z.string().regex(/^[1-9][0-9]{2,14}$/);
const mode = z.enum(['HAND_TO_HAND', 'HOME_DELIVERY', 'PICKUP_POINT']);
const createSchema = z.object({
  body: z.object({ amount, handoverMode: mode, message: z.string().trim().max(500).optional() }),
  params: z.object({ conversationId: uuid }),
  query: z.object({})
});
const responseSchema = z.object({
  body: z
    .object({
      action: z.enum(['ACCEPT', 'REJECT', 'COUNTER']),
      amount: amount.optional(),
      handoverMode: mode.optional(),
      message: z.string().trim().max(500).optional()
    })
    .superRefine((value, context) => {
      if (value.action === 'COUNTER' && (!value.amount || !value.handoverMode)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Montant et mode requis.' });
      }
    }),
  params: z.object({ offerId: uuid }),
  query: z.object({})
});

function serialize<T extends { amount: bigint; expiresAt: Date; createdAt: Date }>(offer: T) {
  return {
    ...offer,
    amount: offer.amount.toString(),
    expiresAt: offer.expiresAt.toISOString(),
    createdAt: offer.createdAt.toISOString()
  };
}

export const offerRoutes = Router();
offerRoutes.use(authenticate, requireVerifiedEmail);
offerRoutes.post(
  '/conversations/:conversationId/offers',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { params, body } = req.validated as {
      params: { conversationId: string };
      body: { amount: string; handoverMode: 'HAND_TO_HAND' | 'HOME_DELIVERY' | 'PICKUP_POINT'; message?: string };
    };
    const result = await offerService.create(req.auth!.userId, params.conversationId, body);
    emitToConversation(result.conversationId, 'offer:new', serialize(result.offer));
    emitToUser(result.notifyUserId, 'notification:new', result.notification);
    return sendSuccess(res, { statusCode: 201, data: serialize(result.offer), message: 'Offre envoyée.' });
  })
);
offerRoutes.patch(
  '/offers/:offerId',
  validate(responseSchema),
  asyncHandler(async (req, res) => {
    const { params, body } = req.validated as {
      params: { offerId: string };
      body: {
        action: 'ACCEPT' | 'REJECT' | 'COUNTER';
        amount?: string;
        handoverMode?: 'HAND_TO_HAND' | 'HOME_DELIVERY' | 'PICKUP_POINT';
        message?: string;
      };
    };
    const result = await offerService.respond(req.auth!.userId, params.offerId, body);
    emitToConversation(result.conversationId, 'offer:updated', serialize(result.offer));
    emitToUser(result.notifyUserId, 'notification:new', result.notification);
    return sendSuccess(res, { data: serialize(result.offer), message: 'Offre mise à jour.' });
  })
);
