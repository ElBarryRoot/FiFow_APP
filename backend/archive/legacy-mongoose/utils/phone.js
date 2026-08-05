import { ApiError } from './apiError.js';

export function normalizePhone(phone) {
  const raw = String(phone || '').trim().replace(/[\s.-]/g, '');
  if (!raw) throw new ApiError(400, 'Le numéro de téléphone est obligatoire.', 'PHONE_REQUIRED');

  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('00')) return `+${raw.slice(2)}`;
  if (/^6\d{8}$/.test(raw)) return `+224${raw}`;
  if (/^2246\d{8}$/.test(raw)) return `+${raw}`;

  throw new ApiError(400, 'Format de téléphone invalide. Utilise un numéro guinéen valide.', 'INVALID_PHONE');
}
