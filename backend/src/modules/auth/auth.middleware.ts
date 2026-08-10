import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { verifyAccessToken } from './token.service.js';

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const [scheme, token] = (request.header('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED');
  }

  const claims = verifyAccessToken(token);
  const session = await prisma.session.findFirst({
    where: {
      id: claims.sessionId,
      userId: claims.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          role: true,
          status: true,
          emailVerifiedAt: true
        }
      }
    }
  });

  if (!session) throw new ApiError(401, 'Session révoquée ou expirée.', 'SESSION_NOT_AVAILABLE');
  if (session.user.status === 'BANNED' || session.user.status === 'ARCHIVED') {
    throw new ApiError(403, 'Compte non autorisé.', 'ACCOUNT_NOT_ALLOWED');
  }
  if (session.user.status === 'SUSPENDED') {
    throw new ApiError(403, 'Compte temporairement suspendu.', 'ACCOUNT_SUSPENDED');
  }

  request.auth = {
    userId: session.user.id,
    sessionId: session.id,
    role: session.user.role,
    emailVerified: Boolean(session.user.emailVerifiedAt)
  };
  next();
});

export const optionalAuthenticate: RequestHandler = (request, response, next) => {
  if (!request.header('authorization')) return next();
  return authenticate(request, response, next);
};

export const requireVerifiedEmail: RequestHandler = (request, _response, next) => {
  if (!request.auth) return next(new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED'));
  if (env.NODE_ENV !== 'production' && !request.auth.emailVerified) {
    return next();
  }
  if (!request.auth.emailVerified) {
    return next(new ApiError(403, 'Vérifiez votre adresse email pour continuer.', 'EMAIL_VERIFICATION_REQUIRED'));
  }
  return next();
};

export function requireRole(...roles: Array<'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'>): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) return next(new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED'));
    if (!roles.includes(request.auth.role as 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN')) {
      return next(new ApiError(403, 'Accès refusé.', 'ROLE_FORBIDDEN'));
    }
    return next();
  };
}
