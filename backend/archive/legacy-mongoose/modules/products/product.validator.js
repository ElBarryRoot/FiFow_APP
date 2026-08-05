import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant MongoDB invalide.');

const handoverModeEnum = z.enum(['HAND_TO_HAND', 'EXTERNAL_DELIVERY', 'FUTURE_DELIVERY']);
const conditionEnum = z.enum(['NEW', 'USED', 'REFURBISHED']);

export const productListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(120).optional(),
    categoryId: objectId.optional(),
    subCategoryId: objectId.optional(),
    commune: z.string().trim().max(80).optional(),
    quartier: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    condition: conditionEnum.optional(),
    sort: z.enum(['recent', 'price_asc', 'price_desc', 'popular']).default('recent')
  })
});

export const productCreateSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(20).max(2000),
    price: z.coerce.number().positive(),
    categoryId: objectId,
    subCategoryId: objectId,
    condition: conditionEnum,
    isNegotiable: z.boolean(),
    commune: z.string().trim().min(2).max(80),
    quartier: z.string().trim().min(2).max(80),
    handoverModes: z.array(handoverModeEnum).min(1).max(3)
  })
});

export const productUpdateSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(120).optional(),
    description: z.string().trim().min(20).max(2000).optional(),
    price: z.coerce.number().positive().optional(),
    categoryId: objectId.optional(),
    subCategoryId: objectId.optional(),
    condition: conditionEnum.optional(),
    isNegotiable: z.boolean().optional(),
    commune: z.string().trim().min(2).max(80).optional(),
    quartier: z.string().trim().min(2).max(80).optional(),
    handoverModes: z.array(handoverModeEnum).min(1).max(3).optional()
  }).refine((data) => Object.keys(data).length > 0, 'Aucune donnée à modifier.')
});

export const reportProductSchema = z.object({
  body: z.object({
    reason: z.enum([
      'SCAM',
      'FAKE_PRODUCT',
      'FORBIDDEN_PRODUCT',
      'BAD_BEHAVIOR',
      'OFFENSIVE_CONTENT',
      'MISLEADING_PRICE',
      'STOLEN_IMAGE',
      'UNREACHABLE_SELLER',
      'OTHER'
    ]),
    description: z.string().trim().max(1000).optional()
  })
});
