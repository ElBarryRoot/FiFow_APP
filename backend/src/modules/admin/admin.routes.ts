import { randomBytes } from 'node:crypto';
import { Router, type Request } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import {
  emitBoostUpdated,
  emitOrderUpdated,
  emitPaymentUpdated,
  emitPayoutUpdated,
  emitToUser
} from '../../shared/realtime.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { authenticate, requireRole } from '../auth/auth.middleware.js';
import { paymentService } from '../payments/payment.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { supportAdminRoutes } from '../support/support.admin.routes.js';

const uuid = z.string().uuid();
const emptyBody = z.unknown().optional();
const idSchema = z.object({
  body: emptyBody,
  params: z.object({ id: uuid }),
  query: z.object({})
});
const verificationDocumentSchema = z.object({
  body: emptyBody,
  params: z.object({ id: uuid, documentIndex: z.coerce.number().int().min(0).max(2) }),
  query: z.object({})
});
const listSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    search: z.string().trim().max(100).optional(),
    status: z.string().max(50).optional()
  })
});
const adminLogListSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(40),
    search: z.string().trim().min(1).max(100).optional(),
    targetType: z.string().trim().min(1).max(80).optional()
  })
});
const resolveSchema = z.object({
  body: z.object({
    status: z.enum(['RESOLVED', 'REJECTED']),
    decision: z.string().trim().min(3).max(1_000),
    note: z.string().trim().max(1_000).optional()
  }),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const moderationSchema = z.object({
  body: z.object({
    targetType: z.enum(['PRODUCT', 'USER', 'REVIEW', 'CONVERSATION']),
    targetId: uuid,
    action: z.enum([
      'WARNING', 'HIDE_PRODUCT', 'ARCHIVE_PRODUCT', 'RESTORE_PRODUCT',
      'SUSPEND_USER', 'BAN_USER', 'RESTORE_USER', 'REMOVE_VERIFIED_BADGE',
      'HIDE_REVIEW', 'RESTORE_REVIEW', 'BLOCK_CONVERSATION', 'UNBLOCK_CONVERSATION'
    ]),
    reason: z.string().trim().min(3).max(600),
    note: z.string().trim().max(1_200).optional()
  }),
  params: z.object({}),
  query: z.object({})
});
const verificationDecisionSchema = z.object({
  body: z.object({ reason: z.string().trim().min(3).max(1_000).optional() }),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const categorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().regex(/^[a-z0-9-]{2,100}$/),
    parentId: uuid.nullable().optional(),
    description: z.string().trim().max(500).optional(),
    isSensitive: z.boolean().default(false),
    requiresAdminValidation: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(10_000).default(0)
  }),
  params: z.object({}),
  query: z.object({})
});
const updateCategorySchema = z.object({
  body: categorySchema.shape.body.partial().refine((body) => Object.keys(body).length > 0),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const settingSchema = z.object({
  body: z.object({ value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]) }),
  params: z.object({ key: z.string().regex(/^[a-z0-9_]{2,100}$/) }),
  query: z.object({})
});
const refundSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(5).max(1_000),
    amount: z.string().regex(/^[1-9][0-9]{2,14}$/).optional()
  }),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const sandboxOutcomeSchema = z.object({
  body: z.object({
    outcome: z.enum(['SUCCEEDED', 'FAILED']),
    failureReason: z.string().trim().min(3).max(800).optional()
  }).superRefine((body, context) => {
    if (body.outcome === 'FAILED' && !body.failureReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['failureReason'], message: 'Le motif d échec est obligatoire.' });
    }
  }),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const boostPlanSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().regex(/^[a-z0-9-]{2,100}$/),
    durationHours: z.number().int().min(1).max(8_760),
    price: z.string().regex(/^[1-9][0-9]{2,14}$/),
    placement: z.enum(['HOME_FEED', 'SEARCH_RESULTS', 'CATEGORY_PAGE', 'SIMILAR_PRODUCTS'])
  }),
  params: z.object({}),
  query: z.object({})
});
const boostPlanListSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    search: z.string().trim().min(1).max(100).optional(),
    status: z.enum(['active', 'archived']).optional()
  })
});
const updateBoostPlanSchema = z.object({
  body: boostPlanSchema.shape.body.partial().refine((body) => Object.keys(body).length > 0),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const cancelBoostSchema = z.object({
  body: z.object({ reason: z.string().trim().min(3).max(600) }),
  params: z.object({ id: uuid }),
  query: z.object({})
});
const moderationTargetByAction: Record<string, 'PRODUCT' | 'USER' | 'REVIEW' | 'CONVERSATION'> = {
  WARNING: 'USER',
  HIDE_PRODUCT: 'PRODUCT',
  ARCHIVE_PRODUCT: 'PRODUCT',
  RESTORE_PRODUCT: 'PRODUCT',
  SUSPEND_USER: 'USER',
  BAN_USER: 'USER',
  RESTORE_USER: 'USER',
  REMOVE_VERIFIED_BADGE: 'USER',
  HIDE_REVIEW: 'REVIEW',
  RESTORE_REVIEW: 'REVIEW',
  BLOCK_CONVERSATION: 'CONVERSATION',
  UNBLOCK_CONVERSATION: 'CONVERSATION'
};

const roleRank = { USER: 0, MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 } as const;
const adminOnlyModerationActions = new Set([
  'SUSPEND_USER', 'BAN_USER', 'RESTORE_USER', 'REMOVE_VERIFIED_BADGE'
]);

const numericSettingBounds: Record<string, { minimum: number; maximum: number }> = {
  max_product_images: { minimum: 1, maximum: 20 },
  max_daily_products_per_user: { minimum: 1, maximum: 1_000 },
  max_message_length: { minimum: 100, maximum: 10_000 },
  auto_hide_report_threshold: { minimum: 1, maximum: 100 },
  buyer_protection_fixed_fee: { minimum: 0, maximum: 1_000_000_000 },
  buyer_protection_rate_bps: { minimum: 0, maximum: 5_000 },
  home_delivery_fee: { minimum: 0, maximum: 1_000_000_000 },
  pickup_point_fee: { minimum: 0, maximum: 1_000_000_000 },
  order_confirmation_timeout_minutes: { minimum: 15, maximum: 43_200 },
  order_payment_timeout_minutes: { minimum: 15, maximum: 10_080 }
};

const booleanSettingKeys = new Set(['payment_enabled', 'boost_enabled']);
const versionSettingKeys = new Set(['terms_version', 'buyer_protection_policy_version']);

function validateSettingValue(key: string, valueType: string, value: unknown) {
  const numericBounds = numericSettingBounds[key];
  if (numericBounds) {
    if (
      valueType !== 'NUMBER' ||
      typeof value !== 'number' ||
      !Number.isSafeInteger(value) ||
      value < numericBounds.minimum ||
      value > numericBounds.maximum
    ) {
      throw new ApiError(400, 'Valeur numerique hors limites.', 'INVALID_SETTING_VALUE');
    }
    return value;
  }
  if (booleanSettingKeys.has(key)) {
    if (valueType !== 'BOOLEAN' || typeof value !== 'boolean') {
      throw new ApiError(400, 'Valeur booleenne invalide.', 'INVALID_SETTING_VALUE');
    }
    return value;
  }
  if (versionSettingKeys.has(key)) {
    if (
      valueType !== 'STRING' ||
      typeof value !== 'string' ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(value)
    ) {
      throw new ApiError(400, 'Version de politique invalide.', 'INVALID_SETTING_VALUE');
    }
    return value;
  }
  throw new ApiError(403, 'Ce reglage ne peut pas etre modifie via l API.', 'SETTING_NOT_EDITABLE');
}

async function audit(
  tx: Prisma.TransactionClient,
  request: Request,
  action: string,
  targetType: string,
  targetId?: string,
  before?: Prisma.InputJsonValue,
  after?: Prisma.InputJsonValue,
  note?: string
) {
  await tx.adminLog.create({
    data: {
      actorId: request.auth!.userId,
      action,
      targetType,
      ...(targetId ? { targetId } : {}),
      ...(before !== undefined ? { before } : {}),
      ...(after !== undefined ? { after } : {}),
      ...(note ? { note } : {}),
      ...(request.ip ? { ipAddress: request.ip } : {}),
      ...(request.get('user-agent') ? { userAgent: request.get('user-agent')! } : {}),
      requestId: request.requestId
    }
  });
}

async function getReportTarget(targetType: string, targetId: string) {
  if (targetType === 'PRODUCT') {
    return prisma.product.findUnique({
      where: { id: targetId },
      include: {
        seller: { select: { id: true, fullName: true, email: true, status: true } },
        images: { where: { archivedAt: null }, orderBy: { sortOrder: 'asc' } }
      }
    });
  }
  if (targetType === 'USER') {
    return prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        sellerVerificationStatus: true,
        trustScore: true,
        createdAt: true
      }
    });
  }
  if (targetType === 'MESSAGE') {
    const message = await prisma.message.findUnique({
      where: { id: targetId },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
        conversation: {
          select: {
            id: true,
            buyerId: true,
            sellerId: true,
            productId: true,
            status: true
          }
        }
      }
    });
    if (!message) return null;
    const { mediaKey, ...data } = message;
    return {
      ...data,
      mediaUrl: mediaKey ? getStorage().publicUrl(mediaKey) : null
    };
  }
  if (targetType === 'REVIEW') {
    return prisma.review.findUnique({
      where: { id: targetId },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
        subject: { select: { id: true, fullName: true, email: true } },
        order: { select: { id: true, reference: true, status: true } }
      }
    });
  }
  if (targetType === 'CONVERSATION') {
    const conversation = await prisma.conversation.findUnique({
      where: { id: targetId },
      include: {
        buyer: { select: { id: true, fullName: true, email: true } },
        seller: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, title: true, slug: true, status: true } },
        messages: {
          where: { archivedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            senderId: true,
            type: true,
            text: true,
            mediaKey: true,
            isReported: true,
            reportCount: true,
            createdAt: true
          }
        }
      }
    });
    if (!conversation) return null;
    return {
      ...conversation,
      messages: conversation.messages.map(({ mediaKey, ...message }) => ({
        ...message,
        mediaUrl: mediaKey ? getStorage().publicUrl(mediaKey) : null
      }))
    };
  }
  if (targetType === 'ORDER') {
    return prisma.order.findUnique({
      where: { id: targetId },
      include: {
        buyer: { select: { id: true, fullName: true, email: true } },
        seller: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, title: true, slug: true } },
        delivery: true,
        payments: true
      }
    });
  }
  if (targetType === 'PAYMENT') {
    return prisma.payment.findUnique({
      where: { id: targetId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        order: { select: { id: true, reference: true, status: true } },
        events: { orderBy: { receivedAt: 'desc' }, take: 20 },
        refunds: { orderBy: { createdAt: 'desc' } }
      }
    });
  }
  return null;
}

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'));
adminRoutes.use('/support', supportAdminRoutes);

