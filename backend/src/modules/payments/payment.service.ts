import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { Prisma, type PaymentProvider } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import {
  emitBoostUpdated,
  emitOrderUpdated,
  emitPaymentUpdated,
  emitPayoutUpdated
} from '../../shared/realtime.js';
import { createNotification } from '../notifications/notification.service.js';
import { verifyWebhookSignature } from './webhook-signature.js';

const providerMap = {
  mock: 'MOCK',
  'orange-money': 'ORANGE_MONEY',
  'mtn-momo': 'MTN_MOMO',
  other: 'OTHER'
} as const satisfies Record<string, PaymentProvider>;

function reference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString('hex').toUpperCase()}`;
}

function serialize<T>(value: T) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item))
  ) as unknown;
}

async function emitPaymentCommerceUpdates(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      userId: true,
      orderId: true,
      updatedAt: true,
      order: {
        select: {
          id: true,
          status: true,
          buyerId: true,
          sellerId: true,
          updatedAt: true
        }
      },
      boost: {
        select: {
          id: true,
          status: true,
          sellerId: true,
          productId: true,
          updatedAt: true
        }
      }
    }
  });
  if (!payment) return;

  emitPaymentUpdated(payment);
  if (payment.order) {
    emitOrderUpdated(payment.order);
    const payout = await prisma.payout.findUnique({
      where: { orderId: payment.order.id },
      select: { id: true, status: true, sellerId: true, orderId: true, updatedAt: true }
    });
    if (payout) emitPayoutUpdated(payout);
  }
  if (payment.boost) emitBoostUpdated(payment.boost);
}

async function emitPayoutUpdate(payoutId: string) {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: { id: true, status: true, sellerId: true, orderId: true, updatedAt: true }
  });
  if (payout) emitPayoutUpdated(payout);
}

export const paymentService = {
  async initiate(
    userId: string,
    orderId: string,
    idempotencyKey: string,
    phone?: string
  ) {
    if (!env.PAYMENT_ENABLED && !env.PAYMENT_SANDBOX_ENABLED) {
      throw new ApiError(
        503,
        'Le paiement sécurisé sera disponible après activation du fournisseur.',
        'PAYMENT_DISABLED'
      );
    }
    if (env.PAYMENT_PROVIDER === 'MOCK' && !env.PAYMENT_SANDBOX_ENABLED) {
      throw new ApiError(503, 'Le bac a sable de paiement est desactive.', 'PAYMENT_SANDBOX_DISABLED');
    }
    if (env.PAYMENT_PROVIDER !== 'MOCK') {
      throw new ApiError(
        503,
        'L’adaptateur du fournisseur de paiement doit être configuré avant activation.',
        'PAYMENT_PROVIDER_NOT_IMPLEMENTED'
      );
    }
    try {
      const payment = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
        const existing = await tx.payment.findUnique({ where: { idempotencyKey } });
        if (existing) {
          if (existing.userId !== userId || existing.orderId !== orderId) {
            throw new ApiError(409, 'Cle d idempotence deja utilisee.', 'IDEMPOTENCY_KEY_REUSED');
          }
          return existing;
        }
        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            buyerId: userId,
            status: 'AWAITING_PAYMENT',
            OR: [{ paymentExpiresAt: null }, { paymentExpiresAt: { gt: new Date() } }]
          },
          select: { id: true, totalAmount: true, currency: true }
        });
        if (!order) throw new ApiError(409, 'Commande non payable.', 'ORDER_NOT_PAYABLE');
        const active = await tx.payment.findFirst({
          where: { orderId, status: { in: ['CREATED', 'PROCESSING'] } },
          select: { id: true }
        });
        if (active) throw new ApiError(409, 'Un paiement est deja en cours.', 'PAYMENT_ALREADY_PROCESSING');
        return tx.payment.create({
          data: {
            userId,
            orderId,
            type: 'ORDER',
            provider: env.PAYMENT_PROVIDER,
            status: 'PROCESSING',
            amount: order.totalAmount,
            currency: order.currency,
            ...(phone ? { phone } : {}),
            internalReference: reference('PAY'),
            idempotencyKey,
            metadata: { initiationMode: 'sandbox' }
          }
        });
      });
      emitPaymentUpdated(payment);
      return serialize({
        ...payment,
        sandbox: env.PAYMENT_SANDBOX_ENABLED,
        nextAction: env.PAYMENT_SANDBOX_ENABLED ? 'MOCK_CONFIRM' : 'WAIT_PROVIDER'
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const concurrent = await prisma.payment.findUnique({ where: { idempotencyKey } });
        if (concurrent?.userId === userId && concurrent.orderId === orderId) return serialize(concurrent);
        throw new ApiError(409, 'Un paiement est deja en cours.', 'PAYMENT_ALREADY_PROCESSING');
      }
      throw error;
    }
  },

  async mockConfirm(
    userId: string,
    paymentId: string,
    outcome: 'SUCCEEDED' | 'FAILED',
    failureReason?: string
  ) {
    if (!env.PAYMENT_SANDBOX_ENABLED || env.PAYMENT_PROVIDER !== 'MOCK' || env.NODE_ENV === 'production') {
      throw new ApiError(404, 'Route introuvable.', 'ROUTE_NOT_FOUND');
    }
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId, provider: 'MOCK', archivedAt: null },
      select: { internalReference: true }
    });
    if (!payment) throw new ApiError(404, 'Paiement introuvable.', 'PAYMENT_NOT_FOUND');
    const payload = {
      internalReference: payment.internalReference,
      providerEventId: `mock-event-${randomUUID()}`,
      providerTransactionId: `mock-transaction-${randomUUID()}`,
      status: outcome,
      ...(outcome === 'FAILED'
        ? { failureCode: 'MOCK_DECLINED', failureReason: failureReason ?? 'Paiement refuse dans le bac a sable.' }
        : {})
    } as const;
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = `sha256=${createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex')}`;
    await this.handleWebhook({ providerSlug: 'mock', rawBody, signature, payload });
    return this.detail(userId, paymentId);
  },

  async mockConfirmRefund(
    refundId: string,
    outcome: 'SUCCEEDED' | 'FAILED',
    failureReason?: string
  ) {
    if (!env.PAYMENT_SANDBOX_ENABLED || env.PAYMENT_PROVIDER !== 'MOCK' || env.NODE_ENV === 'production') {
      throw new ApiError(404, 'Route introuvable.', 'ROUTE_NOT_FOUND');
    }
    const refund = await prisma.refund.findFirst({
      where: {
        id: refundId,
        status: { in: ['REQUESTED', 'PROCESSING'] },
        payment: { provider: 'MOCK' }
      },
      select: { internalReference: true }
    });
    if (!refund) throw new ApiError(404, 'Remboursement traitable introuvable.', 'REFUND_NOT_FOUND');
    const payload = {
      internalReference: refund.internalReference,
      providerEventId: `mock-refund-event-${randomUUID()}`,
      providerTransactionId: `mock-refund-${randomUUID()}`,
      status: outcome,
      ...(outcome === 'FAILED'
        ? { failureReason: failureReason ?? 'Remboursement refuse dans le bac a sable.' }
        : {})
    } as const;
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = `sha256=${createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex')}`;
    await this.handleRefundWebhook({ providerSlug: 'mock', rawBody, signature, payload });
    return serialize(await prisma.refund.findUniqueOrThrow({ where: { id: refundId } }));
  },

  async mockConfirmPayout(
    payoutId: string,
    outcome: 'SUCCEEDED' | 'FAILED',
    failureReason?: string
  ) {
    if (!env.PAYMENT_SANDBOX_ENABLED || env.PAYMENT_PROVIDER !== 'MOCK' || env.NODE_ENV === 'production') {
      throw new ApiError(404, 'Route introuvable.', 'ROUTE_NOT_FOUND');
    }
    const payout = await prisma.payout.findFirst({
      where: { id: payoutId, status: 'PROCESSING', provider: 'MOCK' },
      select: { internalReference: true }
    });
    if (!payout) throw new ApiError(404, 'Reversement traitable introuvable.', 'PAYOUT_NOT_FOUND');
    const payload = {
      internalReference: payout.internalReference,
      providerEventId: `mock-payout-event-${randomUUID()}`,
      providerTransactionId: `mock-payout-${randomUUID()}`,
      status: outcome,
      ...(outcome === 'FAILED'
        ? { failureReason: failureReason ?? 'Reversement refuse dans le bac a sable.' }
        : {})
    } as const;
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = `sha256=${createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex')}`;
    await this.handlePayoutWebhook({ providerSlug: 'mock', rawBody, signature, payload });
    return serialize(await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } }));
  },

  async initiatePayout(payoutId: string) {
    if (!env.PAYMENT_ENABLED && !env.PAYMENT_SANDBOX_ENABLED) {
      throw new ApiError(503, 'Les reversements sont désactivés.', 'PAYOUT_DISABLED');
    }
    if (env.PAYMENT_PROVIDER === 'MOCK' && !env.PAYMENT_SANDBOX_ENABLED) {
      throw new ApiError(503, 'Le bac a sable de paiement est desactive.', 'PAYMENT_SANDBOX_DISABLED');
    }
    if (env.PAYMENT_PROVIDER !== 'MOCK') {
      throw new ApiError(
        503,
        'L’adaptateur officiel de reversement doit être configuré avant activation.',
        'PAYOUT_PROVIDER_NOT_IMPLEMENTED'
      );
    }

    const payout = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM payouts WHERE id = ${payoutId}::uuid FOR UPDATE`;
      const row = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              status: true,
              sellerVerificationStatus: true
            }
          },
          order: { select: { id: true, reference: true, status: true } }
        }
      });
      if (!row) throw new ApiError(404, 'Reversement introuvable.', 'PAYOUT_NOT_FOUND');
      if (row.status === 'PROCESSING') return row;
      if (row.status !== 'SCHEDULED' || !row.availableAt || row.availableAt > new Date()) {
        throw new ApiError(409, 'Reversement non disponible.', 'PAYOUT_NOT_AVAILABLE');
      }
      if (row.order.status !== 'COMPLETED') {
        throw new ApiError(409, 'Commande non terminée.', 'ORDER_NOT_COMPLETED');
      }
      if (
        row.seller.status !== 'ACTIVE' ||
        row.seller.sellerVerificationStatus !== 'APPROVED'
      ) {
        throw new ApiError(409, 'Vendeur non éligible au reversement.', 'SELLER_NOT_PAYOUT_ELIGIBLE');
      }
      if (!row.seller.phone) {
        throw new ApiError(409, 'Numéro de reversement manquant.', 'PAYOUT_PHONE_REQUIRED');
      }
      return tx.payout.update({
        where: { id: row.id },
        data: {
          status: 'PROCESSING',
          provider: env.PAYMENT_PROVIDER,
          failureReason: null
        },
        include: {
          seller: { select: { id: true, fullName: true, phone: true } },
          order: { select: { id: true, reference: true } }
        }
      });
    });
    emitPayoutUpdated(payout);
    return serialize({
      ...payout,
      initiationMode: 'test',
      callbackReference: payout.internalReference
    });
  },

  async handleRefundWebhook(input: {
    providerSlug: keyof typeof providerMap;
    rawBody?: Buffer | undefined;
    signature?: string | undefined;
    payload: {
      internalReference: string;
      providerEventId: string;
      providerTransactionId?: string;
      status: 'SUCCEEDED' | 'FAILED';
      failureReason?: string;
    };
  }) {
    if (
      !verifyWebhookSignature(input.rawBody, input.signature, env.PAYMENT_WEBHOOK_SECRET)
    ) {
      throw new ApiError(401, 'Signature webhook invalide.', 'INVALID_WEBHOOK_SIGNATURE');
    }
    const provider = providerMap[input.providerSlug];
    const refund = await prisma.refund.findUnique({
      where: { internalReference: input.payload.internalReference },
      include: {
        payment: { include: { boost: true } },
        order: true
      }
    });
    if (!refund || refund.payment.provider !== provider) {
      throw new ApiError(404, 'Remboursement introuvable.', 'REFUND_NOT_FOUND');
    }
    if (refund.providerEventId === input.payload.providerEventId || refund.status === 'SUCCEEDED') {
      return { duplicate: true };
    }
    const targetRefundId = refund.id;
    const targetRefundPaymentId = refund.paymentId;
    const transactionResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${targetRefundPaymentId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${targetRefundId}::uuid FOR UPDATE`;
      const refund = await tx.refund.findUnique({
        where: { id: targetRefundId },
        include: { payment: { include: { boost: true } }, order: true }
      });
      if (!refund) throw new ApiError(404, 'Remboursement introuvable.', 'REFUND_NOT_FOUND');
      if (refund.providerEventId === input.payload.providerEventId || refund.status === 'SUCCEEDED') {
        return 'duplicate' as const;
      }
      if (!['REQUESTED', 'PROCESSING'].includes(refund.status)) return 'ignored' as const;
      if (input.payload.status === 'FAILED') {
        await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'FAILED',
            providerEventId: input.payload.providerEventId,
            ...(input.payload.providerTransactionId
              ? { providerTransactionId: input.payload.providerTransactionId }
              : {}),
            ...(input.payload.failureReason
              ? { failureReason: input.payload.failureReason }
              : {}),
            processedAt: new Date()
          }
        });
        await createNotification({
          userId: refund.payment.userId,
          type: 'REFUND_UPDATED',
          title: 'Remboursement non abouti',
          body: input.payload.failureReason ?? 'Le fournisseur n’a pas confirmé le remboursement.',
          data: { refundId: refund.id }
        }, tx);
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: 'SUCCEEDED' }
        });
        return 'processed' as const;
      }
      const processedAt = new Date();
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: 'SUCCEEDED',
          providerEventId: input.payload.providerEventId,
          ...(input.payload.providerTransactionId
            ? { providerTransactionId: input.payload.providerTransactionId }
            : {}),
          failureReason: null,
          processedAt
        }
      });
      const totals = await tx.refund.aggregate({
        where: { paymentId: refund.paymentId, status: 'SUCCEEDED' },
        _sum: { amount: true }
      });
      const fullyRefunded = (totals._sum.amount ?? 0n) >= refund.payment.amount;
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: { status: fullyRefunded ? 'REFUNDED' : 'SUCCEEDED' }
      });
      await tx.ledgerEntry.createMany({
        data: [
          {
            refundId: refund.id,
            type: 'REFUND',
            direction: 'CREDIT',
            amount: refund.amount,
            accountCode: 'CASH_PROVIDER',
            reference: refund.internalReference
          },
          {
            refundId: refund.id,
            type: 'REFUND',
            direction: 'DEBIT',
            amount: refund.amount,
            accountCode: 'REFUND_CLEARING',
            reference: refund.internalReference
          }
        ]
      });
      if (refund.order && fullyRefunded) {
        const previousStatus = refund.order.status;
        await tx.order.update({
          where: { id: refund.order.id },
          data: { status: 'REFUNDED', version: { increment: 1 } }
        });
        await tx.payout.updateMany({
          where: { orderId: refund.order.id },
          data: { status: 'CANCELLED', availableAt: null }
        });
        if (['PAID', 'PREPARING', 'READY_FOR_HANDOVER'].includes(previousStatus)) {
          await tx.product.updateMany({
            where: { id: refund.order.productId, status: 'RESERVED', moderationStatus: 'APPROVED', archivedAt: null },
            data: { status: 'AVAILABLE', reservedAt: null }
          });
        }
        await tx.orderStatusHistory.create({
          data: {
            orderId: refund.order.id,
            actorType: 'PAYMENT_PROVIDER',
            fromStatus: previousStatus,
            toStatus: 'REFUNDED',
            reason: refund.reason
          }
        });
      }
      if (refund.payment.boost && fullyRefunded) {
        await tx.boost.update({
          where: { id: refund.payment.boost.id },
          data: { status: 'CANCELLED', endsAt: processedAt, cancelReason: refund.reason }
        });
      }
      await createNotification({
        userId: refund.payment.userId,
        type: 'REFUND_UPDATED',
        title: 'Remboursement confirmé',
        body: 'Le fournisseur a confirmé votre remboursement.',
        data: { refundId: refund.id, paymentId: refund.paymentId }
      }, tx);
    });
    if (transactionResult !== 'duplicate' && transactionResult !== 'ignored') {
      await emitPaymentCommerceUpdates(targetRefundPaymentId);
    }
    return {
      duplicate: transactionResult === 'duplicate',
      ignored: transactionResult === 'ignored'
    };
  },

  async handleWebhook(input: {
    providerSlug: keyof typeof providerMap;
    rawBody?: Buffer | undefined;
    signature?: string | undefined;
    payload: {
      internalReference: string;
      providerEventId: string;
      providerTransactionId?: string;
      status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
      failureCode?: string;
      failureReason?: string;
    };
  }) {
    if (
      !verifyWebhookSignature(input.rawBody, input.signature, env.PAYMENT_WEBHOOK_SECRET)
    ) {
      throw new ApiError(401, 'Signature webhook invalide.', 'INVALID_WEBHOOK_SIGNATURE');
    }
    const provider = providerMap[input.providerSlug];
    const payment = await prisma.payment.findFirst({
      where: { internalReference: input.payload.internalReference, provider },
      include: { order: true }
    });
    if (!payment) throw new ApiError(404, 'Paiement introuvable.', 'PAYMENT_NOT_FOUND');

    const previousEvent = await prisma.paymentEvent.findUnique({
      where: { providerEventId: input.payload.providerEventId },
      select: { id: true }
    });
    if (previousEvent) return { duplicate: true };

    const targetPaymentId = payment.id;
    const targetOrderId = payment.orderId;
    const transactionResult = await prisma.$transaction(async (tx) => {
      if (targetOrderId) {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${targetOrderId}::uuid FOR UPDATE`;
      }
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${targetPaymentId}::uuid FOR UPDATE`;
      const payment = await tx.payment.findUnique({
        where: { id: targetPaymentId },
        include: { order: true }
      });
      if (!payment) throw new ApiError(404, 'Paiement introuvable.', 'PAYMENT_NOT_FOUND');
      const concurrentEvent = await tx.paymentEvent.findUnique({
        where: { providerEventId: input.payload.providerEventId },
        select: { id: true }
      });
      if (concurrentEvent) return 'duplicate' as const;
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          provider,
          providerEventId: input.payload.providerEventId,
          status: input.payload.status,
          signatureValid: true,
          payload: input.payload as Prisma.InputJsonValue,
          processedAt: new Date()
        }
      });
      if (payment.status === 'SUCCEEDED' || payment.status === 'REFUNDED') return;
      if (!['CREATED', 'PROCESSING'].includes(payment.status)) return;
      if (input.payload.status !== 'SUCCEEDED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: input.payload.status,
            ...(input.payload.providerTransactionId
              ? { providerTransactionId: input.payload.providerTransactionId }
              : {}),
            ...(input.payload.failureCode ? { failureCode: input.payload.failureCode } : {}),
            ...(input.payload.failureReason ? { failureReason: input.payload.failureReason } : {}),
            failedAt: new Date()
          }
        });
        await createNotification(
          {
            userId: payment.userId,
            type: 'PAYMENT_FAILED',
            title: 'Paiement non confirmé',
            body: input.payload.failureReason ?? 'Le paiement n’a pas été confirmé.',
            data: { paymentId: payment.id }
          },
          tx
        );
        if (payment.type === 'BOOST') {
          await tx.boost.updateMany({
            where: { paymentId: payment.id, status: 'PENDING_PAYMENT' },
            data: {
              status: 'REJECTED',
              endsAt: new Date(),
              cancelReason: input.payload.failureReason ?? 'Paiement non confirme.'
            }
          });
        }
        return;
      }
      if (payment.type === 'BOOST') {
        const boost = await tx.boost.findUnique({
          where: { paymentId: payment.id },
          include: { plan: true }
        });
        if (!boost || boost.status !== 'PENDING_PAYMENT') {
          throw new ApiError(409, 'Boost incompatible avec le paiement.', 'PAYMENT_BOOST_CONFLICT');
        }
        const now = new Date();
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCEEDED',
            ...(input.payload.providerTransactionId
              ? { providerTransactionId: input.payload.providerTransactionId }
              : {}),
            paidAt: now
          }
        });
        await tx.boost.update({
          where: { id: boost.id },
          data: {
            status: 'ACTIVE',
            startsAt: now,
            endsAt: new Date(now.getTime() + boost.plan.durationHours * 60 * 60_000)
          }
        });
        await tx.ledgerEntry.createMany({
          data: [
            {
              paymentId: payment.id,
              type: 'PAYMENT',
              direction: 'DEBIT',
              amount: payment.amount,
              accountCode: 'CASH_PROVIDER',
              reference: payment.internalReference
            },
            {
              paymentId: payment.id,
              type: 'ADJUSTMENT',
              direction: 'CREDIT',
              amount: payment.amount,
              accountCode: 'BOOST_REVENUE',
              reference: payment.internalReference
            }
          ]
        });
        await createNotification({
          userId: payment.userId,
          type: 'BOOST_ACTIVATED',
          title: 'Boost activé',
          body: 'Votre annonce bénéficie maintenant du boost sélectionné.',
          data: { boostId: boost.id, productId: boost.productId }
        }, tx);
        return;
      }
      if (!payment.order || payment.order.status !== 'AWAITING_PAYMENT') {
        throw new ApiError(409, 'État de commande incompatible avec le paiement.', 'PAYMENT_ORDER_CONFLICT');
      }
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${payment.order.productId}::uuid FOR UPDATE`;
      const payableProduct = await tx.product.findUnique({
        where: { id: payment.order.productId },
        select: { status: true }
      });
      if (payableProduct?.status !== 'RESERVED') {
        throw new ApiError(409, 'Annonce incompatible avec le paiement.', 'PAYMENT_PRODUCT_CONFLICT');
      }
      const now = new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          ...(input.payload.providerTransactionId
            ? { providerTransactionId: input.payload.providerTransactionId }
            : {}),
          paidAt: now,
          failureCode: null,
          failureReason: null
        }
      });
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: 'PAID', paidAt: now, paymentExpiresAt: null, version: { increment: 1 } }
      });
      await tx.product.update({
        where: { id: payment.order.productId },
        data: { status: 'RESERVED', reservedAt: now }
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.order.id,
          actorType: 'PAYMENT_PROVIDER',
          fromStatus: 'AWAITING_PAYMENT',
          toStatus: 'PAID'
        }
      });
      await tx.payout.upsert({
        where: { orderId: payment.order.id },
        update: {},
        create: {
          orderId: payment.order.id,
          sellerId: payment.order.sellerId,
          status: 'BLOCKED',
          provider: payment.provider,
          amount: payment.order.sellerNetAmount,
          internalReference: reference('OUT')
        }
      });
      await tx.ledgerEntry.createMany({
        data: [
          {
            paymentId: payment.id,
            type: 'PAYMENT',
            direction: 'DEBIT',
            amount: payment.amount,
            accountCode: 'CASH_PROVIDER',
            reference: payment.internalReference
          },
          {
            paymentId: payment.id,
            type: 'BUYER_PROTECTION',
            direction: 'CREDIT',
            amount: payment.order.buyerProtectionFee,
            accountCode: 'BUYER_PROTECTION_REVENUE',
            reference: payment.internalReference
          },
          {
            paymentId: payment.id,
            type: 'DELIVERY_FEE',
            direction: 'CREDIT',
            amount: payment.order.deliveryFee,
            accountCode: 'DELIVERY_PAYABLE',
            reference: payment.internalReference
          },
          {
            paymentId: payment.id,
            type: 'SELLER_PAYABLE',
            direction: 'CREDIT',
            amount: payment.order.sellerNetAmount,
            accountCode: 'SELLER_PAYABLE',
            reference: payment.internalReference
          }
        ]
      });
      await createNotification(
        {
          userId: payment.userId,
          type: 'PAYMENT_SUCCEEDED',
          title: 'Paiement sécurisé',
          body: 'Votre paiement est confirmé et conservé jusqu’à la fin de la transaction.',
          data: { paymentId: payment.id, orderId: payment.order.id }
        },
        tx
      );
    });
    if (transactionResult !== 'duplicate') await emitPaymentCommerceUpdates(targetPaymentId);
    return { duplicate: transactionResult === 'duplicate' };
  },

  async handlePayoutWebhook(input: {
    providerSlug: keyof typeof providerMap;
    rawBody?: Buffer | undefined;
    signature?: string | undefined;
    payload: {
      internalReference: string;
      providerEventId: string;
      providerTransactionId?: string;
      status: 'SUCCEEDED' | 'FAILED';
      failureReason?: string;
    };
  }) {
    if (
      !verifyWebhookSignature(input.rawBody, input.signature, env.PAYMENT_WEBHOOK_SECRET)
    ) {
      throw new ApiError(401, 'Signature webhook invalide.', 'INVALID_WEBHOOK_SIGNATURE');
    }
    const provider = providerMap[input.providerSlug];
    const payout = await prisma.payout.findUnique({
      where: { internalReference: input.payload.internalReference }
    });
    if (!payout || payout.provider !== provider) {
      throw new ApiError(404, 'Reversement introuvable.', 'PAYOUT_NOT_FOUND');
    }
    const eventOwner = await prisma.payout.findUnique({
      where: { providerEventId: input.payload.providerEventId },
      select: { id: true }
    });
    if (eventOwner) {
      if (eventOwner.id === payout.id) return { duplicate: true };
      throw new ApiError(409, 'Événement fournisseur déjà utilisé.', 'PROVIDER_EVENT_REUSED');
    }
    if (payout.status === 'SUCCEEDED') return { duplicate: true };

    const transactionResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM payouts WHERE id = ${payout.id}::uuid FOR UPDATE`;
      const locked = await tx.payout.findUnique({ where: { id: payout.id } });
      if (!locked) throw new ApiError(404, 'Reversement introuvable.', 'PAYOUT_NOT_FOUND');
      if (locked.providerEventId === input.payload.providerEventId || locked.status === 'SUCCEEDED') {
        return 'duplicate' as const;
      }
      if (locked.status !== 'PROCESSING') {
        throw new ApiError(409, 'Reversement non traitable.', 'PAYOUT_NOT_PROCESSING');
      }

      const now = new Date();
      if (input.payload.status === 'FAILED') {
        await tx.payout.update({
          where: { id: locked.id },
          data: {
            status: 'FAILED',
            providerEventId: input.payload.providerEventId,
            ...(input.payload.providerTransactionId
              ? { providerTransactionId: input.payload.providerTransactionId }
              : {}),
            processedAt: now,
            failureReason: input.payload.failureReason ?? 'Échec signalé par le fournisseur.'
          }
        });
        await createNotification(
          {
            userId: locked.sellerId,
            type: 'SYSTEM',
            title: 'Reversement à vérifier',
            body: 'Le reversement n’a pas abouti. Notre équipe va le vérifier.',
            data: { payoutId: locked.id, orderId: locked.orderId }
          },
          tx
        );
        return 'processed' as const;
      }

      await tx.payout.update({
        where: { id: locked.id },
        data: {
          status: 'SUCCEEDED',
          providerEventId: input.payload.providerEventId,
          ...(input.payload.providerTransactionId
            ? { providerTransactionId: input.payload.providerTransactionId }
            : {}),
          processedAt: now,
          failureReason: null
        }
      });
      await tx.ledgerEntry.createMany({
        data: [
          {
            payoutId: locked.id,
            type: 'PAYOUT',
            direction: 'DEBIT',
            amount: locked.amount,
            currency: locked.currency,
            accountCode: 'SELLER_PAYABLE',
            reference: locked.internalReference
          },
          {
            payoutId: locked.id,
            type: 'PAYOUT',
            direction: 'CREDIT',
            amount: locked.amount,
            currency: locked.currency,
            accountCode: 'CASH_PROVIDER',
            reference: locked.internalReference
          }
        ]
      });
      await createNotification(
        {
          userId: locked.sellerId,
          type: 'SYSTEM',
          title: 'Reversement effectué',
          body: 'Le montant de votre vente a été reversé.',
          data: { payoutId: locked.id, orderId: locked.orderId }
        },
        tx
      );
      return 'processed' as const;
    });
    if (transactionResult === 'processed') await emitPayoutUpdate(payout.id);
    return { duplicate: transactionResult === 'duplicate' };
  },

  async list(userId: string, cursor?: string, limit = 20) {
    const rows = await prisma.payment.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
    const more = rows.length > limit;
    const page = more ? rows.slice(0, limit) : rows;
    return {
      items: serialize(page),
      nextCursor: more ? page.at(-1)?.id ?? null : null
    };
  },

  async detail(userId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId, archivedAt: null },
      include: { events: { orderBy: { receivedAt: 'asc' } }, refunds: true }
    });
    if (!payment) throw new ApiError(404, 'Paiement introuvable.', 'PAYMENT_NOT_FOUND');
    return serialize(payment);
  }
};
