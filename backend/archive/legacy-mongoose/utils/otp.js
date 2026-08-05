import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export function generateOtp() {
  const min = 10 ** (env.OTP_LENGTH - 1);
  const max = 10 ** env.OTP_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export async function hashOtp(code) {
  return bcrypt.hash(code, env.BCRYPT_SALT_ROUNDS);
}

export async function compareOtp(code, hash) {
  return bcrypt.compare(code, hash);
}
