import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createProductSchema, updateProductStockSchema } from './product.schemas.js';

const baseProduct = {
  title: 'iPhone en excellent état',
  description: 'Produit propre, fonctionnel et prêt à être utilisé immédiatement.',
  price: '1500000',
  condition: 'GOOD' as const,
  isNegotiable: true,
  categoryId: '11111111-1111-4111-8111-111111111111',
  subcategoryId: '22222222-2222-4222-8222-222222222222',
  commune: 'Matoto',
  quartier: 'Sangoyah',
  handoverModes: ['HAND_TO_HAND' as const]
};

describe('validation du stock des annonces', () => {
  it('autorise une annonce don sans paiement', () => {
    const parsed = createProductSchema.parse({
      body: { ...baseProduct, price: '0', listingMode: 'DONATION', stockQuantity: 1 },
      params: {},
      query: {}
    });
    assert.equal(parsed.body.listingMode, 'DONATION');
    assert.equal(parsed.body.price, '0');
  });

  it('conserve une quantité fixe pour un article unique', () => {
    const parsed = createProductSchema.parse({
      body: { ...baseProduct, listingMode: 'SINGLE', stockQuantity: 1 },
      params: {},
      query: {}
    });
    assert.equal(parsed.body.stockQuantity, 1);
  });

  it('refuse plusieurs exemplaires sans le mode stock', () => {
    const result = createProductSchema.safeParse({
      body: { ...baseProduct, listingMode: 'LOT', stockQuantity: 2, lotItemCount: 3 },
      params: {},
      query: {}
    });
    assert.equal(result.success, false);
  });

  it('exige le nombre d’articles contenus dans un lot', () => {
    const missingCount = createProductSchema.safeParse({
      body: { ...baseProduct, listingMode: 'LOT', stockQuantity: 1 },
      params: {},
      query: {}
    });
    assert.equal(missingCount.success, false);

    const valid = createProductSchema.parse({
      body: { ...baseProduct, listingMode: 'LOT', stockQuantity: 1, lotItemCount: 3 },
      params: {},
      query: {}
    });
    assert.equal(valid.body.lotItemCount, 3);
  });

  it('refuse un nombre de lot sur un article hors lot', () => {
    const result = createProductSchema.safeParse({
      body: { ...baseProduct, listingMode: 'SINGLE', stockQuantity: 1, lotItemCount: 3 },
      params: {},
      query: {}
    });
    assert.equal(result.success, false);
  });

  it('autorise la rupture volontaire mais borne le réapprovisionnement', () => {
    const valid = updateProductStockSchema.parse({
      body: { stockQuantity: 0 },
      params: { productId: baseProduct.categoryId },
      query: {}
    });
    assert.equal(valid.body.stockQuantity, 0);
    assert.equal(
      updateProductStockSchema.safeParse({
        body: { stockQuantity: -1 },
        params: { productId: baseProduct.categoryId },
        query: {}
      }).success,
      false
    );
    assert.equal(
      updateProductStockSchema.safeParse({
        body: { stockQuantity: 10_001 },
        params: { productId: baseProduct.categoryId },
        query: {}
      }).success,
      false
    );
  });
});
