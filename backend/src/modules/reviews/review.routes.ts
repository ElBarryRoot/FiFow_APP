import { Router } from 'express';
import { z } from 'zod';
import { Prisma, type Review } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { authenticate, optionalAuthenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { createNotification } from '../notifications/notification.service.js';

const uuid = z.string().uuid();
const createSchema = z.object({
  body: z.object({
    orderId: uuid,
    rating: z.number().int().min(1).max(5),
    communicationRating: z.number().int().min(1).max(5).optional(),
    productAccuracyRating: z.number().int().min(1).max(5).optional(),
    behaviorRating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(3).max(1_000)
  }),
  params: z.object({}),
  query: z.object({})
});
const listSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ userId: uuid }),
  query: z.object({
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});
const replySchema = z.object({
  body: z.object({ reply: z.string().trim().min(2).max(600) }),
  params: z.object({ reviewId: uuid }),
  query: z.object({})
});

export const reviewRoutes = Router();
reviewRoutes.post('/', authenticate, requireVerifiedEmail, validate(createSchema), asyncHandler(async (req, res) => {
  const { body } = req.validated as {
    body: {
      orderId: string; rating: number; communicationRating?: number;
      productAccuracyRating?: number; behaviorRating?: number; comment: string;
    };
  };
  const order = await prisma.order.findFirst({
    where: {
      id: body.orderId,
      status: 'COMPLETED',
      OR: [{ buyerId: req.auth!.userId }, { sellerId: req.auth!.userId }]
    },
    select: { id: true, productId: true, buyerId: true, sellerId: true }
  });
  if (!order) throw new ApiError(409, 'Avis indisponible pour cette commande.', 'REVIEW_NOT_AVAILABLE');
  const existing = await prisma.review.findUnique({
    where: { orderId_authorId: { orderId: order.id, authorId: req.auth!.userId } },
    select: { id: true }
  });
  if (existing) throw new ApiError(409, 'Vous avez deja publie un avis.', 'REVIEW_ALREADY_SUBMITTED');
  const subjectId = order.buyerId === req.auth!.userId ? order.sellerId : order.buyerId;
  let review: Review;
  try {
    review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { ...body, productId: order.productId, authorId: req.auth!.userId, subjectId }
    });
    const aggregate = await tx.review.aggregate({
      where: { subjectId, status: 'PUBLISHED' },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await tx.user.update({
      where: { id: subjectId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating
      }
    });
    await createNotification({
      userId: subjectId,
      type: 'REVIEW_RECEIVED',
      title: 'Nouvel avis',
      body: `${body.rating}/5 - ${body.comment.slice(0, 100)}`,
      data: { reviewId: created.id, orderId: order.id }
    }, tx);
    return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Vous avez deja publie un avis.', 'REVIEW_ALREADY_SUBMITTED');
    }
    throw error;
  }
  return sendSuccess(res, { statusCode: 201, data: review, message: 'Avis publié.' });
}));
reviewRoutes.get('/users/:userId', optionalAuthenticate, validate(listSchema), asyncHandler(async (req, res) => {
  const { params, query } = req.validated as {
    params: { userId: string };
    query: { cursor?: string; limit: number };
  };
  const rows = await prisma.review.findMany({
    where: { subjectId: params.userId, status: 'PUBLISHED' },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { author: { select: { id: true, fullName: true, avatarKey: true } } }
  });
  const more = rows.length > query.limit;
  const page = more ? rows.slice(0, query.limit) : rows;
  const items = page.map((review) => ({
    ...review,
    author: {
      id: review.author.id,
      fullName: review.author.fullName,
      avatarUrl: review.author.avatarKey ? getStorage().publicUrl(review.author.avatarKey) : null
    }
  }));
  return sendSuccess(res, { data: items, meta: { nextCursor: more ? page.at(-1)?.id ?? null : null } });
}));
reviewRoutes.patch('/:reviewId/reply', authenticate, requireVerifiedEmail, validate(replySchema), asyncHandler(async (req, res) => {
  const { params, body } = req.validated as { params: { reviewId: string }; body: { reply: string } };
  const updated = await prisma.review.updateMany({
    where: { id: params.reviewId, subjectId: req.auth!.userId, status: 'PUBLISHED' },
    data: { reply: body.reply, repliedAt: new Date() }
  });
  if (!updated.count) throw new ApiError(404, 'Avis introuvable.', 'REVIEW_NOT_FOUND');
  return sendSuccess(res, { data: null, message: 'Réponse publiée.' });
}));
