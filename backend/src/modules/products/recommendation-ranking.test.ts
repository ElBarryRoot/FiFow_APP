import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rankSimilarProducts } from './recommendation-ranking.js';

const source = {
  sellerId: 'seller-a',
  subcategoryId: 'phones',
  commune: 'Matoto',
  quartier: 'Sangoyah',
  price: 1_000_000n
};

describe('classement des produits similaires', () => {
  it('privilégie la sous-catégorie, la zone et un prix proche', () => {
    const rows = rankSimilarProducts(
      source,
      [
        {
          id: 'far',
          sellerId: 'seller-b',
          subcategoryId: 'phones',
          commune: 'Dixinn',
          quartier: 'Minière',
          price: 4_000_000n,
          publishedAt: new Date('2026-08-15')
        },
        {
          id: 'close',
          sellerId: 'seller-c',
          subcategoryId: 'phones',
          commune: 'matoto',
          quartier: 'sangoyah',
          price: 1_050_000n,
          publishedAt: new Date('2026-08-14')
        },
        {
          id: 'other',
          sellerId: 'seller-d',
          subcategoryId: 'tablets',
          commune: 'Matoto',
          quartier: 'Sangoyah',
          price: 1_000_000n,
          publishedAt: new Date('2026-08-15')
        }
      ],
      3
    );
    assert.deepEqual(
      rows.map((row) => row.id),
      ['close', 'far', 'other']
    );
  });

  it('écarte le même vendeur tant que les autres suffisent puis l’utilise en secours', () => {
    const rows = rankSimilarProducts(
      source,
      [
        {
          id: 'same',
          sellerId: 'seller-a',
          subcategoryId: 'phones',
          commune: 'Matoto',
          quartier: 'Sangoyah',
          price: 1_000_000n,
          publishedAt: null
        },
        {
          id: 'external',
          sellerId: 'seller-b',
          subcategoryId: 'tablets',
          commune: 'Dixinn',
          quartier: 'Minière',
          price: 3_000_000n,
          publishedAt: null
        }
      ],
      2
    );
    assert.deepEqual(
      rows.map((row) => row.id),
      ['external', 'same']
    );
  });
});
