import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  emitOrderUpdated,
  emitPaymentUpdated,
  setRealtimeServer
} from './realtime.js';

type Call = { room: string; event: string; payload: unknown };

function captureRealtimeCalls() {
  const calls: Call[] = [];
  setRealtimeServer({
    to(room) {
      return {
        emit(event, payload) {
          calls.push({ room, event, payload });
        }
      };
    }
  });
  return calls;
}

describe('evenements temps reel securises', () => {
  it('notifie les participants et le personnel sans doubler un meme compte', () => {
    const calls = captureRealtimeCalls();
    const updatedAt = new Date('2026-08-10T12:00:00.000Z');

    emitOrderUpdated({
      id: 'order-1',
      status: 'PAID',
      buyerId: 'user-1',
      sellerId: 'user-1',
      updatedAt
    });

    assert.deepEqual(calls, [
      {
        room: 'user:user-1',
        event: 'order:updated',
        payload: {
          orderId: 'order-1',
          status: 'PAID',
          updatedAt: '2026-08-10T12:00:00.000Z'
        }
      },
      {
        room: 'role:staff',
        event: 'admin:resource-updated',
        payload: {
          resource: 'ORDER',
          id: 'order-1',
          status: 'PAID',
          updatedAt: '2026-08-10T12:00:00.000Z'
        }
      }
    ]);
  });

  it('expose uniquement le statut et les identifiants necessaires pour un paiement', () => {
    const calls = captureRealtimeCalls();

    emitPaymentUpdated({
      id: 'payment-1',
      status: 'SUCCEEDED',
      userId: 'buyer-1',
      orderId: 'order-1',
      updatedAt: '2026-08-10T12:01:00.000Z'
    });

    assert.deepEqual(calls[0], {
      room: 'user:buyer-1',
      event: 'payment:updated',
      payload: {
        paymentId: 'payment-1',
        orderId: 'order-1',
        status: 'SUCCEEDED',
        updatedAt: '2026-08-10T12:01:00.000Z'
      }
    });
    assert.equal(JSON.stringify(calls[0]).includes('buyerId'), false);
    assert.equal(JSON.stringify(calls[0]).includes('phone'), false);
    assert.equal(JSON.stringify(calls[0]).includes('amount'), false);
  });
});
