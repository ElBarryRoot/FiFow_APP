import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrder } from './order-transitions.js';

test('la matrice autorise uniquement le parcours métier officiel', () => {
  assert.equal(canTransitionOrder('AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT'), true);
  assert.equal(canTransitionOrder('AWAITING_PAYMENT', 'PAID'), true);
  assert.equal(canTransitionOrder('PAID', 'PREPARING'), true);
  assert.equal(canTransitionOrder('PREPARING', 'READY_FOR_HANDOVER'), true);
  assert.equal(canTransitionOrder('READY_FOR_HANDOVER', 'IN_DELIVERY'), true);
  assert.equal(canTransitionOrder('IN_DELIVERY', 'COMPLETED'), true);
});

test('la matrice refuse les transitions qui contournent une étape', () => {
  assert.equal(canTransitionOrder('AWAITING_SELLER_CONFIRMATION', 'PAID'), false);
  assert.equal(canTransitionOrder('PAID', 'COMPLETED'), false);
  assert.equal(canTransitionOrder('COMPLETED', 'PREPARING'), false);
  assert.equal(canTransitionOrder('CANCELLED', 'PAID'), false);
});
