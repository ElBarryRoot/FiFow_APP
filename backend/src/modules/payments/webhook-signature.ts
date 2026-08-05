import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWebhookSignature(
  rawBody: Buffer | undefined,
  signature: string | undefined,
  secret: string
) {
  if (!rawBody || !signature) return false;

  const supplied = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (!/^[a-fA-F0-9]{64}$/.test(supplied)) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(supplied, 'hex');
  return received.length === expected.length && timingSafeEqual(expected, received);
}