adminRoutes.get('/dashboard', asyncHandler(async (_request, response) => {
  const [users, products, openReports, pendingOrders, paymentVolume, pendingVerifications] =
    await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { archivedAt: null } }),
      prisma.report.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED'] } } }),
      prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true }, _count: true }),
      prisma.sellerVerification.count({ where: { status: 'PENDING' } })
    ]);
  return sendSuccess(response, {
    data: {
      users,
      products,
      openReports,
      pendingOrders,
      successfulPayments: paymentVolume._count,
      paymentVolume: (paymentVolume._sum.amount ?? 0n).toString(),
      pendingVerifications
    }
  });
}));

adminRoutes.get('/users', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; search?: string; status?: string } };
  const rows = await prisma.user.findMany({
    where: {
      ...(query.search ? { OR: [
        { email: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } }
      ] } : {}),
      ...(query.status && ['ACTIVE', 'SUSPENDED', 'BANNED', 'ARCHIVED'].includes(query.status)
        ? { status: query.status as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'ARCHIVED' }
        : {})
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select: {
      id: true, email: true, fullName: true, phone: true, role: true, status: true,
      sellerVerificationStatus: true, createdAt: true, lastLoginAt: true
    }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/reports', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; status?: string } };
  const allowed = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];
  const rows = await prisma.report.findMany({
    where: query.status && allowed.includes(query.status)
      ? { status: query.status as 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' }
      : {},
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { reporter: { select: { id: true, fullName: true, email: true } } }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/reports/:id', validate(idSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: {
      reporter: { select: { id: true, fullName: true, email: true } },
      assignedTo: { select: { id: true, fullName: true, email: true } }
    }
  });
  if (!report) throw new ApiError(404, 'Signalement introuvable.', 'REPORT_NOT_FOUND');
  return sendSuccess(response, {
    data: {
      ...report,
      target: await getReportTarget(report.targetType, report.targetId)
    }
  });
}));

