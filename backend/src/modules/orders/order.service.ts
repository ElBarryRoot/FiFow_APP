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
import { isProductSellable } from './inventory.service.js';

const MAX_SAFE_TRANSACTION_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER);

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
    const requestedItems = body.items ?? [{ productId: body.productId!, quantity: 1 }];
    const requestedById = new Map(requestedItems.map((item) => [item.productId, item]));
    const productIds = requestedItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
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
    if (products.length !== requestedItems.length) {
      throw new ApiError(404, 'Une annonce est indisponible.', 'PRODUCT_NOT_AVAILABLE');
    }
    const productsById = new Map(products.map((product) => [product.id, product]));
    const orderedProducts = productIds.map((id) => productsById.get(id)!);
    const sellerId = orderedProducts[0]!.sellerId;
    if (orderedProducts.some((product) => product.sellerId !== sellerId)) {
      throw new ApiError(400, 'Une commande doit contenir les articles d’un seul vendeur.', 'MULTIPLE_SELLERS_NOT_ALLOWED');
    }
    if (sellerId === userId) throw new ApiError(400, 'Achat de sa propre annonce interdit.', 'OWN_PRODUCT');

    for (const product of orderedProducts) {
      const quantity = requestedById.get(product.id)!.quantity;
      if (!isProductSellable(product) || product.stockQuantity - product.reservedQuantity < quantity) {
        throw new ApiError(409, `« ${product.title} » n’est plus disponible dans cette quantité.`, 'PRODUCT_NOT_AVAILABLE');
      }
      if (product.listingMode !== 'STOCK' && quantity !== 1) {
        throw new ApiError(400, 'Un article unique ou un lot ne peut être acheté qu’une fois.', 'INVALID_ITEM_QUANTITY');
      }
      if (!product.handoverModes.includes(body.handoverMode)) {
        throw new ApiError(400, `Le mode de remise n’est pas proposé pour « ${product.title} ».`, 'INVALID_HANDOVER_MODE');
      }
    }

    const blocked = await prisma.userBlock.findFirst({
      where: { OR: [{ blockerId: userId, blockedId: sellerId }, { blockerId: sellerId, blockedId: userId }] },
      select: { id: true }
    });
    if (blocked) throw new ApiError(403, 'Interaction impossible.', 'USER_BLOCKED');

    let negotiatedAmount: bigint | null = null;
    if (body.offerId) {
      const onlyProduct = orderedProducts[0]!;
      const offer = await prisma.offer.findFirst({
        where: {
          id: body.offerId,
          productId: onlyProduct.id,
          status: 'ACCEPTED',
          handoverMode: body.handoverMode,
          acceptedOrder: null,
          conversation: { buyerId: userId, sellerId, status: 'ACTIVE' },
          OR: [{ creatorId: userId }, { recipientId: userId }]
        },
        select: { amount: true }
      });
      if (!offer) throw new ApiError(400, 'Offre acceptée invalide.', 'INVALID_ACCEPTED_OFFER');
      negotiatedAmount = offer.amount;
    }

    const lines = orderedProducts.map((product) => {
      const quantity = requestedById.get(product.id)!.quantity;
      const unitPrice = negotiatedAmount ?? product.price;
      return { product, quantity, unitPrice, lineTotal: unitPrice * BigInt(quantity) };
    });
    const itemAmount = lines.reduce((total, line) => total + line.lineTotal, 0n);

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
    if (totalAmount > MAX_SAFE_TRANSACTION_AMOUNT) {
      throw new ApiError(
        400,
        'Le montant de cette commande dépasse la limite autorisée.',
        'ORDER_AMOUNT_TOO_LARGE'
      );
    }
    const firstLine = lines[0]!;
    const quote = await prisma.checkoutQuote.create({
      data: {
        buyerId: userId,
        productId: firstLine.product.id,
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
        expiresAt: new Date(Date.now() + 15 * 60_000),
        items: {
          create: lines.map(({ product, quantity, unitPrice, lineTotal }) => ({
            productId: product.id,
            ...(body.offerId ? { offerId: body.offerId } : {}),
            quantity,
            unitPrice,
            lineTotal,
            productSnapshot: {
              id: product.id,
              title: product.title,
              slug: product.slug,
              description: product.description,
              unitPrice: unitPrice.toString(),
              currency: product.currency,
              listingMode: product.listingMode,
              imageKey: product.images[0]?.storageKey ?? null
            }
          }))
        }
      }
    });
    const imageKey = firstLine.product.images[0]?.storageKey;
    return {
      id: quote.id,
      product: {
        id: firstLine.product.id,
        title: firstLine.product.title,
        slug: firstLine.product.slug,
        seller: firstLine.product.seller,
        imageUrl: imageKey ? getStorage().publicUrl(imageKey) : null
      },
      seller: firstLine.product.seller,
      items: lines.map(({ product, quantity, unitPrice, lineTotal }) => ({
        product: {
          id: product.id,
          title: product.title,
          slug: product.slug,
          listingMode: product.listingMode,
          imageUrl: product.images[0]?.storageKey ? getStorage().publicUrl(product.images[0].storageKey) : null
        },
        quantity,
        unitPrice: unitPrice.toString(),
        lineTotal: lineTotal.toString()
      })),
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
          where: { id: input.quoteId, buyerId: userId, consumedAt: null, expiresAt: { gt: new Date() } },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
              include: { product: { include: { seller: { select: { id: true, fullName: true } } } } }
            }
          }
        });
        if (!quote) throw new ApiError(409, 'Devis invalide ou expire.', 'QUOTE_NOT_AVAILABLE');
        if (quote.items.length === 0) throw new ApiError(409, 'Devis incomplet.', 'QUOTE_ITEMS_MISSING');
        const productIds = quote.items.map((item) => item.productId);
        for (const productId of [...productIds].sort()) {
          await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
        }
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          include: { seller: { select: { id: true, fullName: true } } }
        });
        const productsById = new Map(products.map((product) => [product.id, product]));
        const firstProduct = productsById.get(quote.items[0]!.productId);
        if (!firstProduct || products.length !== quote.items.length) {
          throw new ApiError(409, 'Une annonce est devenue indisponible.', 'PRODUCT_NOT_AVAILABLE');
        }
        for (const item of quote.items) {
          const product = productsById.get(item.productId)!;
          if (
            product.sellerId !== firstProduct.sellerId ||
            !isProductSellable(product) ||
            product.stockQuantity - product.reservedQuantity < item.quantity
          ) {
            throw new ApiError(409, `« ${product.title} » n’est plus disponible.`, 'PRODUCT_NOT_AVAILABLE');
          }
          if (product.listingMode !== 'STOCK' && item.quantity !== 1) {
            throw new ApiError(409, 'Quantité du devis invalide.', 'INVALID_ITEM_QUANTITY');
          }
        }
        if (input.conversationId) {
          if (quote.items.length !== 1) {
            throw new ApiError(400, 'Une conversation ne peut être liée qu’à un achat direct.', 'INVALID_CONVERSATION');
          }
          const conversation = await tx.conversation.findFirst({
            where: {
              id: input.conversationId,
              productId: firstProduct.id,
              buyerId: userId,
              sellerId: firstProduct.sellerId
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
        const reservationExpiresAt = new Date(now.getTime() + confirmationMinutes * 60_000);
        const created = await tx.order.create({
          data: {
            reference: reference(),
            idempotencyKey,
            productId: firstProduct.id,
            buyerId: userId,
            sellerId: firstProduct.sellerId,
            sellerConfirmationExpiresAt: reservationExpiresAt,
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
            productSnapshot: quote.items[0]!.productSnapshot as Prisma.InputJsonValue,
            buyerSnapshot: { id: userId },
            sellerSnapshot: { id: firstProduct.seller.id, fullName: firstProduct.seller.fullName },
            items: {
              create: quote.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
                productSnapshot: item.productSnapshot as Prisma.InputJsonValue,
                reservation: {
                  create: {
                    productId: item.productId,
                    quantity: item.quantity,
                    expiresAt: reservationExpiresAt
                  }
                }
              }))
            },
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
        for (const item of quote.items) {
          const product = productsById.get(item.productId)!;
          const reservedQuantity = product.reservedQuantity + item.quantity;
          await tx.product.update({
            where: { id: product.id },
            data: {
              reservedQuantity,
              reservedAt: now,
              status: product.stockQuantity - reservedQuantity > 0 ? 'AVAILABLE' : 'RESERVED'
            }
          });
        }
        await tx.checkoutQuote.update({ where: { id: quote.id }, data: { consumedAt: now } });
        await tx.cartItem.deleteMany({
          where: { cart: { buyerId: userId }, productId: { in: productIds } }
        });
        await createNotification({
          userId: created.sellerId,
          type: 'ORDER_CREATED',
          title: 'Nouvelle commande',
          body: quote.items.length > 1
            ? `Un acheteur attend votre confirmation pour ${quote.items.length} articles.`
            : 'Un acheteur attend votre confirmation.',
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
