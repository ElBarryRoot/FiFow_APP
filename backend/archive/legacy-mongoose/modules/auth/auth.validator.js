import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(6),
    purpose: z.enum(['LOGIN', 'REGISTER', 'VERIFY_PHONE']).default('LOGIN')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(6),
    otp: z.string().min(4).max(8),
    fullName: z.string().min(2).max(80).optional(),
    commune: z.string().min(2).max(80).optional(),
    quartier: z.string().min(2).max(80).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const refreshTokenSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20) }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