adminRoutes.patch('/reports/:id/assign', validate(idSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  const report = await prisma.$transaction(async (tx) => {
    const row = await tx.report.update({
      where: { id: params.id },
      data: { assignedToId: request.auth!.userId, status: 'UNDER_REVIEW' }
    });
    await audit(tx, request, 'REPORT_ASSIGNED', 'REPORT', row.id);
    return row;
  });
  return sendSuccess(response, { data: report, message: 'Signalement assigné.' });
}));

adminRoutes.patch('/reports/:id/resolve', validate(resolveSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { id: string };
    body: { status: 'RESOLVED' | 'REJECTED'; decision: string; note?: string };
  };
  const report = await prisma.$transaction(async (tx) => {
    const before = await tx.report.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError(404, 'Signalement introuvable.', 'REPORT_NOT_FOUND');
    const row = await tx.report.update({
      where: { id: params.id },
      data: {
        status: body.status,
        adminDecision: body.decision,
        ...(body.note ? { adminNote: body.note } : {}),
        resolvedAt: new Date(),
        assignedToId: request.auth!.userId
      }
    });
    await audit(tx, request, 'REPORT_RESOLVED', 'REPORT', row.id, { status: before.status }, { status: row.status }, body.note);
    return row;
  });
  return sendSuccess(response, { data: report, message: 'Signalement traité.' });
}));

