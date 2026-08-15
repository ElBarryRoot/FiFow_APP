import { Prisma, type ProductStatus } from '@prisma/client';
import { ApiError } from '../../shared/errors/api-error.js';

type Transaction = Prisma.TransactionClient;

const SELLABLE_STATUSES: ProductStatus[] = ['AVAILABLE', 'RESERVED'];

async function lockProducts(tx: Transaction, productIds: string[]) {
  for (const productId of [...new Set(productIds)].sort()) {
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
  }
}

async function assertCompleteReservationSet(tx: Transaction, orderId: string, reservationCount: number) {
  const itemCount = await tx.orderItem.count({ where: { orderId } });
  if (itemCount === 0 || reservationCount !== itemCount) {
    throw new ApiError(409, 'État de réservation incomplet.', 'INVENTORY_RESERVATION_INCONSISTENT');
  }
}

function sellableStatus(
  current: { status: ProductStatus; moderationStatus: string; archivedAt: Date | null },
  stockQuantity: number,
  reservedQuantity: number
): ProductStatus {
  if (current.archivedAt || current.moderationStatus !== 'APPROVED') return current.status;
  if (stockQuantity === 0) return 'SOLD';
  return stockQuantity - reservedQuantity > 0 ? 'AVAILABLE' : 'RESERVED';
}

export async function releaseOrderReservations(tx: Transaction, orderId: string, reason: string, now = new Date()) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderItem: { orderId }, status: 'ACTIVE' },
    select: { id: true, productId: true, quantity: true }
  });
  await assertCompleteReservationSet(tx, orderId, reservations.length);
  await lockProducts(
    tx,
    reservations.map((row) => row.productId)
  );

  for (const reservation of reservations) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: reservation.productId } });
    const reservedQuantity = product.reservedQuantity - reservation.quantity;
    if (reservedQuantity < 0) {
      throw new ApiError(409, 'État de réservation incohérent.', 'INVENTORY_RESERVATION_INCONSISTENT');
    }
    await tx.product.update({
      where: { id: product.id },
      data: {
        reservedQuantity,
        status: sellableStatus(product, product.stockQuantity, reservedQuantity),
        ...(reservedQuantity === 0 ? { reservedAt: null } : {})
      }
    });
    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: 'RELEASED', releasedAt: now, releaseReason: reason }
    });
  }
  return reservations.length;
}

export async function consumeOrderReservations(tx: Transaction, orderId: string, now = new Date()) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderItem: { orderId }, status: 'ACTIVE' },
    select: { id: true, productId: true, quantity: true }
  });
  const itemCount = await tx.orderItem.count({ where: { orderId } });
  if (reservations.length === 0) {
    throw new ApiError(409, 'La réservation de stock a expiré.', 'INVENTORY_RESERVATION_EXPIRED');
  }
  if (reservations.length !== itemCount) {
    throw new ApiError(409, 'État de réservation incomplet.', 'INVENTORY_RESERVATION_INCONSISTENT');
  }
  await lockProducts(
    tx,
    reservations.map((row) => row.productId)
  );

  for (const reservation of reservations) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: reservation.productId } });
    const stockQuantity = product.stockQuantity - reservation.quantity;
    const reservedQuantity = product.reservedQuantity - reservation.quantity;
    if (stockQuantity < 0 || reservedQuantity < 0) {
      throw new ApiError(409, 'Stock devenu insuffisant.', 'INVENTORY_RESERVATION_INCONSISTENT');
    }
    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity,
        reservedQuantity,
        status: sellableStatus(product, stockQuantity, reservedQuantity),
        ...(stockQuantity === 0 ? { soldAt: now } : {}),
        ...(reservedQuantity === 0 ? { reservedAt: null } : {})
      }
    });
    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: 'CONSUMED', consumedAt: now }
    });
  }
  return reservations.length;
}

export async function restoreConsumedOrderInventory(
  tx: Transaction,
  orderId: string,
  reason: string,
  now = new Date()
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderItem: { orderId }, status: 'CONSUMED' },
    select: { id: true, productId: true, quantity: true }
  });
  await assertCompleteReservationSet(tx, orderId, reservations.length);
  await lockProducts(
    tx,
    reservations.map((row) => row.productId)
  );

  for (const reservation of reservations) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: reservation.productId } });
    const stockQuantity = product.stockQuantity + reservation.quantity;
    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity,
        status: sellableStatus(product, stockQuantity, product.reservedQuantity),
        soldAt: null
      }
    });
    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: 'RELEASED', releasedAt: now, releaseReason: reason }
    });
  }
  return reservations.length;
}

export async function extendOrderReservations(tx: Transaction, orderId: string, expiresAt: Date) {
  const [itemCount, updated] = await Promise.all([
    tx.orderItem.count({ where: { orderId } }),
    tx.inventoryReservation.updateMany({
      where: { orderItem: { orderId }, status: 'ACTIVE' },
      data: { expiresAt }
    })
  ]);
  if (itemCount === 0 || updated.count !== itemCount) {
    throw new ApiError(409, 'La réservation de stock a expiré.', 'INVENTORY_RESERVATION_EXPIRED');
  }
}

export function isProductSellable(product: {
  status: ProductStatus;
  moderationStatus: string;
  archivedAt: Date | null;
  stockQuantity: number;
  reservedQuantity: number;
}) {
  return (
    SELLABLE_STATUSES.includes(product.status) &&
    product.moderationStatus === 'APPROVED' &&
    !product.archivedAt &&
    product.stockQuantity - product.reservedQuantity > 0
  );
}
