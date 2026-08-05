import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(80).optional(),
    commune: z.string().min(2).max(80).optional(),
    quartier: z.string().min(2).max(80).optional(),
    avatarUrl: z.string().url().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const reportUserSchema = z.object({
  body: z.object({
    reason: z.enum(['SCAM', 'BAD_BEHAVIOR', 'OFFENSIVE_CONTENT', 'UNREACHABLE_SELLER', 'OTHER']),
    description: z.string().max(1200).optional()
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional()
});

export const blockUserSchema = z.object({
  body: z.object({ reason: z.string().max(300).optional() }).optional(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional()
});