adminRoutes.post('/moderation/actions', validate(moderationSchema), asyncHandler(async (request, response) => {
  const { body } = request.validated as {
    body: {
      targetType: 'PRODUCT' | 'USER' | 'REVIEW' | 'CONVERSATION';
      targetId: string;
      action: string;
      reason: string;
      note?: string;
    };
  };
  if (moderationTargetByAction[body.action] !== body.targetType) {
    throw new ApiError(400, 'Action incompatible avec la cible.', 'MODERATION_TARGET_MISMATCH');
  }
  if (adminOnlyModerationActions.has(body.action) && !['ADMIN', 'SUPER_ADMIN'].includes(request.auth!.role)) {
    throw new ApiError(403, 'Action reservee a un administrateur.', 'ROLE_FORBIDDEN');
  }
  await prisma.$transaction(async (tx) => {
    if (body.targetType === 'USER') {
      const target = await tx.user.findUnique({
        where: { id: body.targetId },
        select: { id: true, role: true, status: true }
      });
      if (!target) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
      if (target.id === request.auth!.userId) {
        throw new ApiError(409, 'Vous ne pouvez pas vous moderer vous-meme.', 'SELF_MODERATION_FORBIDDEN');
      }
      if (roleRank[target.role] >= roleRank[request.auth!.role]) {
        throw new ApiError(403, 'Hierarchie administrative insuffisante.', 'ADMIN_HIERARCHY_FORBIDDEN');
      }
    }
    if (body.action === 'HIDE_PRODUCT') {
      const product = await tx.product.findUnique({ where: { id: body.targetId }, select: { status: true } });
      if (!product || !['AVAILABLE', 'PENDING_REVIEW'].includes(product.status)) {
        throw new ApiError(409, 'Annonce non masquable.', 'PRODUCT_NOT_HIDEABLE');
      }
      await tx.product.update({ where: { id: body.targetId }, data: { status: 'HIDDEN', moderationStatus: 'HIDDEN', moderationReason: body.reason } });
    } else if (body.action === 'ARCHIVE_PRODUCT') {
      await tx.product.update({ where: { id: body.targetId }, data: { status: 'ARCHIVED', archivedAt: new Date(), moderationReason: body.reason } });
    } else if (body.action === 'RESTORE_PRODUCT') {
      const product = await tx.product.findUnique({
        where: { id: body.targetId },
        include: {
          seller: { select: { status: true } },
          category: { select: { isActive: true, archivedAt: true } },
          images: { where: { archivedAt: null }, take: 1, select: { id: true } },
          orders: {
            where: { status: { in: ['AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'RESERVED', 'PREPARING', 'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED', 'DISPUTED'] } },
            take: 1,
            select: { id: true }
          }
        }
      });
      if (!product || !['HIDDEN', 'REJECTED', 'ARCHIVED'].includes(product.status)) {
        throw new ApiError(409, 'Annonce non restaurable.', 'PRODUCT_NOT_RESTORABLE');
      }
      if (product.seller.status !== 'ACTIVE' || !product.category.isActive || product.category.archivedAt || !product.images.length || product.orders.length) {
        throw new ApiError(409, 'Les conditions de restauration ne sont pas reunies.', 'PRODUCT_RESTORE_REQUIREMENTS_FAILED');
      }
      await tx.product.update({ where: { id: body.targetId }, data: { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null, moderationReason: null } });
    } else if (body.action === 'SUSPEND_USER' || body.action === 'BAN_USER' || body.action === 'RESTORE_USER') {
      const status = body.action === 'SUSPEND_USER' ? 'SUSPENDED' : body.action === 'BAN_USER' ? 'BANNED' : 'ACTIVE';
      await tx.user.update({ where: { id: body.targetId }, data: { status } });
      if (status !== 'ACTIVE') {
        await tx.session.updateMany({ where: { userId: body.targetId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: status } });
      }
    } else if (body.action === 'REMOVE_VERIFIED_BADGE') {
      await tx.user.update({ where: { id: body.targetId }, data: { sellerVerificationStatus: 'REMOVED' } });
      await tx.sellerVerification.updateMany({
        where: { userId: body.targetId },
        data: { status: 'REMOVED', reviewedById: request.auth!.userId, reviewedAt: new Date(), rejectionReason: body.reason }
      });
    } else if (body.action === 'HIDE_REVIEW' || body.action === 'RESTORE_REVIEW') {
      const review = await tx.review.update({
        where: { id: body.targetId },
        data: {
          status: body.action === 'HIDE_REVIEW' ? 'HIDDEN' : 'PUBLISHED',
          hiddenReason: body.action === 'HIDE_REVIEW' ? body.reason : null
        },
        select: { subjectId: true }
      });
      const aggregate = await tx.review.aggregate({
        where: { subjectId: review.subjectId, status: 'PUBLISHED' },
        _avg: { rating: true },
        _count: { rating: true }
      });
      await tx.user.update({
        where: { id: review.subjectId },
        data: { averageRating: aggregate._avg.rating ?? 0, totalReviews: aggregate._count.rating }
      });
    } else if (body.action === 'BLOCK_CONVERSATION' || body.action === 'UNBLOCK_CONVERSATION') {
      await tx.conversation.update({ where: { id: body.targetId }, data: { status: body.action === 'BLOCK_CONVERSATION' ? 'BLOCKED' : 'ACTIVE' } });
    } else if (body.action === 'WARNING') {
      const target = await tx.user.findUnique({ where: { id: body.targetId }, select: { id: true } });
      if (!target) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
    }
    await tx.moderationAction.create({
      data: {
        actorId: request.auth!.userId,
        targetType: body.targetType,
        targetId: body.targetId,
        action: body.action as never,
        reason: body.reason,
        ...(body.note ? { note: body.note } : {})
      }
    });
    await audit(tx, request, body.action, body.targetType, body.targetId, undefined, undefined, body.note);
  });
  return sendSuccess(response, { data: null, message: 'Action de modération appliquée.' });
}));

adminRoutes.get('/seller-verifications', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; status?: string } };
  const rows = await prisma.sellerVerification.findMany({
    where: query.status && ['PENDING', 'APPROVED', 'REJECTED', 'REMOVED'].includes(query.status)
      ? { status: query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' }
      : {},
    orderBy: [{ requestedAt: 'asc' }, { id: 'asc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { user: { select: { id: true, fullName: true, email: true } } }
  });
  const more = rows.length > query.limit;
  const page = (more ? rows.slice(0, query.limit) : rows).map((row) => ({
    ...row,
    documents: row.documentKeys.map((_key, index) => ({
      index,
      url: `/api/v1/admin/seller-verifications/${row.id}/documents/${index}`
    })),
    documentKeys: undefined
  }));
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/seller-verifications/:id/documents/:documentIndex', validate(verificationDocumentSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string; documentIndex: number } };
  const verification = await prisma.sellerVerification.findUnique({
    where: { id: params.id },
    select: { documentKeys: true }
  });
  const key = verification?.documentKeys[params.documentIndex];
  if (!key) throw new ApiError(404, 'Justificatif introuvable.', 'VERIFICATION_DOCUMENT_NOT_FOUND');
  const content = await getStorage().read(key);
  response.set({
    'Cache-Control': 'private, no-store',
    'Content-Type': 'image/webp',
    'Content-Disposition': `inline; filename="verification-${params.id}-${params.documentIndex}.webp"`
  });
  return response.status(200).send(content);
}));

adminRoutes.patch('/seller-verifications/:id/approve', validate(verificationDecisionSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM seller_verifications WHERE id = ${params.id}::uuid FOR UPDATE`;
    const current = await tx.sellerVerification.findUnique({ where: { id: params.id } });
    if (!current) throw new ApiError(404, 'Demande introuvable.', 'SELLER_VERIFICATION_NOT_FOUND');
    if (current.status !== 'PENDING') {
      throw new ApiError(409, 'Cette demande a deja ete traitee.', 'SELLER_VERIFICATION_ALREADY_REVIEWED');
    }
    const row = await tx.sellerVerification.update({
      where: { id: params.id },
      data: { status: 'APPROVED', reviewedById: request.auth!.userId, reviewedAt: new Date(), rejectionReason: null }
    });
    await tx.user.update({ where: { id: row.userId }, data: { sellerVerificationStatus: 'APPROVED' } });
    await audit(tx, request, 'SELLER_VERIFICATION_APPROVED', 'USER', row.userId);
    const notification = await createNotification({
      userId: row.userId,
      type: 'SYSTEM',
      title: 'Profil vendeur verifie',
      body: 'Votre profil vendeur Fi Fow est maintenant verifie.',
      data: { sellerVerificationId: row.id, status: row.status }
    }, tx);
    return { row, notification };
  });
  emitToUser(result.row.userId, 'notification:new', result.notification);
  return sendSuccess(response, { data: result.row, message: 'Vendeur vérifié.' });
}));

adminRoutes.patch('/seller-verifications/:id/reject', validate(verificationDecisionSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as { params: { id: string }; body: { reason?: string } };
  if (!body.reason) throw new ApiError(400, 'Motif requis.', 'REJECTION_REASON_REQUIRED');
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM seller_verifications WHERE id = ${params.id}::uuid FOR UPDATE`;
    const current = await tx.sellerVerification.findUnique({ where: { id: params.id } });
    if (!current) throw new ApiError(404, 'Demande introuvable.', 'SELLER_VERIFICATION_NOT_FOUND');
    if (current.status !== 'PENDING') {
      throw new ApiError(409, 'Cette demande a deja ete traitee.', 'SELLER_VERIFICATION_ALREADY_REVIEWED');
    }
    const row = await tx.sellerVerification.update({
      where: { id: params.id },
      data: { status: 'REJECTED', reviewedById: request.auth!.userId, reviewedAt: new Date(), rejectionReason: body.reason! }
    });
    await tx.user.update({ where: { id: row.userId }, data: { sellerVerificationStatus: 'REJECTED' } });
    await audit(tx, request, 'SELLER_VERIFICATION_REJECTED', 'USER', row.userId, undefined, undefined, body.reason);
    const notification = await createNotification({
      userId: row.userId,
      type: 'SYSTEM',
      title: 'Verification vendeur a completer',
      body: body.reason!,
      data: { sellerVerificationId: row.id, status: row.status }
    }, tx);
    return { row, notification };
  });
  emitToUser(result.row.userId, 'notification:new', result.notification);
  return sendSuccess(response, { data: result.row, message: 'Demande refusée.' });
}));

