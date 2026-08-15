import { logger } from '../config/logger.js';
import { prisma } from '../config/prisma.js';
import { createNotification } from '../modules/notifications/notification.service.js';
import { releaseOrderReservations } from '../modules/orders/inventory.service.js';
import { emitBoostUpdated, emitOrderUpdated, emitToUser } from './realtime.js';

let timer: NodeJS.Timeout | null = null;
let running = false;

async function runMaintenance() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    await prisma.offer.updateMany({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED', respondedAt: now }
    });

    const timeoutSettings = await prisma.appSetting.findMany({
      where: { key: { in: ['order_confirmation_timeout_minutes', 'order_payment_timeout_minutes'] } },
      select: { key: true, value: true }
    });
    const timeout = (key: string, fallback: number) => {
      const value = timeoutSettings.find((item) => item.key === key)?.value;
      return typeof value === 'number' && Number.isSafeInteger(value) && value >= 15 && value <= 10_080
        ? value
        : fallback;
    };
    const confirmationLimit = new Date(now.getTime() - timeout('order_confirmation_timeout_minutes', 1_440) * 60_000);
    const paymentLimit = new Date(now.getTime() - timeout('order_payment_timeout_minutes', 120) * 60_000);
    const staleOrders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'AWAITING_SELLER_CONFIRMATION', OR: [{ sellerConfirmationExpiresAt: { lte: now } }, { sellerConfirmationExpiresAt: null, createdAt: { lte: confirmationLimit } }] },
          { status: 'AWAITING_PAYMENT', OR: [{ paymentExpiresAt: { lte: now } }, { paymentExpiresAt: null, sellerConfirmedAt: { lte: paymentLimit } }] }
        ]
      },
      orderBy: { updatedAt: 'asc' },
      take: 100,
      select: { id: true }
    });
    for (const candidate of staleOrders) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${candidate.id}::uuid FOR UPDATE`;
        const order = await tx.order.findUnique({ where: { id: candidate.id } });
        if (!order || !['AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT'].includes(order.status)) return null;
        const expired = order.status === 'AWAITING_SELLER_CONFIRMATION'
          ? order.sellerConfirmationExpiresAt
            ? order.sellerConfirmationExpiresAt <= now
            : order.createdAt <= confirmationLimit
          : order.paymentExpiresAt
            ? order.paymentExpiresAt <= now
            : Boolean(order.sellerConfirmedAt && order.sellerConfirmedAt <= paymentLimit);
        if (!expired) return null;
        const activePayment = await tx.payment.findFirst({
          where: { orderId: order.id, status: { in: ['CREATED', 'PROCESSING', 'SUCCEEDED'] } },
          select: { id: true }
        });
        if (activePayment) return null;
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            cancelReason: 'Delai de transaction expire.',
            version: { increment: 1 }
          }
        });
        await releaseOrderReservations(tx, order.id, 'ORDER_TIMEOUT', now);
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            actorType: 'SYSTEM',
            fromStatus: order.status,
            toStatus: 'CANCELLED',
            reason: 'Delai de transaction expire.'
          }
        });
        const notifications = await Promise.all([
          createNotification({
            userId: order.buyerId,
            type: 'ORDER_STATUS_CHANGED',
            title: 'Commande expiree',
            body: 'La commande a ete annulee car le delai est expire.',
            data: { orderId: order.id }
          }, tx),
          createNotification({
            userId: order.sellerId,
            type: 'ORDER_STATUS_CHANGED',
            title: 'Commande expiree',
            body: 'La commande a ete annulee et annoncee de nouveau disponible.',
            data: { orderId: order.id }
          }, tx)
        ]);
        return { order: updatedOrder, notifications };
      });
      if (result) {
        emitOrderUpdated(result.order);
        result.notifications.forEach((notification) => emitToUser(notification.userId, 'notification:new', notification));
      }
    }

    const expiredBoosts = await prisma.boost.findMany({
      where: { status: 'ACTIVE', endsAt: { lte: now } },
      select: { id: true, sellerId: true, productId: true }
    });
    for (const boost of expiredBoosts) {
      const notification = await prisma.$transaction(async (tx) => {
        const updated = await tx.boost.updateMany({
          where: { id: boost.id, status: 'ACTIVE' },
          data: { status: 'EXPIRED' }
        });
        if (!updated.count) return null;
        return createNotification(
            {
              userId: boost.sellerId,
              type: 'BOOST_EXPIRED',
              title: 'Boost terminé',
              body: 'La période de mise en avant de votre annonce est terminée.',
              data: { boostId: boost.id, productId: boost.productId }
            },
            tx
          );
      });
      if (notification) {
        emitToUser(notification.userId, 'notification:new', notification);
        const updatedBoost = await prisma.boost.findUnique({
          where: { id: boost.id },
          select: { id: true, status: true, sellerId: true, productId: true, updatedAt: true }
        });
        if (updatedBoost) emitBoostUpdated(updatedBoost);
      }
    }

    const retention = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
    await Promise.all([
      prisma.emailVerificationToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: retention } }, { usedAt: { lt: retention } }] }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: retention } }, { usedAt: { lt: retention } }] }
      }),
      prisma.session.deleteMany({
        where: { expiresAt: { lt: retention } }
      })
    ]);
  } catch (error) {
    logger.error('Échec de la maintenance périodique', {
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    running = false;
  }
}

export function startMaintenance() {
  if (timer) return;
  void runMaintenance();
  timer = setInterval(() => void runMaintenance(), 60_000);
  timer.unref();
}

export function stopMaintenance() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
