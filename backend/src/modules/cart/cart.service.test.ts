import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { maximumCartQuantity } from './cart.service.js';

describe('quantités du panier', () => {
  it('limite les articles uniques et les lots à une unité', () => {
    assert.equal(maximumCartQuantity('SINGLE', 8), 1);
    assert.equal(maximumCartQuantity('LOT', 4), 1);
  });

  it('autorise le stock disponible sans dépasser la limite anti-abus', () => {
    assert.equal(maximumCartQuantity('STOCK', 8), 8);
    assert.equal(maximumCartQuantity('STOCK', 150), 99);
    assert.equal(maximumCartQuantity('STOCK', 0), 0);
  });
});
