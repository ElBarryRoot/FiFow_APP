import { z } from 'zod';

const uuid = z.string().uuid();

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(80).optional(),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ]{8,20}$/)
        .nullable()
        .optional(),
      commune: z.string().trim().min(2).max(80).nullable().optional(),
      quartier: z.string().trim().min(2).max(80).nullable().optional()
    })
    .refine((body) => Object.keys(body).length > 0, 'Aucune modification fournie.'),
  params: z.object({}),
  query: z.object({})
});

export const userIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ userId: uuid }),
  query: z.object({})
});

export const blockUserSchema = z.object({
  body: z.object({ reason: z.string().trim().max(500).optional() }),
  params: z.object({ userId: uuid }),
  query: z.object({})
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
