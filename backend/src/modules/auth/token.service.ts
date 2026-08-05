import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { parseDurationSeconds, randomToken } from '../../shared/security/crypto.js';

const ACCESS_ISSUER = 'fifow-api';
const ACCESS_AUDIENCE = 'fifow-web';

type AccessClaims = {
  sub: string;
  sessionId: string;
  role: string;
};

export function signAccessToken(claims: AccessClaims) {
  return jwt.sign(
    {
      sessionId: claims.sessionId,
      role: claims.role
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      subject: claims.sub,
      issuer: ACCESS_ISSUER,
      audience: ACCESS_AUDIENCE,
      expiresIn: parseDurationSeconds(env.JWT_ACCESS_EXPIRES_IN)
    }
  );
}

export function verifyAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ACCESS_ISSUER,
      audience: ACCESS_AUDIENCE
    }) as JwtPayload;

    if (!payload.sub || typeof payload['sessionId'] !== 'string' || typeof payload['role'] !== 'string') {
      throw new Error('Claims JWT incomplets.');
    }

    return {
      userId: payload.sub,
      sessionId: payload['sessionId'],
      role: payload['role'],
      expiresAt: typeof payload.exp === 'number' ? payload.exp * 1000 : Date.now()
    };
  } catch {
    throw new ApiError(401, 'Session invalide ou expirée.', 'INVALID_ACCESS_TOKEN');
  }
}

export function createRefreshSecret() {
  return randomToken(48);
}

export function formatRefreshToken(sessionId: string, secret: string) {
  return `${sessionId}.${secret}`;
}

export function parseRefreshToken(token: string) {
  const separator = token.indexOf('.');
  if (separator < 1) throw new ApiError(401, 'Session invalide.', 'INVALID_REFRESH_TOKEN');

  const sessionId = token.slice(0, separator);
  const secret = token.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || secret.length < 40) {
    throw new ApiError(401, 'Session invalide.', 'INVALID_REFRESH_TOKEN');
  }
  return { sessionId, secret };
}

export function refreshExpiryDate() {
  return new Date(Date.now() + parseDurationSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000);
}

export function refreshMaxAgeMs() {
  return parseDurationSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000;
}
