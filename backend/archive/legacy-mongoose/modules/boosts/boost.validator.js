import { z } from 'zod';

export const listBoostPlansSchema = z.object({
  query: z.object({ activeOnly: z.enum(['true', 'false']).default('true') }),
  params: z.object({}).optional(),
  body: z.object({}).optional()
});

export const createBoostSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'ID produit invalide.') }),
  body: z.object({
    boostPlanId: z.string().regex(/^[a-f\d]{24}$/i, 'ID pack boost invalide.'),
    provider: z.enum(['ORANGE_MONEY', 'MOMO', 'OTHER', 'MOCK']),
    phone: z.string().trim().min(8).max(20)
  }),
  query: z.object({}).optional()
});

export const listMyBoostsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED']).optional()
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional()
});

export const adminListBoostsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED']).optional()
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional()
});

export const cancelBoostSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'ID boost invalide.') }),
  body: z.object({ reason: z.string().trim().min(3).max(600).default('Annulation administrative.') }),
  query: z.object({}).optional()
});

export const createBoostPlanSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(80),
    slug: z.string().trim().min(3).max(90).regex(/^[a-z0-9-]+$/, 'Slug invalide.').optional(),
    durationHours: z.coerce.number().int().positive(),
    price: z.coerce.number().positive(),
    placement: z.enum(['HOME_FEED', 'SEARCH_RESULTS', 'CATEGORY_PAGE', 'SIMILAR_PRODUCTS']).default('HOME_FEED'),
    isActive: z.boolean().default(true)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateBoostPlanSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'ID pack boost invalide.') }),
  body: z.object({
    name: z.string().trim().min(3).max(80).optional(),
    durationHours: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().positive().optional(),
    placement: z.enum(['HOME_FEED', 'SEARCH_RESULTS', 'CATEGORY_PAGE', 'SIMILAR_PRODUCTS']).optional(),
    isActive: z.boolean().optional()
  }),
  query: z.object({}).optional()
});
