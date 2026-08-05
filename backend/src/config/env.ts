import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return value;
  }, z.boolean());

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    API_PUBLIC_URL: z.string().url().default('http://localhost:5000'),
    WEB_APP_URL: z.string().url().default('http://localhost:5173'),
    DATABASE_URL: z.string().min(20),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: z.string().min(64),
    JWT_REFRESH_SECRET: z.string().min(64),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    REFRESH_COOKIE_NAME: z.string().regex(/^[a-zA-Z0-9_-]+$/).default('fifow_refresh'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    EMAIL_AUTH_ENABLED: booleanFromEnv(true),
    EMAIL_VERIFICATION_REQUIRED: booleanFromEnv(true),
    EMAIL_DRIVER: z.enum(['console']).default('console'),
    EMAIL_FROM: z.string().email().default('no-reply@fifow.local'),
    EMAIL_TOKEN_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
    PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(180).default(20),
    SMS_AUTH_ENABLED: booleanFromEnv(false),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
    AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    SWAGGER_ENABLED: booleanFromEnv(true),
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    STORAGE_LOCAL_ROOT: z.string().default('./storage/uploads'),
    STORAGE_PUBLIC_PATH: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).default('/uploads'),
    MAX_IMAGE_BYTES: z.coerce.number().int().min(1024).max(20 * 1024 * 1024).default(5 * 1024 * 1024),
    MAX_PRODUCT_IMAGES: z.coerce.number().int().min(1).max(12).default(6),
    PAYMENT_ENABLED: booleanFromEnv(false),
    PAYMENT_SANDBOX_ENABLED: booleanFromEnv(false),
    PAYMENT_PROVIDER: z.enum(['MOCK', 'ORANGE_MONEY', 'MTN_MOMO', 'OTHER']).default('MOCK'),
    PAYMENT_PROVIDER_KEY: z.string().default(''),
    PAYMENT_WEBHOOK_SECRET: z.string().min(64),
    BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional().or(z.literal('')),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional().or(z.literal(''))
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production') {
      for (const [field, secret] of [
        ['JWT_ACCESS_SECRET', value.JWT_ACCESS_SECRET],
        ['JWT_REFRESH_SECRET', value.JWT_REFRESH_SECRET],
        ['PAYMENT_WEBHOOK_SECRET', value.PAYMENT_WEBHOOK_SECRET]
      ] as const) {
        if (secret.includes('CHANGE_ME')) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} doit être remplacé en production.`
          });
        }
      }

      if (value.STORAGE_DRIVER === 'local') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STORAGE_DRIVER'],
          message: 'Le stockage local est interdit en production multi-instance.'
        });
      }

      if (value.EMAIL_DRIVER === 'console') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EMAIL_DRIVER'],
          message: 'Le fournisseur email console est interdit en production.'
        });
      }
    }

    if (value.PAYMENT_SANDBOX_ENABLED && !['development', 'test'].includes(value.NODE_ENV)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMENT_SANDBOX_ENABLED'],
        message: 'Le bac a sable de paiement est interdit hors developpement et test.'
      });
    }

    if (value.PAYMENT_SANDBOX_ENABLED && value.PAYMENT_PROVIDER !== 'MOCK') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMENT_PROVIDER'],
        message: 'Le bac a sable exige le fournisseur MOCK.'
      });
    }

    if (value.PAYMENT_ENABLED && value.PAYMENT_PROVIDER === 'MOCK' && !value.PAYMENT_SANDBOX_ENABLED) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMENT_PROVIDER'],
        message: 'Le fournisseur MOCK exige PAYMENT_SANDBOX_ENABLED=true.'
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Configuration Fi Fow invalide:\n${messages}`);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  STORAGE_LOCAL_ROOT: path.resolve(process.cwd(), parsed.data.STORAGE_LOCAL_ROOT)
};

export type AppEnvironment = typeof env;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
