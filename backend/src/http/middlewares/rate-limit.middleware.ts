import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60_000,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (request) => request.path.startsWith('/health/'),
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: 'Trop de requêtes. Réessayez plus tard.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      details: []
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * 60_000,
  limit: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: 'Trop de tentatives. Réessayez plus tard.',
      errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
      details: []
    });
  }
});
