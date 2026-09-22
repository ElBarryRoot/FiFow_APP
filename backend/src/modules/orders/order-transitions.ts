import type { OrderStatus } from '@prisma/client';
import { ApiError } from '../../shared/errors/api-error.js';

/** Single source of truth for all user-facing order transitions. */
export const orderTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  AWAITING_SELLER_CONFIRMATION: ['AWAITING_PAYMENT', 'CANCELLED', 'DISPUTED'],
  AWAITING_PAYMENT: ['PAID', 'CANCELLED', 'DISPUTED'],
  PAID: ['PREPARING', 'DISPUTED', 'REFUNDED'],
  PREPARING: ['READY_FOR_HANDOVER', 'DISPUTED', 'CANCELLED'],
  READY_FOR_HANDOVER: ['IN_DELIVERY', 'COMPLETED', 'DISPUTED'],
  IN_DELIVERY: ['COMPLETED', 'DISPUTED'],
  RECEIVED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['REFUNDED', 'COMPLETED', 'CANCELLED'],
  REFUNDED: [],
  RESERVED: ['PAID', 'CANCELLED', 'DISPUTED']
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return orderTransitions[from]?.includes(to) ?? false;
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransitionOrder(from, to)) {
    throw new ApiError(409, 'Transition de commande impossible.', 'INVALID_ORDER_TRANSITION');
  }
}
