import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant MongoDB invalide.');

export const reorderImagesSchema = z.object({
  body: z.object({
    images: z.array(z.object({ imageId: objectId, sortOrder: z.coerce.number().int().min(0) })).min(1).max(6)
  })
});
