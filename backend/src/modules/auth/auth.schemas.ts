import { z } from 'zod';

const password = z
  .string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
  .max(72, 'Le mot de passe est trop long.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Le mot de passe est trop long.')
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value),
    'Le mot de passe doit contenir une minuscule, une majuscule et un chiffre.'
  );

const email = z.string().trim().toLowerCase().email().max(254);
const optionalPhone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/, 'Numéro de téléphone invalide.')
  .optional();

export const registerSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(80),
      email,
      password,
      passwordConfirmation: z.string(),
      phone: optionalPhone,
      commune: z.string().trim().min(2).max(80).optional(),
      quartier: z.string().trim().min(2).max(80).optional(),
      acceptedTerms: z.literal(true)
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      path: ['passwordConfirmation'],
      message: 'Les mots de passe ne correspondent pas.'
    }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1).max(72) }),
  params: z.object({}),
  query: z.object({})
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(32).max(200) }),
  params: z.object({}),
  query: z.object({})
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
  params: z.object({}),
  query: z.object({})
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(32).max(200),
      password,
      passwordConfirmation: z.string()
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      path: ['passwordConfirmation'],
      message: 'Les mots de passe ne correspondent pas.'
    }),
  params: z.object({}),
  query: z.object({})
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(1, 'Le mot de passe actuel est requis.')
        .max(72, 'Le mot de passe actuel est trop long.')
        .refine(
          (value) => Buffer.byteLength(value, 'utf8') <= 72,
          'Le mot de passe actuel est trop long.'
        ),
      password,
      passwordConfirmation: z.string()
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      path: ['passwordConfirmation'],
      message: 'Les mots de passe ne correspondent pas.'
    })
    .refine((data) => data.password !== data.currentPassword, {
      path: ['password'],
      message: 'Le nouveau mot de passe doit être différent du mot de passe actuel.'
    }),
  params: z.object({}),
  query: z.object({})
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
