import { z } from 'zod';

const optionalObjectId = z.string().regex(/^[a-f\d]{24}$/i, 'ObjectId invalide.').nullable().optional();

export const listCategoriesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    includeInactive: z.enum(['true', 'false']).optional(),
    parentId: optionalObjectId,
    rootOnly: z.enum(['true', 'false']).optional()
  }).optional()
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug invalide.'),
    description: z.string().max(500).optional(),
    parentId: optionalObjectId,
    iconUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
    isSensitive: z.boolean().optional(),
    requiresAdminValidation: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(500).nullable().optional(),
    parentId: optionalObjectId,
    iconUrl: z.string().url().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    isActive: z.boolean().optional(),
    isSensitive: z.boolean().optional(),
    requiresAdminValidation: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional()
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional()
});
