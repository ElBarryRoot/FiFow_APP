import type { Prisma } from '@prisma/client';
import { getStorage } from '../../shared/storage/storage.service.js';

export const orderDetailInclude = {
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      images: {
        where: { archivedAt: null },
        orderBy: [{ isMain: 'desc' as const }, { sortOrder: 'asc' as const }],
        take: 1,
        select: { storageKey: true }
      }
    }
  },
  buyer: { select: { id: true, fullName: true, avatarKey: true } },
  seller: { select: { id: true, fullName: true, avatarKey: true, sellerVerificationStatus: true } },
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
  delivery: { include: { history: { orderBy: { createdAt: 'asc' as const } } } },
  payments: {
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      amount: true,
      currency: true,
      failureCode: true,
      failureReason: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true
    }
  },
  reviews: {
    select: { id: true, authorId: true, subjectId: true, rating: true, status: true, createdAt: true }
  }
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

export const orderSummaryInclude = {
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      images: {
        where: { archivedAt: null },
        orderBy: [{ isMain: 'desc' as const }, { sortOrder: 'asc' as const }],
        take: 1,
        select: { storageKey: true }
      }
    }
  },
  buyer: { select: { id: true, fullName: true, avatarKey: true } },
  seller: { select: { id: true, fullName: true, avatarKey: true, sellerVerificationStatus: true } },
  payments: {
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      amount: true,
      currency: true,
      failureCode: true,
      failureReason: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true
    }
  },
  reviews: {
    where: { status: { not: 'ARCHIVED' as const } },
    select: { id: true, authorId: true }
  }
} satisfies Prisma.OrderInclude;

export type OrderSummary = Prisma.OrderGetPayload<{ include: typeof orderSummaryInclude }>;

function userSummary(user: { id: string; fullName: string; avatarKey: string | null }) {
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarKey ? getStorage().publicUrl(user.avatarKey) : null
  };
}

function availableActions(order: OrderWithDetails, userId: string) {
  const buyer = order.buyerId === userId;
  const seller = order.sellerId === userId;
  const actions: string[] = [];

  if (seller && order.status === 'AWAITING_SELLER_CONFIRMATION') actions.push('SELLER_CONFIRM');
  if ((buyer || seller) && ['AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT'].includes(order.status)) {
    actions.push('CANCEL');
  }
  if (buyer && order.status === 'AWAITING_PAYMENT') actions.push('PAY');
  if (seller && order.status === 'PAID') actions.push('PREPARE');
  if (seller && order.status === 'PREPARING') actions.push('READY');
  if (seller && order.status === 'READY_FOR_HANDOVER' && order.handoverMode !== 'HAND_TO_HAND') {
    actions.push('SHIP');
  }
  if (buyer && ['READY_FOR_HANDOVER', 'IN_DELIVERY'].includes(order.status)) actions.push('RECEIVE');
  if (
    ['PAID', 'PREPARING', 'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED'].includes(order.status)
  ) {
    actions.push('DISPUTE');
  }
  if (order.status === 'COMPLETED' && !order.reviews.some((review) => review.authorId === userId)) {
    actions.push('REVIEW');
  }
  return actions;
}

export function toOrderDto(order: OrderWithDetails, userId: string) {
  const myReview = order.reviews.find((review) => review.authorId === userId) ?? null;
  const counterpart = order.buyerId === userId ? order.seller : order.buyer;
  const mainImage = order.product.images[0]?.storageKey;
  const payments = order.payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toString()
  }));

  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    role: order.buyerId === userId ? 'BUYER' : 'SELLER',
    product: {
      id: order.product.id,
      title: order.product.title,
      slug: order.product.slug,
      status: order.product.status,
      imageUrl: mainImage ? getStorage().publicUrl(mainImage) : null
    },
    counterpart: userSummary(counterpart),
    buyer: userSummary(order.buyer),
    seller: {
      ...userSummary(order.seller),
      verified: order.seller.sellerVerificationStatus === 'APPROVED'
    },
    conversationId: order.conversationId,
    acceptedOfferId: order.acceptedOfferId,
    handoverMode: order.handoverMode,
    handoverDetails: order.handoverDetails,
    currency: order.currency,
    itemAmount: order.itemAmount.toString(),
    buyerProtectionFee: order.buyerProtectionFee.toString(),
    deliveryFee: order.deliveryFee.toString(),
    discountAmount: order.discountAmount.toString(),
    totalAmount: order.totalAmount.toString(),
    sellerNetAmount: order.sellerNetAmount.toString(),
    productSnapshot: order.productSnapshot,
    delivery: order.delivery,
    payment: payments[0] ?? null,
    payments,
    statusHistory: order.statusHistory,
    myReview,
    canReview: order.status === 'COMPLETED' && !myReview,
    availableActions: availableActions(order, userId),
    sellerConfirmedAt: order.sellerConfirmedAt,
    sellerConfirmationExpiresAt: order.sellerConfirmationExpiresAt,
    paymentExpiresAt: order.paymentExpiresAt,
    paidAt: order.paidAt,
    preparedAt: order.preparedAt,
    receivedAt: order.receivedAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    disputedAt: order.disputedAt,
    disputeReason: order.disputeReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

export function toOrderSummaryDto(order: OrderSummary, userId: string) {
  const mainImage = order.product.images[0]?.storageKey;
  const counterpart = order.buyerId === userId ? order.seller : order.buyer;
  const payment = order.payments[0]
    ? { ...order.payments[0], amount: order.payments[0].amount.toString() }
    : null;
  const reviewed = order.reviews.some((review) => review.authorId === userId);

  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    role: order.buyerId === userId ? 'BUYER' : 'SELLER',
    product: {
      id: order.product.id,
      title: order.product.title,
      slug: order.product.slug,
      status: order.product.status,
      imageUrl: mainImage ? getStorage().publicUrl(mainImage) : null
    },
    counterpart: userSummary(counterpart),
    buyer: userSummary(order.buyer),
    seller: {
      ...userSummary(order.seller),
      verified: order.seller.sellerVerificationStatus === 'APPROVED'
    },
    handoverMode: order.handoverMode,
    currency: order.currency,
    totalAmount: order.totalAmount.toString(),
    payment,
    canReview: order.status === 'COMPLETED' && !reviewed,
    sellerConfirmationExpiresAt: order.sellerConfirmationExpiresAt,
    paymentExpiresAt: order.paymentExpiresAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}
