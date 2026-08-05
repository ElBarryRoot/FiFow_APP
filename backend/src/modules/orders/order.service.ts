import { randomBytes } from 'node:crypto';
import { Prisma, type OrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { createNotification } from '../notifications/notification.service.js';
import {
  orderDetailInclude,
  orderSummaryInclude,
  toOrderDto,
  toOrderSummaryDto
} from './order.dto.js';
import type { QuoteBody } from './order.schemas.js';

function reference() {
  return `FF-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function numericSetting(key: string, fallback: number, minimum: number, maximum: number) {
  const row = await prisma.appSetting.findUnique({ where: { key }, select: { value: true } });
  const value = row?.value;
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

async function stringSetting(key: string, fallback: string) {
  const row = await prisma.appSetting.findUnique({ where: { key }, select: { value: true } });
  return typeof row?.value === 'string' && row.value.length <= 40 ? row.value : fallback;
}

function orderConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiError(
      409,
      'Cette annonce fait deja l objet d une transaction active.',
      'PRODUCT_ALREADY_IN_ACTIVE_ORDER'
    );
  }
  throw error;
}

export const orderService = {
  async paymentDeadline() {
    const minutes = await numericSetting('order_payment_timeout_minutes', 120, 15, 10_080);
    return new Date(Date.now() + minutes * 60_000);
  },

  async quote(userId: string, body: QuoteBody) {
    const product = await prisma.product.findFirst({
      where: { id: body.productId, status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null },
      include: {
        seller: { select: { id: true, fullName: true } },
        images: {
          where: { archivedAt: null },
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { storageKey: true }
        }
      }
    });
    if (!product) throw new ApiError(404, 'Annonce indisponible.', 'PRODUCT_NOT_AVAILABLE');
    if (product.sellerId === userId) {
      throw new ApiError(400, 'Achat de sa propre annonce interdit.', 'OWN_PRODUCT');
    }
    if (!product.handoverModes.includes(body.handoverMode)) {
      throw new ApiError(400, 'Mode de remise indisponible.', 'INVALID_HANDOVER_MODE');
    }

    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: product.sellerId },
          { blockerId: product.sellerId, blockedId: userId }
        ]
      },
      select: { id: true }
    });
    if (blocked) throw new ApiError(403, 'Interaction impossible.', 'USER_BLOCKED');

    const activeOrder = await prisma.order.findFirst({
      where: {
        productId: product.id,
        status: {
          in: [
            'AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'RESERVED', 'PREPARING',
            'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED', 'DISPUTED'
          ]
        }
      },
      select: { id: true }
    });
    if (activeOrder) {
      throw new ApiError(409, 'Cette annonce est deja reservee.', 'PRODUCT_ALREADY_IN_ACTIVE_ORDER');
    }

    let itemAmount = product.price;
    if (body.offerId) {
      const offer = await prisma.offer.findFirst({
        where: {
          id: body.offerId,
          productId: product.id,
          status: 'ACCEPTED',
          handoverMode: body.handoverMode,
          acceptedOrder: null,
          conversation: { buyerId: userId, sellerId: product.sellerId, status: 'ACTIVE' },
          OR: [{ creatorId: userId }, { recipientId: userId }]
        },
        select: { amount: true }
      });
      if (!offer) {
        throw new ApiError(400, 'Offre acceptee invalide.', 'INVALID_ACCEPTED_OFFER');
      }
      itemAmount = offer.amount;
    }

    const [fixedFee, rateBps, homeDeliveryFee, pickupFee, termsVersion, policyVersion] = await Promise.all([
      numericSetting('buyer_protection_fixed_fee', 5_000, 0, 1_000_000_000),
      numericSetting('buyer_protection_rate_bps', 500, 0, 5_000),
      numericSetting('home_delivery_fee', 0, 0, 1_000_000_000),
      numericSetting('pickup_point_fee', 0, 0, 1_000_000_000),
      stringSetting('terms_version', '1.0'),
      stringSetting('buyer_protection_policy_version', '1.0')
    ]);
    const buyerProtectionFee = BigInt(fixedFee) + (itemAmount * BigInt(rateBps)) / 10_000n;
    const deliveryFee = body.handoverMode === 'HOME_DELIVERY'
      ? BigInt(homeDeliveryFee)
      : body.handoverMode === 'PICKUP_POINT'
        ? BigInt(pickupFee)
        : 0n;
    const totalAmount = itemAmount + buyerProtectionFee + deliveryFee;
    const quote = await prisma.checkoutQuote.create({
      data: {
        buyerId: userId,
        productId: product.id,
        ...(body.offerId ? { offerId: body.offerId } : {}),
        itemAmount,
        buyerProtectionFee,
        deliveryFee,
        totalAmount,
        sellerNetAmount: itemAmount,
        handoverMode: body.handoverMode,
        handoverDetails: body.handoverDetails as Prisma.InputJsonValue,
        feePolicyVersion: policyVersion,
        termsVersion,
        expiresAt: new Date(Date.now() + 15 * 60_000)
      }
    });
    const imageKey = product.images[0]?.storageKey;
    return {
      id: quote.id,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        seller: product.seller,
        imageUrl: imageKey ? getStorage().publicUrl(imageKey) : null
      },
      offerId: quote.offerId,
      handoverMode: quote.handoverMode,
      handoverDetails: quote.handoverDetails,
      currency: quote.currency,
      itemAmount: quote.itemAmount.toString(),
      buyerProtectionFee: quote.buyerProtectionFee.toString(),
      deliveryFee: quote.deliveryFee.toString(),
      discountAmount: quote.discountAmount.toString(),
      totalAmount: quote.totalAmount.toString(),
      sellerNetAmount: quote.sellerNetAmount.toString(),
      feePolicyVersion: quote.feePolicyVersion,
      termsVersion: quote.termsVersion,
      expiresAt: quote.expiresAt,
      createdAt: quote.createdAt
    };
  },

  async create(
    userId: string,
    input: { quoteId: string; conversationId?: string },
    idempotencyKey: string
  ) {
    const confirmationMinutes = await numericSetting(
      'order_confirmation_timeout_minutes',
      1_440,
      15,
      10_080
    );
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
      select: { id: true, buyerId: true, quoteId: true }
    });
    if (existing) {
      if (existing.buyerId !== userId || existing.quoteId !== input.quoteId) {
        throw new ApiError(409, 'Cle d idempotence deja utilisee.', 'IDEMPOTENCY_KEY_REUSED');
      }
      return this.detail(userId, existing.id);
    }
    let orderId: string;
    try {
      orderId = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM checkout_quotes WHERE id = ${input.quoteId}::uuid FOR UPDATE`;
        const duplicate = await tx.order.findUnique({
          where: { idempotencyKey },
          select: { id: true, buyerId: true, quoteId: true }
        });
        if (duplicate) {
          if (duplicate.buyerId !== userId || duplicate.quoteId !== input.quoteId) {
            throw new ApiError(409, 'Cle d idempotence deja utilisee.', 'IDEMPOTENCY_KEY_REUSED');
          }
          return duplicate.id;
        }
        const quote = await tx.checkoutQuote.findFirst({
          where: { id: input.quoteId, buyerId: userId, consumedAt: null, expiresAt: { gt: new Date() } }
        });
        if (!quote) throw new ApiError(409, 'Devis invalide ou expire.', 'QUOTE_NOT_AVAILABLE');

        await tx.$queryRaw`SELECT id FROM products WHERE id = ${quote.productId}::uuid FOR UPDATE`;
        const product = await tx.product.findUnique({
          where: { id: quote.productId },
          include: { seller: { select: { id: true, fullName: true } } }
        });
        if (!product || product.status !== 'AVAILABLE' || product.moderationStatus !== 'APPROVED') {
          throw new ApiError(409, 'Annonce devenue indisponible.', 'PRODUCT_NOT_AVAILABLE');
        }
        if (input.conversationId) {
          const conversation = await tx.conversation.findFirst({
            where: {
              id: input.conversationId,
              productId: quote.productId,
              buyerId: userId,
              sellerId: product.sellerId
            },
            select: { id: true }
          });
          if (!conversation) throw new ApiError(400, 'Conversation invalide.', 'INVALID_CONVERSATION');
        }

        const details = quote.handoverDetails as Record<string, unknown> | null;
        if (!details) throw new ApiError(409, 'Details de remise absents.', 'HANDOVER_DETAILS_REQUIRED');
        const delivery = quote.handoverMode === 'HOME_DELIVERY'
          ? { addressSnapshot: details as Prisma.InputJsonValue }
          : quote.handoverMode === 'PICKUP_POINT'
            ? {
                addressSnapshot: { phone: details['phone'] } as Prisma.InputJsonValue,
                pickupLocation: String(details['pickupLocation'])
              }
            : {
                addressSnapshot: { phone: details['phone'] } as Prisma.InputJsonValue,
                pickupLocation: String(details['meetingLocation'])
              };
        const now = new Date();
        const created = await tx.order.create({
          data: {
            reference: reference(),
            idempotencyKey,
            productId: quote.productId,
            buyerId: userId,
            sellerId: product.sellerId,
            sellerConfirmationExpiresAt: new Date(now.getTime() + confirmationMinutes * 60_000),
            ...(input.conversationId ? { conversationId: input.conversationId } : {}),
            acceptedOfferId: quote.offerId,
            quoteId: quote.id,
            handoverMode: quote.handoverMode,
            handoverDetails: details as Prisma.InputJsonValue,
            itemAmount: quote.itemAmount,
            buyerProtectionFee: quote.buyerProtectionFee,
            deliveryFee: quote.deliveryFee,
            discountAmount: quote.discountAmount,
            totalAmount: quote.totalAmount,
            sellerNetAmount: quote.sellerNetAmount,
            feePolicyVersion: quote.feePolicyVersion,
            termsVersion: quote.termsVersion,
            productSnapshot: {
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price.toString()
            },
            buyerSnapshot: { id: userId },
            sellerSnapshot: { id: product.seller.id, fullName: product.seller.fullName },
            statusHistory: {
              create: { actorId: userId, actorType: 'BUYER', toStatus: 'AWAITING_SELLER_CONFIRMATION' }
            },
            delivery: {
              create: {
                mode: quote.handoverMode,
                status: quote.handoverMode === 'HAND_TO_HAND' ? 'NOT_REQUIRED' : 'PENDING',
                ...delivery
              }
            }
          }
        });
        await tx.product.update({
          where: { id: product.id },
          data: { status: 'RESERVED', reservedAt: now }
        });
        await tx.checkoutQuote.update({ where: { id: quote.id }, data: { consumedAt: now } });
        await createNotification({
          userId: created.sellerId,
          type: 'ORDER_CREATED',
          title: 'Nouvelle commande',
          body: 'Un acheteur attend votre confirmation.',
          data: { orderId: created.id }
        }, tx);
        return created.id;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const concurrent = await prisma.order.findUnique({
          where: { idempotencyKey },
          select: { id: true, buyerId: true, quoteId: true }
        });
        if (concurrent?.buyerId === userId && concurrent.quoteId === input.quoteId) {
          return this.detail(userId, concurrent.id);
        }
      }
      orderConflict(error);
    }
    return this.detail(userId, orderId!);
  },

  async list(
    userId: string,
    query: { role: 'buyer' | 'seller' | 'all'; status?: OrderStatus; cursor?: string; limit: number }
  ) {
    const participantFilter = query.role === 'buyer'
      ? { buyerId: userId }
      : query.role === 'seller'
        ? { sellerId: userId }
        : { OR: [{ buyerId: userId }, { sellerId: userId }] };
    const rows = await prisma.order.findMany({
      where: { ...participantFilter, ...(query.status ? { status: query.status } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: orderSummaryInclude
    });
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items: page.map((order) => toOrderSummaryDto(order, userId)),
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null
    };
  },

  async detail(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: orderDetailInclude
    });
    if (!order) throw new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND');
    return toOrderDto(order, userId);
  }
};
