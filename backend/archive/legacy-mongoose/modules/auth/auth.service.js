import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env, isDevelopment } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { normalizePhone } from '../../utils/phone.js';
import { compareOtp, generateOtp, hashOtp } from '../../utils/otp.js';
import { User } from '../users/user.model.js';
import { OtpCode } from './otp.model.js';

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id), type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, env.BCRYPT_SALT_ROUNDS);
  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
}

export async function sendOtp({ phone, purpose = 'LOGIN', ipAddress, userAgent }) {
  const normalizedPhone = normalizePhone(phone);

  const windowStart = new Date(Date.now() - env.OTP_RESEND_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await OtpCode.countDocuments({ phone: normalizedPhone, createdAt: { $gte: windowStart } });
  if (recentCount >= env.OTP_MAX_SENDS_PER_WINDOW) {
    throw new ApiError(429, 'Trop de demandes OTP. Réessaie plus tard.', 'OTP_SEND_LIMIT_EXCEEDED');
  }

  const otp = generateOtp();
  const codeHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000);

  await OtpCode.create({
    phone: normalizedPhone,
    codeHash,
    purpose,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    expiresAt,
    ipAddress,
    userAgent
  });

  // TODO Sprint production: brancher un fournisseur SMS réel ici.
  return {
    phone: normalizedPhone,
    expiresAt,
    devOtp: isDevelopment ? otp : undefined
  };
}

export async function verifyOtp({ phone, otp, fullName, commune, quartier }) {
  const normalizedPhone = normalizePhone(phone);

  const otpDoc = await OtpCode.findOne({
    phone: normalizedPhone,
    verifiedAt: null,
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .select('+codeHash');

  if (!otpDoc) throw new ApiError(400, 'OTP invalide ou expiré.', 'OTP_INVALID_OR_EXPIRED');

  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    throw new ApiError(429, 'Nombre maximum de tentatives OTP atteint.', 'OTP_MAX_ATTEMPTS_REACHED');
  }

  const valid = await compareOtp(otp, otpDoc.codeHash);
  if (!valid) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw new ApiError(400, 'Code OTP incorrect.', 'OTP_INCORRECT');
  }

  otpDoc.verifiedAt = new Date();
  await otpDoc.save();

  let user = await User.findOne({ phone: normalizedPhone }).select('+refreshTokenHash');
  if (!user) {
    user = await User.create({
      phone: normalizedPhone,
      phoneVerified: true,
      fullName: fullName || null,
      commune: commune || null,
      quartier: quartier || null,
      status: 'ACTIVE'
    });
  } else {
    if (user.status === 'BANNED') throw new ApiError(403, 'Compte banni.', 'ACCOUNT_BANNED');
    if (user.status === 'DELETED') throw new ApiError(403, 'Compte archivé ou désactivé.', 'ACCOUNT_DELETED');
    user.phoneVerified = true;
    if (fullName && !user.fullName) user.fullName = fullName;
    if (commune && !user.commune) user.commune = commune;
    if (quartier && !user.quartier) user.quartier = quartier;
  }

  const tokens = await issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refreshToken({ refreshToken }) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Refresh token invalide.', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw new ApiError(401, 'Session expirée.', 'SESSION_EXPIRED');
  if (user.status === 'BANNED' || user.status === 'DELETED') throw new ApiError(403, 'Compte non autorisé.', 'ACCOUNT_NOT_ALLOWED');

  const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matches) throw new ApiError(401, 'Refresh token révoqué.', 'REFRESH_TOKEN_REVOKED');

  return issueTokens(user);
}

export async function logout(user) {
  user.refreshTokenHash = null;
  await user.save();
}

export function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    commune: user.commune,
    quartier: user.quartier,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    isVerifiedSeller: user.isVerifiedSeller,
    sellerVerificationStatus: user.sellerVerificationStatus,
    averageRating: user.averageRating,
    totalReviews: user.totalReviews,
    createdAt: user.createdAt
  };
}
