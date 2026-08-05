import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant MongoDB invalide.');

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['PRODUCT', 'USER', 'MESSAGE', 'REVIEW', 'PAYMENT', 'CONVERSATION']),
    targetId: objectId,
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

export const reportListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    targetType: z.enum(['PRODUCT', 'USER', 'MESSAGE', 'REVIEW', 'PAYMENT', 'CONVERSATION']).optional()
  })
});

export const assignReportSchema = z.object({
  body: z.object({
    assignedTo: objectId.optional()
  })
});

export const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['RESOLVED', 'REJECTED']),
    adminDecision: z.string().trim().min(3).max(1000),
    adminNote: z.string().trim().max(1000).optional()
  })
});

export const moderationActionSchema = z.object({
  body: z.object({
    targetType: z.enum(['PRODUCT', 'USER', 'MESSAGE', 'REVIEW', 'PAYMENT', 'CONVERSATION', 'ORDER']),
    targetId: objectId,
    action: z.enum(['WARNING', 'HIDE_PRODUCT', 'ARCHIVE_PRODUCT', 'SUSPEND_USER', 'BAN_USER', 'REMOVE_VERIFIED_BADGE', 'RESTORE_PRODUCT', 'HIDE_REVIEW', 'RESTORE_REVIEW', 'REJECT_REPORT', 'BLOCK_CONVERSATION']),
    reason: z.string().trim().min(3).max(600),
    note: z.string().trim().max(1200).optional(),
    durationDays: z.coerce.number().int().positive().max(365).optional()
  })
});