adminRoutes.get('/categories', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as {
    query: { cursor?: string; limit: number; search?: string; status?: string };
  };
  const rows = await prisma.category.findMany({
    where: {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(query.status === 'active'
        ? { isActive: true, archivedAt: null }
        : query.status === 'archived'
          ? { archivedAt: { not: null } }
          : {})
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { children: true, products: true, subcategoryItems: true } }
    }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, {
    data: page,
    meta: { nextCursor: more ? page.at(-1)?.id ?? null : null }
  });
}));

adminRoutes.post('/categories', requireRole('ADMIN', 'SUPER_ADMIN'), validate(categorySchema), asyncHandler(async (request, response) => {
  const { body } = request.validated as { body: z.infer<typeof categorySchema>['body'] };
  if (body.parentId) {
    const parent = await prisma.category.findFirst({ where: { id: body.parentId, parentId: null, archivedAt: null }, select: { id: true } });
    if (!parent) throw new ApiError(400, 'Catégorie parente invalide.', 'INVALID_PARENT_CATEGORY');
  }
  const row = await prisma.$transaction(async (tx) => {
    const category = await tx.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        sortOrder: body.sortOrder,
        isSensitive: body.isSensitive,
        requiresAdminValidation: body.requiresAdminValidation,
        ...(body.description ? { description: body.description } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {})
      }
    });
    await audit(tx, request, 'CATEGORY_CREATED', 'CATEGORY', category.id);
    return category;
  });
  return sendSuccess(response, { statusCode: 201, data: row, message: 'Catégorie créée.' });
}));

adminRoutes.patch('/categories/:id', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateCategorySchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as { params: { id: string }; body: z.infer<typeof updateCategorySchema>['body'] };
  const row = await prisma.$transaction(async (tx) => {
    const data: Prisma.CategoryUncheckedUpdateInput = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      ...(body.isSensitive !== undefined ? { isSensitive: body.isSensitive } : {}),
      ...(body.requiresAdminValidation !== undefined
        ? { requiresAdminValidation: body.requiresAdminValidation }
        : {})
    };
    const category = await tx.category.update({ where: { id: params.id }, data });
    await audit(tx, request, 'CATEGORY_UPDATED', 'CATEGORY', category.id);
    return category;
  });
  return sendSuccess(response, { data: row, message: 'Catégorie mise à jour.' });
}));

adminRoutes.patch('/categories/:id/archive', requireRole('ADMIN', 'SUPER_ADMIN'), validate(idSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  const used = await prisma.product.count({ where: { OR: [{ categoryId: params.id }, { subcategoryId: params.id }], archivedAt: null } });
  if (used) throw new ApiError(409, 'Catégorie utilisée par des annonces actives.', 'CATEGORY_IN_USE');
  await prisma.$transaction(async (tx) => {
    await tx.category.update({ where: { id: params.id }, data: { isActive: false, archivedAt: new Date() } });
    await audit(tx, request, 'CATEGORY_ARCHIVED', 'CATEGORY', params.id);
  });
  return sendSuccess(response, { data: null, message: 'Catégorie archivée.' });
}));

adminRoutes.get('/settings', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (_request, response) => {
  return sendSuccess(response, { data: await prisma.appSetting.findMany({ where: { archivedAt: null }, orderBy: { key: 'asc' } }) });
}));

adminRoutes.patch('/settings/:key', requireRole('ADMIN', 'SUPER_ADMIN'), validate(settingSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as { params: { key: string }; body: { value: string | number | boolean | Record<string, unknown> } };
  const current = await prisma.appSetting.findUnique({ where: { key: params.key } });
  if (!current) throw new ApiError(404, 'Réglage introuvable.', 'SETTING_NOT_FOUND');
  if (current.archivedAt) throw new ApiError(409, 'Reglage archive.', 'SETTING_ARCHIVED');
  const validatedValue = validateSettingValue(current.key, current.valueType, body.value);
  const row = await prisma.$transaction(async (tx) => {
    const setting = await tx.appSetting.update({
      where: { key: params.key },
      data: { value: validatedValue as Prisma.InputJsonValue, updatedById: request.auth!.userId }
    });
    await audit(tx, request, 'SETTING_UPDATED', 'SETTING', undefined, current.value as Prisma.InputJsonValue, validatedValue as Prisma.InputJsonValue);
    return setting;
  });
  return sendSuccess(response, { data: row, message: 'Réglage mis à jour.' });
}));

