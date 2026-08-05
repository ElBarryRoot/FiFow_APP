import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 12);

export function generateReference(prefix = 'FI') {
  return `${prefix}-${Date.now()}-${nanoid()}`;
}
