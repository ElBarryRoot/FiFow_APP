import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { quoteSchema } from './order.schemas.js';

const productA = '11111111-1111-4111-8111-111111111111';
const productB = '22222222-2222-4222-8222-222222222222';
const offerId = '33333333-3333-4333-8333-333333333333';
const handover = {
  handoverMode: 'HAND_TO_HAND' as const,
  handoverDetails: { meetingLocation: 'Kaloum, Conakry', phone: '+224620000000' }
};

function payload(body: Record<string, unknown>) {
  return { body: { ...handover, ...body }, params: {}, query: {} };
}

describe('validation des devis multi-articles', () => {
  it('conserve le parcours historique pour un achat direct', () => {
    const parsed = quoteSchema.parse(payload({ productId: productA, offerId }));
    assert.equal(parsed.body.productId, productA);
    assert.equal(parsed.body.offerId, offerId);
  });

  it('accepte plusieurs lignes et leurs quantités', () => {
    const parsed = quoteSchema.parse(
      payload({
        items: [
          { productId: productA, quantity: 2 },
          { productId: productB, quantity: 1 }
        ]
      })
    );
    assert.equal(parsed.body.items?.length, 2);
    assert.equal(parsed.body.items?.[0]?.quantity, 2);
  });

  it('refuse de mélanger achat direct et lignes de panier', () => {
    const result = quoteSchema.safeParse(
      payload({
        productId: productA,
        items: [{ productId: productB, quantity: 1 }]
      })
    );
    assert.equal(result.success, false);
  });

  it('refuse les doublons et une offre négociée sur un panier', () => {
    const duplicate = quoteSchema.safeParse(
      payload({
        items: [
          { productId: productA, quantity: 1 },
          { productId: productA, quantity: 2 }
        ]
      })
    );
    const negotiatedCart = quoteSchema.safeParse(
      payload({
        offerId,
        items: [{ productId: productA, quantity: 1 }]
      })
    );
    assert.equal(duplicate.success, false);
    assert.equal(negotiatedCart.success, false);
  });
});
