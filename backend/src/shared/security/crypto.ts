import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function safeTokenEquals(rawToken: string, expectedHash: string) {
  const actual = Buffer.from(hashToken(rawToken), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function parseDurationSeconds(value: string) {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error(`Durée invalide: ${value}`);

  const amount = Number(match[1]!);
  const unit = match[2]!;
  const factors: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * (factors[unit] ?? 0);
}
