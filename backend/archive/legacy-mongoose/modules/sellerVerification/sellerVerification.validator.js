import { z } from 'zod';

export const sellerVerificationRequestSchema = z.object({
  body: z.object({
    avatarUrl: z.string().url('Photo de profil obligatoire.'),
    commune: z.string().min(2).max(80),
    quartier: z.string().min(2).max(80),
    note: z.string().max(1000).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const rejectSellerVerificationSchema = z.object({
  body: z.object({
    reason: z.string().min(5).max(1000)
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional()
});
