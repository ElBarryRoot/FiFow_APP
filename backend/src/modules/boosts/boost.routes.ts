import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';

const uuid = z.string().uuid();
const createSchema = z.object({
  body: z.object({ planId: uuid, phone: z.string().regex(/^\+?[0-9]{8,20}$/).optional() }),
  params: z.object({ productId: uuid }),
  query: z.object({})
});
const listSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});
function reference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString('hex').toUpperCase()}`;
}

export const boostRoutes = Router();
boostRoutes.get('/plans', asyncHandler(async (_request, response) => {
  const enabledSetting = await prisma.appSetting.findUnique({
    where: { key: 'boost_enabled' },
    select: { value: true }
  });
  const enabled = enabledSetting?.value !== false;
  const plans = await prisma.boostPlan.findMany({
    where: { isActive: enabled, archivedAt: null },
    orderBy: { price: 'asc' }
  });
  return sendSuccess(response, { data: plans, meta: { enabled } });
}));
boostRoutes.post('/products/:productId', authenticate, requireVerifiedEmail, validate(createSchema), asyncHandler(async (request, response) => {
  if (!env.PAYMENT_ENABLED && !env.PAYMENT_SANDBOX_ENABLED) {
    throw new ApiError(503, 'Paiement des boosts indisponible.', 'PAYMENT_DISABLED');
  }
  if (env.PAYMENT_PROVIDER === 'MOCK' && !env.PAYMENT_SANDBOX_ENABLED) {
    throw new ApiError(503, 'Le bac a sable de paiement est desactive.', 'PAYMENT_SANDBOX_DISABLED');
  }
  if (env.PAYMENT_PROVIDER !== 'MOCK') {
    throw new ApiError(503, 'Adaptateur de paiement non configuré.', 'PAYMENT_PROVIDER_NOT_IMPLEMENTED');
  }
  const idempotencyKey = request.get('idempotency-key');
  if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 120) {
    throw new ApiError(400, 'Clé d’idempotence requise.', 'IDEMPOTENCY_KEY_REQUIRED');
  }
  const { params, body } = request.validated as {
    params: { productId: string };
    body: { planId: string; phone?: string };
  };
  const enabledSetting = await prisma.appSetting.findUnique({
    where: { key: 'boost_enabled' },
    select: { value: true }
  });
  if (enabledSetting?.value === false) {
    throw new ApiError(503, 'Les boosts sont temporairement indisponibles.', 'BOOST_DISABLED');
  }
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey },
    include: { boost: true }
  });
  if (existing) {
    if (existing.userId !== request.auth!.userId || !existing.boost) {
      throw new ApiError(409, 'Clé d’idempotence déjà utilisée.', 'IDEMPOTENCY_KEY_REUSED');
    }
    return sendSuccess(response, { data: { boost: existing.boost, payment: existing } });
  }
  const product = await prisma.product.findFirst({
    where: {
      id: params.productId,
      sellerId: request.auth!.userId,
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      archivedAt: null
    },
    select: { id: true }
  });
  if (!product) throw new ApiError(404, 'Annonce éligible introuvable.', 'PRODUCT_NOT_BOOSTABLE');
  const plan = await prisma.boostPlan.findFirst({
    where: { id: body.planId, isActive: true, archivedAt: null }
  });
  if (!plan) throw new ApiError(404, 'Formule de boost introuvable.', 'BOOST_PLAN_NOT_FOUND');
  const active = await prisma.boost.findFirst({
    where: { productId: product.id, status: { in: ['PENDING_PAYMENT', 'ACTIVE'] }, archivedAt: null },
    select: { id: true }
  });
  if (active) throw new ApiError(409, 'Un boost est déjà actif ou en paiement.', 'BOOST_ALREADY_ACTIVE');
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${product.id}::uuid FOR UPDATE`;
      const duplicatePayment = await tx.payment.findUnique({
        where: { idempotencyKey },
        include: { boost: true }
      });
      if (duplicatePayment) {
        if (duplicatePayment.userId !== request.auth!.userId || !duplicatePayment.boost) {
          throw new ApiError(409, 'Cle d idempotence deja utilisee.', 'IDEMPOTENCY_KEY_REUSED');
        }
        return { boost: duplicatePayment.boost, payment: duplicatePayment };
      }
      const concurrentBoost = await tx.boost.findFirst({
        where: { productId: product.id, status: { in: ['PENDING_PAYMENT', 'ACTIVE'] }, archivedAt: null },
        select: { id: true }
      });
      if (concurrentBoost) {
        throw new ApiError(409, 'Un boost est deja actif ou en paiement.', 'BOOST_ALREADY_ACTIVE');
      }
      const payment = await tx.payment.create({
        data: {
          userId: request.auth!.userId,
          type: 'BOOST',
          provider: env.PAYMENT_PROVIDER,
          status: 'PROCESSING',
          amount: plan.price,
          currency: plan.currency,
          ...(body.phone ? { phone: body.phone } : {}),
          internalReference: reference('BSTPAY'),
          idempotencyKey,
          metadata: { planId: plan.id, durationHours: plan.durationHours }
        }
      });
      const boost = await tx.boost.create({
        data: {
          productId: product.id,
          sellerId: request.auth!.userId,
          boostPlanId: plan.id,
          paymentId: payment.id
        }
      });
      return { boost, payment };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicatePayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { boost: true }
      });
      if (
        duplicatePayment?.userId === request.auth!.userId &&
        duplicatePayment.boost?.productId === product.id
      ) {
        result = { boost: duplicatePayment.boost, payment: duplicatePayment };
      } else {
        throw new ApiError(409, 'Un boost est deja actif ou en paiement.', 'BOOST_ALREADY_ACTIVE');
      }
    } else {
      throw error;
    }
  }
  return sendSuccess(response, { statusCode: 201, data: result, message: 'Boost en attente de paiement.' });
}));
boostRoutes.get('/mine', authenticate, validate(listSchema), asyncHandler(async (request, response) => {
  const { query } = request.validated as { query: { cursor?: string; limit: number } };
  const rows = await prisma.boost.findMany({
    where: { sellerId: request.auth!.userId, archivedAt: null },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      plan: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          viewsCount: true,
          likesCount: true,
          favoritesCount: true,
          conversationsCount: true,
          images: {
            where: { archivedAt: null },
            orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { storageKey: true }
          }
        }
      },
      payment: { select: { id: true, status: true, amount: true, currency: true, createdAt: true } }
    }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  const items = page.map((boost) => {
    const imageKey = boost.product.images[0]?.storageKey;
    return {
      ...boost,
      product: {
        ...boost.product,
        price: boost.product.price.toString(),
        images: undefined,
        imageUrl: imageKey ? getStorage().publicUrl(imageKey) : null
      },
      payment: boost.payment ? { ...boost.payment, amount: boost.payment.amount.toString() } : null,
      metrics: {
        productViews: boost.product.viewsCount,
        productLikes: boost.product.likesCount,
        productFavorites: boost.product.favoritesCount,
        productConversations: boost.product.conversationsCount,
        attribution: 'PRODUCT_TOTALS'
      }
    };
  });
  return sendSuccess(response, { data: items, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));
