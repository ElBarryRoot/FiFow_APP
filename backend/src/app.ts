import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { Request } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { env, isProduction } from './config/env.js';
import { errorHandler, notFound } from './http/middlewares/error.middleware.js';
import { globalRateLimit } from './http/middlewares/rate-limit.middleware.js';
import { requestId } from './http/middlewares/request-id.middleware.js';
import { requestLogger } from './http/middlewares/request-logger.middleware.js';
import { apiRoutes } from './http/routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', isProduction ? 1 : false);
  app.set('json replacer', (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value));

  app.use(requestId);
  app.use(requestLogger);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error('Origine CORS non autorisée.'));
      }
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(
    express.json({
      limit: '1mb',
      verify(request, _response, buffer) {
        (request as Request).rawBody = Buffer.from(buffer);
      }
    })
  );
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(hpp());
  app.use(globalRateLimit);

  if (env.STORAGE_DRIVER === 'local') {
    app.use(`${env.STORAGE_PUBLIC_PATH}/seller-verifications`, (_request, response) => {
      response.status(404).json({
        success: false,
        message: 'Ressource introuvable.',
        errorCode: 'RESOURCE_NOT_FOUND',
        details: []
      });
    });
    app.use(
      env.STORAGE_PUBLIC_PATH,
      express.static(env.STORAGE_LOCAL_ROOT, {
        dotfiles: 'deny',
        fallthrough: false,
        index: false,
        maxAge: isProduction ? '1d' : 0,
        immutable: isProduction
      })
    );
  }

  app.use('/api/v1', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
