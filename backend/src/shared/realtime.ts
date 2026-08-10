type RoomEmitter = {
  emit(event: string, payload: unknown): void;
};

export type RealtimeServer = {
  to(room: string): RoomEmitter;
};

let io: RealtimeServer | null = null;
export function setRealtimeServer(server: RealtimeServer) {
  io = server;
}
export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
export function emitToConversation(conversationId: string, event: string, payload: unknown) {
  io?.to(`conversation:${conversationId}`).emit(event, payload);
}

export function emitToStaff(event: string, payload: unknown) {
  io?.to('role:staff').emit(event, payload);
}

type RealtimeTimestamp = Date | string | null | undefined;

function timestamp(value: RealtimeTimestamp) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function emitAdminResourceUpdated(
  resource: string,
  id: string,
  status: string,
  updatedAt?: RealtimeTimestamp
) {
  emitToStaff('admin:resource-updated', {
    resource,
    id,
    status,
    updatedAt: timestamp(updatedAt)
  });
}

type OrderRealtimeEvent = {
  id: string;
  status: string;
  buyerId: string;
  sellerId: string;
  updatedAt?: RealtimeTimestamp;
};

export function emitOrderUpdated(order: OrderRealtimeEvent) {
  const payload = {
    orderId: order.id,
    status: order.status,
    updatedAt: timestamp(order.updatedAt)
  };
  emitToUser(order.buyerId, 'order:updated', payload);
  if (order.sellerId !== order.buyerId) emitToUser(order.sellerId, 'order:updated', payload);
  emitAdminResourceUpdated('ORDER', order.id, order.status, order.updatedAt);
}

type PaymentRealtimeEvent = {
  id: string;
  status: string;
  userId: string;
  orderId?: string | null;
  updatedAt?: RealtimeTimestamp;
};

export function emitPaymentUpdated(payment: PaymentRealtimeEvent) {
  emitToUser(payment.userId, 'payment:updated', {
    paymentId: payment.id,
    status: payment.status,
    ...(payment.orderId ? { orderId: payment.orderId } : {}),
    updatedAt: timestamp(payment.updatedAt)
  });
  emitAdminResourceUpdated('PAYMENT', payment.id, payment.status, payment.updatedAt);
}

type PayoutRealtimeEvent = {
  id: string;
  status: string;
  sellerId: string;
  orderId: string;
  updatedAt?: RealtimeTimestamp;
};

export function emitPayoutUpdated(payout: PayoutRealtimeEvent) {
  emitToUser(payout.sellerId, 'payout:updated', {
    payoutId: payout.id,
    orderId: payout.orderId,
    status: payout.status,
    updatedAt: timestamp(payout.updatedAt)
  });
  emitAdminResourceUpdated('PAYOUT', payout.id, payout.status, payout.updatedAt);
}

type BoostRealtimeEvent = {
  id: string;
  status: string;
  sellerId: string;
  productId: string;
  updatedAt?: RealtimeTimestamp;
};

export function emitBoostUpdated(boost: BoostRealtimeEvent) {
  emitToUser(boost.sellerId, 'boost:updated', {
    boostId: boost.id,
    productId: boost.productId,
    status: boost.status,
    updatedAt: timestamp(boost.updatedAt)
  });
  emitAdminResourceUpdated('BOOST', boost.id, boost.status, boost.updatedAt);
}
