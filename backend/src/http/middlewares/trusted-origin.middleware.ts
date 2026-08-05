import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../shared/errors/api-error.js';

export const requireTrustedOrigin: RequestHandler = (request, _response, next) => {
  const origin = request.get('origin');
  const fetchSite = request.get('sec-fetch-site');

  if (fetchSite === 'cross-site' || (origin && !env.CORS_ORIGINS.includes(origin))) {
    return next(new ApiError(403, 'Origine de requête non autorisée.', 'UNTRUSTED_ORIGIN'));
  }
  return next();
};
