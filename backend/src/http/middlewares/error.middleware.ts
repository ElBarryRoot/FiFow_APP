import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { isProduction } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../../shared/errors/api-error.js';

export const notFound: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, `Route introuvable: ${request.method} ${request.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  if (response.headersSent) {
    _next(error);
    return;
  }

  let apiError: ApiError;
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    apiError = new ApiError(
      409,
      'Une ressource avec ces informations existe déjà.',
      'RESOURCE_CONFLICT'
    );
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    apiError = new ApiError(404, 'Ressource introuvable.', 'RESOURCE_NOT_FOUND');
  } else if (error instanceof ZodError) {
    apiError = new ApiError(
      400,
      'Validation échouée.',
      'VALIDATION_ERROR',
      error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    );
  } else {
    apiError = new ApiError(500, 'Une erreur interne est survenue.', 'INTERNAL_ERROR');
  }

  const originalError = error instanceof Error ? error : new Error(String(error));
  logger.log(apiError.statusCode >= 500 ? 'error' : 'warn', 'Erreur API', {
    requestId: request.requestId,
    method: request.method,
    path: request.originalUrl,
    statusCode: apiError.statusCode,
    errorCode: apiError.errorCode,
    error: originalError.message,
    stack: isProduction ? undefined : originalError.stack
  });

  response.status(apiError.statusCode).json({
    success: false,
    message: apiError.statusCode >= 500 && isProduction ? 'Erreur interne du serveur.' : apiError.message,
    errorCode: apiError.errorCode,
    details: apiError.details,
    requestId: request.requestId
  });
};