adminRoutes.get('/products', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; search?: string; status?: string } };
  const rows = await prisma.product.findMany({
    where: {
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.status && ['DRAFT', 'PENDING_REVIEW', 'AVAILABLE', 'RESERVED', 'SOLD', 'REJECTED', 'HIDDEN', 'ARCHIVED'].includes(query.status)
        ? { status: query.status as never } : {})
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      seller: { select: { id: true, fullName: true, email: true } },
      images: {
        where: { archivedAt: null },
        orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
        take: 1,
        select: { id: true, storageKey: true, width: true, height: true, isMain: true, sortOrder: true }
      }
    }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  const data = page.map(({ images, ...product }) => {
    const image = images[0];
    return {
      ...product,
      mainImage: image ? {
        id: image.id,
        url: getStorage().publicUrl(image.storageKey),
        width: image.width,
        height: image.height,
        isMain: image.isMain,
        sortOrder: image.sortOrder
      } : null
    };
  });
  return sendSuccess(response, { data, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/orders', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; search?: string; status?: string } };
  const allowedStatuses = [
    'AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'RESERVED', 'PREPARING',
    'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED'
  ];
  const rows = await prisma.order.findMany({
    where: {
      ...(query.status && allowedStatuses.includes(query.status) ? { status: query.status as never } : {}),
      ...(query.search ? {
        OR: [
          { reference: { contains: query.search, mode: 'insensitive' } },
          { buyer: { fullName: { contains: query.search, mode: 'insensitive' } } },
          { buyer: { email: { contains: query.search, mode: 'insensitive' } } },
          { seller: { fullName: { contains: query.search, mode: 'insensitive' } } },
          { seller: { email: { contains: query.search, mode: 'insensitive' } } }
        ]
      } : {})
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select: {
      id: true, reference: true, status: true, handoverMode: true, totalAmount: true, currency: true, createdAt: true,
      product: { select: { id: true, title: true } },
      buyer: { select: { id: true, fullName: true, email: true } },
      seller: { select: { id: true, fullName: true, email: true } },
      productSnapshot: true, buyerSnapshot: true, sellerSnapshot: true
    }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/orders/:id', validate(idSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      product: { select: { id: true, title: true, slug: true } },
      buyer: { select: { id: true, fullName: true, email: true, phone: true } },
      seller: { select: { id: true, fullName: true, email: true, phone: true } },
      statusHistory: { orderBy: { createdAt: 'desc' }, select: { id: true, actorType: true, toStatus: true, reason: true, createdAt: true } },
      payments: { orderBy: { createdAt: 'desc' }, select: { id: true, internalReference: true, status: true, amount: true, currency: true, createdAt: true } },
      delivery: { select: { status: true, pickupLocation: true, addressSnapshot: true, trackingReference: true } }
    }
  });
  if (!order) throw new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND');
  return sendSuccess(response, { data: order });
}));

adminRoutes.get('/payments', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; status?: string } };
  const rows = await prisma.payment.findMany({
    where: query.status && ['CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(query.status)
      ? { status: query.status as never } : {},
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { user: { select: { id: true, fullName: true, email: true } }, order: { select: { id: true, reference: true } } }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/reviews', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; status?: string } };
  const rows = await prisma.review.findMany({
    where: query.status && ['PUBLISHED', 'PENDING_MODERATION', 'HIDDEN', 'ARCHIVED'].includes(query.status)
      ? { status: query.status as never } : {},
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { author: { select: { id: true, fullName: true } }, subject: { select: { id: true, fullName: true } } }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/boosts', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number; status?: string } };
  const rows = await prisma.boost.findMany({
    where: query.status && ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED'].includes(query.status)
      ? { status: query.status as never } : {},
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { plan: true, product: { select: { id: true, title: true } }, seller: { select: { id: true, fullName: true } } }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, { data: page, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.get('/conversations/reported', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as {
    query: { cursor?: string; limit: number; status?: string };
  };
  const rows = await prisma.conversation.findMany({
    where: {
      isReported: true,
      ...(query.status && ['ACTIVE', 'ARCHIVED', 'BLOCKED', 'DISPUTED'].includes(query.status)
        ? { status: query.status as 'ACTIVE' | 'ARCHIVED' | 'BLOCKED' | 'DISPUTED' }
        : {})
    },
    orderBy: [{ reportCount: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      buyer: { select: { id: true, fullName: true, email: true } },
      seller: { select: { id: true, fullName: true, email: true } },
      product: { select: { id: true, title: true, slug: true, status: true } },
      messages: {
        where: { isReported: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          senderId: true,
          type: true,
          text: true,
          mediaKey: true,
          reportCount: true,
          createdAt: true
        }
      }
    }
  });
  const more = rows.length > query.limit;
  const page = (more ? rows.slice(0, query.limit) : rows).map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map(({ mediaKey, ...message }) => ({
      ...message,
      mediaUrl: mediaKey ? getStorage().publicUrl(mediaKey) : null
    }))
  }));
  return sendSuccess(response, {
    data: page,
    meta: { nextCursor: more ? page.at(-1)?.id ?? null : null }
  });
}));

adminRoutes.get('/payouts', validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as {
    query: { cursor?: string; limit: number; status?: string };
  };
  const statuses = ['BLOCKED', 'SCHEDULED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'];
  const rows = await prisma.payout.findMany({
    where:
      query.status && statuses.includes(query.status)
        ? { status: query.status as 'BLOCKED' | 'SCHEDULED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' }
        : {},
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      seller: { select: { id: true, fullName: true, email: true, phone: true } },
      order: { select: { id: true, reference: true, status: true } }
    }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, {
    data: page.map((row) => ({ ...row, amount: row.amount.toString() })),
    meta: { nextCursor: more ? page.at(-1)?.id ?? null : null }
  });
}));

adminRoutes.post(
  '/payouts/:id/process',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validate(idSchema),
  asyncHandler(async (request, response) => {
    const { params } = request.validated as { params: { id: string } };
    const payout = await paymentService.initiatePayout(params.id);
    await prisma.$transaction(async (tx) => {
      await audit(
        tx,
        request,
        'PAYOUT_PROCESSING',
        'PAYOUT',
        params.id,
        undefined,
        { status: 'PROCESSING' }
      );
    });
    return sendSuccess(response, {
      data: payout,
      message: 'Reversement transmis au fournisseur.'
    });
  })
);

adminRoutes.post('/payouts/:id/sandbox-confirm', requireRole('ADMIN', 'SUPER_ADMIN'), validate(sandboxOutcomeSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { id: string };
    body: { outcome: 'SUCCEEDED' | 'FAILED'; failureReason?: string };
  };
  const payout = await paymentService.mockConfirmPayout(params.id, body.outcome, body.failureReason);
  await prisma.$transaction((tx) => audit(
    tx,
    request,
    `PAYOUT_SANDBOX_${body.outcome}`,
    'PAYOUT',
    params.id,
    undefined,
    { status: body.outcome },
    body.failureReason
  ));
  return sendSuccess(response, {
    data: payout,
    message: body.outcome === 'SUCCEEDED' ? 'Reversement de test confirmé.' : 'Échec de test enregistré.'
  });
}));

