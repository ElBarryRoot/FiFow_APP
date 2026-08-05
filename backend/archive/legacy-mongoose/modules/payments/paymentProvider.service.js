import crypto from 'crypto';
import { env } from '../../config/env.js';

export function buildMockPaymentIntent(payment) {
  return {
    provider: payment.provider,
    internalReference: payment.internalReference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    message: 'Paiement initialisé. Le statut final doit venir du webhook/callback serveur.'
  };
}

export function verifyWebhookSignature(req) {
  if (!env.PAYMENT_WEBHOOK_SECRET) return env.NODE_ENV !== 'production';

  const providedSignature = req.headers['x-fi-fow-signature'];
  if (!providedSignature) return false;

  const rawPayload = JSON.stringify(req.body || {});
  const expectedSignature = crypto
    .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
    .update(rawPayload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));
}
