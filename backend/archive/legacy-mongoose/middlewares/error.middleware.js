import { isProduction } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route introuvable: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = statusCode >= 500 && isProduction ? 'Erreur interne du serveur.' : err.message;

  logger.error('Erreur API', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorCode,
    message: err.message,
    stack: isProduction ? undefined : err.stack
  });

  return errorResponse(res, {
    statusCode,
    message,
    errorCode,
    details: err.details || []
  });
}