adminRoutes.get('/logs', validate(adminLogListSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as {
    query: { cursor?: string; limit: number; search?: string; targetType?: string };
  };
  const includeDiagnostics = request.auth!.role === 'SUPER_ADMIN';
  const rows = await prisma.adminLog.findMany({
    where: {
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.search ? {
        OR: [
          { action: { contains: query.search, mode: 'insensitive' } },
          { targetType: { contains: query.search, mode: 'insensitive' } },
          { note: { contains: query.search, mode: 'insensitive' } },
          { actor: { fullName: { contains: query.search, mode: 'insensitive' } } }
        ]
      } : {})
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { actor: { select: { id: true, fullName: true, email: true } } }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  const data = page.map((row) => {
    if (includeDiagnostics) return { ...row, diagnosticsAvailable: true };
    return {
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      targetType: row.targetType,
      targetId: null,
      note: row.note,
      createdAt: row.createdAt,
      actor: row.actor,
      diagnosticsAvailable: false
    };
  });
  return sendSuccess(response, { data, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));

adminRoutes.post('/payments/:id/refunds', requireRole('ADMIN', 'SUPER_ADMIN'), validate(refundSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as { params: { id: string }; body: { reason: string; amount?: string } };
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: params.id }, include: { order: true } });
    if (!payment || payment.status !== 'SUCCEEDED' || !payment.order) throw new ApiError(409, 'Paiement non remboursable.', 'PAYMENT_NOT_REFUNDABLE');
    const amount = body.amount ? BigInt(body.amount) : payment.amount;
    if (amount > payment.amount) throw new ApiError(400, 'Montant supérieur au paiement.', 'INVALID_REFUND_AMOUNT');
    const active = await tx.refund.findFirst({ where: { paymentId: payment.id, status: { in: ['REQUESTED', 'PROCESSING', 'SUCCEEDED'] } }, select: { id: true } });
    if (active) throw new ApiError(409, 'Un remboursement existe déjà.', 'REFUND_ALREADY_EXISTS');
    const row = await tx.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.order.id,
        requestedById: request.auth!.userId,
        amount,
        reason: body.reason,
        internalReference: `REF-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString('hex').toUpperCase()}`
      }
    });
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'REFUND_PENDING' } });
    await tx.order.update({ where: { id: payment.order.id }, data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: body.reason } });
    await tx.payout.updateMany({ where: { orderId: payment.order.id }, data: { status: 'BLOCKED', availableAt: null } });
    await audit(tx, request, 'REFUND_REQUESTED', 'PAYMENT', payment.id, undefined, { refundId: row.id, amount: amount.toString() }, body.reason);
    const notification = await createNotification({
      userId: payment.userId,
      type: 'REFUND_UPDATED',
      title: 'Remboursement en cours',
      body: 'Une demande de remboursement est en cours de traitement pour cette transaction.',
      data: { refundId: row.id, paymentId: payment.id, orderId: payment.order.id }
    }, tx);
    return { refund: row, notification };
  });
  const refund = result.refund;
  emitToUser(result.notification.userId, 'notification:new', result.notification);
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      userId: true,
      orderId: true,
      updatedAt: true,
      order: { select: { id: true, status: true, buyerId: true, sellerId: true, updatedAt: true } }
    }
  });
  if (payment) {
    emitPaymentUpdated(payment);
    if (payment.order) {
      emitOrderUpdated(payment.order);
      const payout = await prisma.payout.findUnique({
        where: { orderId: payment.order.id },
        select: { id: true, status: true, sellerId: true, orderId: true, updatedAt: true }
      });
      if (payout) emitPayoutUpdated(payout);
    }
  }
  return sendSuccess(response, { statusCode: 201, data: refund, message: 'Remboursement demandé au fournisseur.' });
}));

