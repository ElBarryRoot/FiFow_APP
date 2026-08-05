import { z } from 'zod';

const uuid = z.string().uuid();
const emptyBody = z.unknown().optional();
const price = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{2,14}$/, 'Le prix doit être un entier positif en GNF.');
const handoverMode = z.enum(['HAND_TO_HAND', 'HOME_DELIVERY', 'PICKUP_POINT']);
const productCondition = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'TO_REPAIR']);

const productFields = {
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(10_000),
  price,
  condition: productCondition,
  isNegotiable: z.boolean(),
  categoryId: uuid,
  subcategoryId: uuid,
  commune: z.string().trim().min(2).max(80),
  quartier: z.string().trim().min(2).max(80),
  handoverModes: z.array(handoverMode).min(1).max(3)
};

export const createProductSchema = z.object({
  body: z.object(productFields),
  params: z.object({}),
  query: z.object({})
});

export const updateProductSchema = z.object({
  body: z
    .object({
      title: productFields.title.optional(),
      description: productFields.description.optional(),
      price: productFields.price.optional(),
      condition: productFields.condition.optional(),
      isNegotiable: productFields.isNegotiable.optional(),
      categoryId: productFields.categoryId.optional(),
      subcategoryId: productFields.subcategoryId.optional(),
      commune: productFields.commune.optional(),
      quartier: productFields.quartier.optional(),
      handoverModes: productFields.handoverModes.optional()
    })
    .refine((body) => Object.keys(body).length > 0, 'Aucune modification fournie.'),
  params: z.object({ productId: uuid }),
  query: z.object({})
});

export const productIdSchema = z.object({
  body: emptyBody,
  params: z.object({ productId: uuid }),
  query: z.object({})
});

export const productImageIdSchema = z.object({
  body: emptyBody,
  params: z.object({ productId: uuid, imageId: uuid }),
  query: z.object({})
});

export const reorderProductImagesSchema = z.object({
  body: z.object({ imageIds: z.array(uuid).min(1).max(12) }),
  params: z.object({ productId: uuid }),
  query: z.object({})
});

export const productSlugSchema = z.object({
  body: emptyBody,
  params: z.object({ slug: z.string().trim().min(3).max(160) }),
  query: z.object({})
});

export const listProductsSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(24),
    search: z.string().trim().min(2).max(100).optional(),
    sellerId: uuid.optional(),
    verified: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    boosted: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    category: z.string().trim().max(100).optional(),
    subcategory: z.string().trim().max(100).optional(),
    commune: z.string().trim().max(80).optional(),
    condition: productCondition.optional(),
    minPrice: price.optional(),
    maxPrice: price.optional(),
    negotiable: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sort: z.enum(['recent', 'price_asc', 'price_desc']).default('recent')
  })
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsInput = z.infer<typeof listProductsSchema>['query'];
