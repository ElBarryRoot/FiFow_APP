import winston from 'winston';
import { env, isProduction } from '../config/env.js';

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fi-fow-backend' },
  transports: [new winston.transports.Console({ format: isProduction ? winston.format.json() : winston.format.simple() })]
});
