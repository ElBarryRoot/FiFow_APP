import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Prisma } from '@prisma/client';
import {
  consumeOrderReservations,
  isProductSellable,
  releaseOrderReservations,
  restoreConsumedOrderInventory
} from './inventory.service.js';

type ReservationState = {
  id: string;
  productId: string;
  quantity: number;
  status: 'ACTIVE' | 'RELEASED' | 'CONSUMED';
  releasedAt?: Date;
  consumedAt?: Date;
  releaseReason?: string;
};

function inventoryFixture(initialStatus: ReservationState['status'] = 'ACTIVE') {
  const product = {
    id: '11111111-1111-4111-8111-111111111111',
    status: 'AVAILABLE',
    moderationStatus: 'APPROVED',
    archivedAt: null,
    stockQuantity: 5,
    reservedQuantity: initialStatus === 'ACTIVE' ? 2 : 0,
    reservedAt: initialStatus === 'ACTIVE' ? new Date() : null,
    soldAt: null
  };
  const reservation: ReservationState = {
    id: '22222222-2222-4222-8222-222222222222',
    productId: product.id,
    quantity: 2,
    status: initialStatus
  };

  const tx = {
    $queryRaw: async () => [{ id: product.id }],
    orderItem: { count: async () => 1 },
    inventoryReservation: {
      findMany: async ({ where }: { where: { status: ReservationState['status'] } }) =>
        reservation.status === where.status
          ? [{ id: reservation.id, productId: reservation.productId, quantity: reservation.quantity }]
          : [],
      update: async ({ data }: { data: Partial<ReservationState> }) => {
        Object.assign(reservation, data);
        return reservation;
      }
    },
    product: {
      findUniqueOrThrow: async () => product,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(product, data);
        return product;
      }
    }
  } as unknown as Prisma.TransactionClient;

  return { tx, product, reservation };
}

describe('réservations atomiques de stock', () => {
  it('libère le stock sans modifier la quantité physique', async () => {
    const fixture = inventoryFixture();
    await releaseOrderReservations(fixture.tx, 'order-id', 'ORDER_CANCELLED');
    assert.equal(fixture.product.stockQuantity, 5);
    assert.equal(fixture.product.reservedQuantity, 0);
    assert.equal(fixture.product.status, 'AVAILABLE');
    assert.equal(fixture.reservation.status, 'RELEASED');
  });

  it('consomme une réservation une seule fois au paiement', async () => {
    const fixture = inventoryFixture();
    await consumeOrderReservations(fixture.tx, 'order-id');
    assert.equal(fixture.product.stockQuantity, 3);
    assert.equal(fixture.product.reservedQuantity, 0);
    assert.equal(fixture.reservation.status, 'CONSUMED');
    await assert.rejects(
      () => consumeOrderReservations(fixture.tx, 'order-id'),
      (error: unknown) =>
        Boolean(
          error &&
          typeof error === 'object' &&
          'errorCode' in error &&
          error.errorCode === 'INVENTORY_RESERVATION_EXPIRED'
        )
    );
  });

  it('remet le stock consommé en vente après remboursement complet', async () => {
    const fixture = inventoryFixture('CONSUMED');
    fixture.product.stockQuantity = 3;
    await restoreConsumedOrderInventory(fixture.tx, 'order-id', 'ORDER_FULLY_REFUNDED');
    assert.equal(fixture.product.stockQuantity, 5);
    assert.equal(fixture.product.status, 'AVAILABLE');
    assert.equal(fixture.reservation.status, 'RELEASED');
  });

  it('rejette un produit masqué, archivé ou sans quantité libre', () => {
    const base = {
      status: 'AVAILABLE' as const,
      moderationStatus: 'APPROVED',
      archivedAt: null,
      stockQuantity: 3,
      reservedQuantity: 2
    };
    assert.equal(isProductSellable(base), true);
    assert.equal(isProductSellable({ ...base, reservedQuantity: 3 }), false);
    assert.equal(isProductSellable({ ...base, moderationStatus: 'HIDDEN' }), false);
    assert.equal(isProductSellable({ ...base, archivedAt: new Date() }), false);
  });
});
