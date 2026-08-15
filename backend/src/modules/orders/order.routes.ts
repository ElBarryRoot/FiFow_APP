import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { createNotification } from '../notifications/notification.service.js';
import { emitOrderUpdated } from '../../shared/realtime.js';
import { orderService } from './order.service.js';
import { extendOrderReservations, releaseOrderReservations } from './inventory.service.js';
import {
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  orderReasonSchema,
  quoteSchema,
  type QuoteBody
} from './order.schemas.js';

async function participant(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } }, delivery: true, payments: true }
  });
  if (!order) throw new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND');
  return order;
}

export const orderRoutes = Router();
orderRoutes.use(authenticate, requireVerifiedEmail);
orderRoutes.post('/quotes', validate(quoteSchema), asyncHandler(async (req, res) => {
  const { body } = req.validated as { body: QuoteBody };
  return sendSuccess(res, {
    statusCode: 201,
    data: await orderService.quote(req.auth!.userId, body),
    message: 'Devis calcule par Fi Fow.'
  });
}));
orderRoutes.post('/', validate(createOrderSchema), asyncHandler(async (req, res) => {
  const { body } = req.validated as { body: { quoteId: string; conversationId?: string } };
  const idempotencyKey = req.get('idempotency-key');
  if (!idempotencyKey || !z.string().min(16).max(120).safeParse(idempotencyKey).success) {
    throw new ApiError(400, 'Cle d idempotence requise.', 'IDEMPOTENCY_KEY_REQUIRED');
  }
  const order = await orderService.create(req.auth!.userId, body, idempotencyKey);
  emitOrderUpdated(order);
  return sendSuccess(res, {
    statusCode: 201,
    data: order,
    message: 'Commande creee.'
  });
}));
orderRoutes.get('/', validate(listOrdersSchema), asyncHandler(async (req, res) => {
  const { query } = req.validated as {
    query: {
      role: 'buyer' | 'seller' | 'all';
      status?: import('@prisma/client').OrderStatus;
      cursor?: string;
      limit: number;
    };
  };
  const result = await orderService.list(req.auth!.userId, query);
  return sendSuccess(res, { data: result.items, meta: { nextCursor: result.nextCursor } });
}));
orderRoutes.get('/:orderId', validate(orderIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { orderId: string } };
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, params.orderId) });
}));
orderRoutes.patch('/:orderId/seller-confirm', validate(orderIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { orderId: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (current.sellerId !== req.auth!.userId) throw new ApiError(403, 'Action réservée au vendeur.', 'SELLER_ONLY');
  if (current.status !== 'AWAITING_SELLER_CONFIRMATION') throw new ApiError(409, 'Transition impossible.', 'INVALID_ORDER_TRANSITION');
  const paymentExpiresAt = await orderService.paymentDeadline();
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: 'AWAITING_SELLER_CONFIRMATION', version: current.version },
      data: {
        status: 'AWAITING_PAYMENT',
        sellerConfirmedAt: new Date(),
        sellerConfirmationExpiresAt: null,
        paymentExpiresAt,
        version: { increment: 1 }
      }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await extendOrderReservations(tx, row.id, paymentExpiresAt);
    await tx.orderStatusHistory.create({ data: { orderId: row.id, actorId: req.auth!.userId, actorType: 'SELLER', fromStatus: current.status, toStatus: row.status } });
    await createNotification({ userId: row.buyerId, type: 'ORDER_STATUS_CHANGED', title: 'Commande confirmée', body: 'Vous pouvez maintenant effectuer le paiement sécurisé.', data: { orderId: row.id } }, tx);
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Commande confirmée.' });
}));
orderRoutes.patch('/:orderId/cancel', validate(orderReasonSchema), asyncHandler(async (req, res) => {
  const { params, body } = req.validated as { params: { orderId: string }; body: { reason: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (!['AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT'].includes(current.status)) throw new ApiError(409, 'Annulation directe impossible après paiement.', 'ORDER_NOT_CANCELLABLE');
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: current.status, version: current.version },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: body.reason, version: { increment: 1 } }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await releaseOrderReservations(tx, row.id, 'ORDER_CANCELLED');
    await tx.orderStatusHistory.create({ data: { orderId: row.id, actorId: req.auth!.userId, actorType: current.buyerId === req.auth!.userId ? 'BUYER' : 'SELLER', fromStatus: current.status, toStatus: 'CANCELLED', reason: body.reason } });
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Commande annulée.' });
}));

orderRoutes.patch('/:orderId/prepare', validate(orderIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { orderId: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (current.sellerId !== req.auth!.userId) throw new ApiError(403, 'Action réservée au vendeur.', 'SELLER_ONLY');
  if (current.status !== 'PAID') throw new ApiError(409, 'La commande doit être payée.', 'INVALID_ORDER_TRANSITION');
  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: 'PAID', version: current.version },
      data: { status: 'PREPARING', preparedAt: now, version: { increment: 1 } }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await tx.orderStatusHistory.create({
      data: { orderId: row.id, actorId: req.auth!.userId, actorType: 'SELLER', fromStatus: 'PAID', toStatus: 'PREPARING' }
    });
    await createNotification({ userId: row.buyerId, type: 'ORDER_STATUS_CHANGED', title: 'Commande en préparation', body: 'Le vendeur prépare votre commande.', data: { orderId: row.id } }, tx);
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Préparation confirmée.' });
}));