adminRoutes.post('/payments/:id/refunds/sandbox-confirm', requireRole('ADMIN', 'SUPER_ADMIN'), validate(sandboxOutcomeSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { id: string };
    body: { outcome: 'SUCCEEDED' | 'FAILED'; failureReason?: string };
  };
  const refund = await prisma.refund.findFirst({
    where: { paymentId: params.id, status: { in: ['REQUESTED', 'PROCESSING'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  });
  if (!refund) throw new ApiError(404, 'Remboursement testable introuvable.', 'REFUND_NOT_FOUND');
  const confirmedRefund = await paymentService.mockConfirmRefund(refund.id, body.outcome, body.failureReason);
  await prisma.$transaction((tx) => audit(
    tx,
    request,
    `REFUND_SANDBOX_${body.outcome}`,
    'REFUND',
    refund.id,
    undefined,
    { status: body.outcome, paymentId: params.id },
    body.failureReason
  ));
  return sendSuccess(response, {
    data: confirmedRefund,
    message: body.outcome === 'SUCCEEDED' ? 'Remboursement de test confirmé.' : 'Échec de test enregistré.'
  });
}));

adminRoutes.get('/boost-plans', requireRole('ADMIN', 'SUPER_ADMIN'), validate(boostPlanListSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: z.infer<typeof boostPlanListSchema>['query'] };
  const where: Prisma.BoostPlanWhereInput = {
    ...(query.status === 'active' ? { isActive: true, archivedAt: null } : {}),
    ...(query.status === 'archived' ? { archivedAt: { not: null } } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { slug: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      : {})
  };
  const rows = await prisma.boostPlan.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {})
  });
  const hasNextPage = rows.length > query.limit;
  const data = hasNextPage ? rows.slice(0, query.limit) : rows;
  return sendSuccess(response, {
    data,
    meta: { nextCursor: hasNextPage ? data.at(-1)?.id ?? null : null },
    message: 'Formules de boost chargées.'
  });
}));

adminRoutes.post('/boost-plans', requireRole('ADMIN', 'SUPER_ADMIN'), validate(boostPlanSchema), asyncHandler(async (request, response) => {
  const { body } = request.validated as { body: z.infer<typeof boostPlanSchema>['body'] };
  const row = await prisma.$transaction(async (tx) => {
    const plan = await tx.boostPlan.create({ data: { ...body, price: BigInt(body.price) } });
    await audit(tx, request, 'BOOST_PLAN_CREATED', 'BOOST_PLAN', plan.id);
    return plan;
  });
  return sendSuccess(response, { statusCode: 201, data: row, message: 'Formule créée.' });
}));

adminRoutes.patch('/boost-plans/:id', requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateBoostPlanSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { id: string };
    body: Partial<z.infer<typeof boostPlanSchema>['body']>;
  };
  const { price, ...rest } = body;
  const row = await prisma.$transaction(async (tx) => {
    const plan = await tx.boostPlan.update({
      where: { id: params.id },
      data: { ...rest, ...(price ? { price: BigInt(price) } : {}) }
    });
    await audit(tx, request, 'BOOST_PLAN_UPDATED', 'BOOST_PLAN', plan.id);
    return plan;
  });
  return sendSuccess(response, { data: row, message: 'Formule mise à jour.' });
}));

adminRoutes.patch('/boost-plans/:id/archive', requireRole('ADMIN', 'SUPER_ADMIN'), validate(idSchema), asyncHandler(async (request, response) => {
  const { params } = request.validated as { params: { id: string } };
  await prisma.$transaction(async (tx) => {
    await tx.boostPlan.update({
      where: { id: params.id },
      data: { isActive: false, archivedAt: new Date() }
    });
    await audit(tx, request, 'BOOST_PLAN_ARCHIVED', 'BOOST_PLAN', params.id);
  });
  return sendSuccess(response, { data: null, message: 'Formule archivée.' });
}));

adminRoutes.patch('/boosts/:id/cancel', requireRole('ADMIN', 'SUPER_ADMIN'), validate(cancelBoostSchema), asyncHandler(async (request, response) => {
  const { params, body } = request.validated as {
    params: { id: string };
    body: { reason: string };
  };
  const transaction = await prisma.$transaction(async (tx) => {
    const boost = await tx.boost.findUnique({
      where: { id: params.id },
      include: { payment: true }
    });
    if (!boost || !['PENDING_PAYMENT', 'ACTIVE'].includes(boost.status)) {
      throw new ApiError(409, 'Boost non annulable.', 'BOOST_NOT_CANCELLABLE');
    }
    const updated = await tx.boost.update({
      where: { id: boost.id },
      data: { status: 'CANCELLED', cancelReason: body.reason, endsAt: new Date() }
    });
    let refundId: string | null = null;
    if (boost.payment?.status === 'SUCCEEDED') {
      const refund = await tx.refund.create({
        data: {
          paymentId: boost.payment.id,
          orderId: boost.payment.orderId,
          requestedById: request.auth!.userId,
          amount: boost.payment.amount,
          reason: body.reason,
          internalReference: `REF-BST-${Date.now().toString(36).toUpperCase()}-${boost.id.slice(0, 8)}`
        }
      });
      refundId = refund.id;
      await tx.payment.update({
        where: { id: boost.payment.id },
        data: { status: 'REFUND_PENDING' }
      });
    } else if (boost.payment) {
      await tx.payment.update({
        where: { id: boost.payment.id },
        data: { status: 'CANCELLED', failedAt: new Date(), failureReason: body.reason }
      });
    }
    await audit(tx, request, 'BOOST_CANCELLED', 'BOOST', boost.id, undefined, { refundId }, body.reason);
    const notification = await createNotification({
      userId: boost.sellerId,
      type: 'SYSTEM',
      title: 'Boost annule',
      body: 'Votre boost a ete annule. Consultez le suivi de paiement pour la suite.',
      data: { boostId: boost.id, ...(refundId ? { refundId } : {}) }
    }, tx);
    return { boost: updated, refundId, notification, paymentId: boost.payment?.id ?? null };
  });
  emitBoostUpdated(transaction.boost);
  emitToUser(transaction.notification.userId, 'notification:new', transaction.notification);
  if (transaction.paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: transaction.paymentId },
      select: { id: true, status: true, userId: true, orderId: true, updatedAt: true }
    });
    if (payment) emitPaymentUpdated(payment);
  }
  const result = { boost: transaction.boost, refundId: transaction.refundId };
  return sendSuccess(response, { data: result, message: 'Boost annulé.' });
}));
