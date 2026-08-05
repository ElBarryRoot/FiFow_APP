import { z } from 'zod';

export const updateSettingSchema = z.object({
  params: z.object({ key: z.string().min(2).max(80).regex(/^[a-z0-9_.-]+$/) }),
  body: z.object({
    value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
    valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional()
  }),
  query: z.object({}).optional()
});