orderRoutes.patch('/:orderId/ready', validate(orderIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { orderId: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (current.sellerId !== req.auth!.userId) throw new ApiError(403, 'Action réservée au vendeur.', 'SELLER_ONLY');
  if (current.status !== 'PREPARING') throw new ApiError(409, 'Transition impossible.', 'INVALID_ORDER_TRANSITION');
  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: 'PREPARING', version: current.version },
      data: { status: 'READY_FOR_HANDOVER', version: { increment: 1 } }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await tx.delivery.update({
      where: { orderId: row.id },
      data: { readyAt: now, status: row.handoverMode === 'HAND_TO_HAND' ? 'NOT_REQUIRED' : 'PICKUP_READY' }
    });
    await tx.orderStatusHistory.create({
      data: { orderId: row.id, actorId: req.auth!.userId, actorType: 'SELLER', fromStatus: 'PREPARING', toStatus: 'READY_FOR_HANDOVER' }
    });
    await createNotification({ userId: row.buyerId, type: 'ORDER_STATUS_CHANGED', title: 'Commande prête', body: 'Votre commande est prête pour la remise.', data: { orderId: row.id } }, tx);
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Commande prête.' });
}));

orderRoutes.patch('/:orderId/ship', validate(orderIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { orderId: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (current.sellerId !== req.auth!.userId) throw new ApiError(403, 'Action réservée au vendeur.', 'SELLER_ONLY');
  if (current.status !== 'READY_FOR_HANDOVER' || current.handoverMode === 'HAND_TO_HAND') {
    throw new ApiError(409, 'Cette commande ne peut pas être expédiée.', 'INVALID_ORDER_TRANSITION');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: 'READY_FOR_HANDOVER', version: current.version },
      data: { status: 'IN_DELIVERY', version: { increment: 1 } }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await tx.delivery.update({ where: { orderId: row.id }, data: { status: 'IN_TRANSIT', shippedAt: now } });
    await tx.deliveryStatusHistory.create({ data: { deliveryId: current.delivery!.id, fromStatus: current.delivery!.status, toStatus: 'IN_TRANSIT' } });
    await tx.orderStatusHistory.create({
      data: { orderId: row.id, actorId: req.auth!.userId, actorType: 'SELLER', fromStatus: 'READY_FOR_HANDOVER', toStatus: 'IN_DELIVERY' }
    });
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Expédition confirmée.' });
}));

orderRoutes.patch('/:orderId/receive', validate(orderIdSchema), asyncHandler(async (req, res) => {
  const { params } = req.validated as { params: { orderId: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (current.buyerId !== req.auth!.userId) throw new ApiError(403, 'Action réservée à l’acheteur.', 'BUYER_ONLY');
  if (!['READY_FOR_HANDOVER', 'IN_DELIVERY'].includes(current.status)) {
    throw new ApiError(409, 'Réception impossible dans cet état.', 'INVALID_ORDER_TRANSITION');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: current.status, version: current.version },
      data: { status: 'COMPLETED', receivedAt: now, completedAt: now, version: { increment: 1 } }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await tx.delivery.update({
      where: { orderId: row.id },
      data: { status: row.handoverMode === 'HAND_TO_HAND' ? 'NOT_REQUIRED' : 'DELIVERED', deliveredAt: now }
    });
    await tx.payout.update({
      where: { orderId: row.id },
      data: { status: 'SCHEDULED', availableAt: new Date(now.getTime() + 24 * 60 * 60_000) }
    });
    await tx.orderStatusHistory.create({
      data: { orderId: row.id, actorId: req.auth!.userId, actorType: 'BUYER', fromStatus: current.status, toStatus: 'COMPLETED' }
    });
    await createNotification({ userId: row.sellerId, type: 'ORDER_STATUS_CHANGED', title: 'Réception confirmée', body: 'La vente est terminée. Votre versement est programmé.', data: { orderId: row.id } }, tx);
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Réception et vente confirmées.' });
}));

orderRoutes.patch('/:orderId/dispute', validate(orderReasonSchema), asyncHandler(async (req, res) => {
  const { params, body } = req.validated as { params: { orderId: string }; body: { reason: string } };
  const current = await participant(params.orderId, req.auth!.userId);
  if (!['PAID', 'PREPARING', 'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED'].includes(current.status)) {
    throw new ApiError(409, 'Litige impossible dans cet état.', 'ORDER_DISPUTE_NOT_ALLOWED');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: current.id, status: current.status, version: current.version },
      data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: body.reason, version: { increment: 1 } }
    });
    if (changed.count !== 1) throw new ApiError(409, 'Commande déjà modifiée.', 'ORDER_VERSION_CONFLICT');
    const row = await tx.order.findUniqueOrThrow({ where: { id: current.id } });
    await tx.payout.updateMany({ where: { orderId: row.id }, data: { status: 'BLOCKED', availableAt: null } });
    if (row.conversationId) {
      await tx.conversation.update({ where: { id: row.conversationId }, data: { status: 'DISPUTED', isReported: true } });
    }
    await tx.orderStatusHistory.create({
      data: { orderId: row.id, actorId: req.auth!.userId, actorType: current.buyerId === req.auth!.userId ? 'BUYER' : 'SELLER', fromStatus: current.status, toStatus: 'DISPUTED', reason: body.reason }
    });
    return row;
  });
  emitOrderUpdated(updated);
  return sendSuccess(res, { data: await orderService.detail(req.auth!.userId, updated.id), message: 'Litige ouvert. Le versement reste bloqué.' });
}));
