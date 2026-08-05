import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import morgan from 'morgan';
import { corsOrigins, isProduction } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import { requestId } from './middlewares/requestId.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { sanitizeInput } from './middlewares/sanitize.middleware.js';
import routes from './routes.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || !isProduction || corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origine CORS non autorisée'));
    },
    credentials: true
  }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);
  app.use(hpp());
  app.use(globalRateLimiter);
  app.use(morgan(isProduction ? 'combined' : 'dev', { stream: { write: (message) => logger.info(message.trim()) } }));

  setupSwagger(app);
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
