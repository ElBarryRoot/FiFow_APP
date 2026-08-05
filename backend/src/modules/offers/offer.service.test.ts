import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Offer, Prisma } from '@prisma/client';
import { ApiError } from '../../shared/errors/api-error.js';
import { offerService, type OfferServiceDependencies } from './offer.service.js';

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const BUYER_ID = '33333333-3333-4333-8333-333333333333';
const SELLER_ID = '44444444-4444-4444-8444-444444444444';
const OFFER_ID = '55555555-5555-4555-8555-555555555555';
const NOW = new Date('2026-08-05T12:00:00.000Z');

function activeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: OFFER_ID,
    productId: PRODUCT_ID,
    conversationId: CONVERSATION_ID,
    creatorId: BUYER_ID,
    recipientId: SELLER_ID,
    parentOfferId: null,
    amount: 800_000n,
    currency: 'GNF',
    handoverMode: 'HAND_TO_HAND',
    status: 'PENDING',
    message: null,
    expiresAt: new Date(NOW.getTime() + 86_400_000),
    respondedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  };
}

function dependencies(
  transaction: Prisma.TransactionClient,
  overrides: Partial<OfferServiceDependencies> = {}
): OfferServiceDependencies {
  return {
    findOfferConversation: async () => ({ conversationId: CONVERSATION_ID }),
    async runInTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
      return callback(transaction);
    },
    now: () => NOW,
    ...overrides
  };
}

function assertApiError(error: unknown, errorCode: string) {
  assert.ok(error instanceof ApiError);
  assert.equal(error.errorCode, errorCode);
  return true;
}

class TransactionMutex {
  private tail: Promise<void> = Promise.resolve();

  async acquire() {
    const previous = this.tail;
    let release: () => void = () => undefined;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    return release;
  }
}

describe('sécurité des offres', () => {
  it('interdit la création lorsqu’un participant a bloqué l’autre', async () => {
    let conversationLocked = false;
    let offerCreated = false;
    let notificationCreated = false;
    const transaction = {
      $queryRaw: async () => {
        conversationLocked = true;
        return [{ id: CONVERSATION_ID }];
      },
      conversation: {
        findFirst: async () => ({
          id: CONVERSATION_ID,
          productId: PRODUCT_ID,
          buyerId: BUYER_ID,
          sellerId: SELLER_ID,
          product: {
            price: 1_000_000n,
            isNegotiable: true,
            handoverModes: ['HAND_TO_HAND'],
            status: 'AVAILABLE'
          }
        })
      },
      userBlock: {
        findFirst: async () => {
          assert.equal(conversationLocked, true);
          return { id: 'block-id' };
        }
      },
      offer: {
        updateMany: async () => ({ count: 0 }),
        findFirst: async () => null,
        create: async () => {
          offerCreated = true;
          return activeOffer();
        }
      },
      notification: {
        create: async () => {
          notificationCreated = true;
          return { id: 'notification-id' };
        }
      }
    } as unknown as Prisma.TransactionClient;

    await assert.rejects(
      () =>
        offerService.create(
          BUYER_ID,
          CONVERSATION_ID,
          { amount: '800000', handoverMode: 'HAND_TO_HAND' },
          dependencies(transaction)
        ),
      (error: unknown) => assertApiError(error, 'USER_BLOCKED')
    );

    assert.equal(offerCreated, false);
    assert.equal(notificationCreated, false);
  });

  it('interdit aussi une contre-proposition lorsqu’un participant est bloqué', async () => {
    let offerUpdated = false;
    let counterOfferCreated = false;
    const transaction = {
      $queryRaw: async () => [{ id: CONVERSATION_ID }],
      offer: {
        findFirst: async () => ({
          ...activeOffer(),
          product: {
            price: 1_000_000n,
            status: 'AVAILABLE',
            handoverModes: ['HAND_TO_HAND']
          },
          conversation: {
            buyerId: BUYER_ID,
            sellerId: SELLER_ID,
            status: 'ACTIVE'
          }
        }),
        updateMany: async () => {
          offerUpdated = true;
          return { count: 1 };
        },
        create: async () => {
          counterOfferCreated = true;
          return activeOffer();
        }
      },
      userBlock: { findFirst: async () => ({ id: 'block-id' }) },
      notification: { create: async () => ({ id: 'notification-id' }) }
    } as unknown as Prisma.TransactionClient;

    await assert.rejects(
      () =>
        offerService.respond(
          SELLER_ID,
          OFFER_ID,
          {
            action: 'COUNTER',
            amount: '900000',
            handoverMode: 'HAND_TO_HAND'
          },
          dependencies(transaction)
        ),
      (error: unknown) => assertApiError(error, 'USER_BLOCKED')
    );

    assert.equal(offerUpdated, false);
    assert.equal(counterOfferCreated, false);
  });
});

describe('concurrence des offres', () => {
  it('sérialise deux créations et ne conserve qu’une offre en attente', async () => {
    const mutex = new TransactionMutex();
    const offers: Offer[] = [];
    let lockCount = 0;
    let notificationCount = 0;

    const concurrentDependencies: OfferServiceDependencies = {
      findOfferConversation: async () => ({ conversationId: CONVERSATION_ID }),
      now: () => NOW,
      async runInTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
        let releaseLock: (() => void) | undefined;
        let hasLock = false;
        const transaction = {
          $queryRaw: async () => {
            releaseLock = await mutex.acquire();
            hasLock = true;
            lockCount += 1;
            return [{ id: CONVERSATION_ID }];
          },
          conversation: {
            findFirst: async () => {
              assert.equal(hasLock, true, 'la conversation doit être verrouillée avant lecture');
              return {
                id: CONVERSATION_ID,
                productId: PRODUCT_ID,
                buyerId: BUYER_ID,
                sellerId: SELLER_ID,
                product: {
                  price: 1_000_000n,
                  isNegotiable: true,
                  handoverModes: ['HAND_TO_HAND'],
                  status: 'AVAILABLE'
                }
              };
            }
          },
          userBlock: { findFirst: async () => null },
          offer: {
            updateMany: async () => ({ count: 0 }),
            findFirst: async () => offers.find(({ status }) => status === 'PENDING') ?? null,
            create: async () => {
              const created = activeOffer({
                id: `55555555-5555-4555-8555-${String(offers.length + 1).padStart(12, '0')}`
              });
              offers.push(created);
              return created;
            }
          },
          notification: {
            create: async () => {
              notificationCount += 1;
              return { id: `notification-${notificationCount}` };
            }
          }
        } as unknown as Prisma.TransactionClient;

        try {
          return await callback(transaction);
        } finally {
          releaseLock?.();
        }
      }
    };

    const results = await Promise.allSettled([
      offerService.create(
        BUYER_ID,
        CONVERSATION_ID,
        { amount: '800000', handoverMode: 'HAND_TO_HAND' },
        concurrentDependencies
      ),
      offerService.create(
        BUYER_ID,
        CONVERSATION_ID,
        { amount: '850000', handoverMode: 'HAND_TO_HAND' },
        concurrentDependencies
      )
    ]);

    const fulfilled = results.filter(({ status }) => status === 'fulfilled');
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assertApiError(rejected[0]?.reason, 'PENDING_OFFER_EXISTS');
    assert.equal(offers.filter(({ status }) => status === 'PENDING').length, 1);
    assert.equal(notificationCount, 1);
    assert.equal(lockCount, 2);
  });

  it('rend une double réponse déterministe et atomique', async () => {
    const mutex = new TransactionMutex();
    let storedOffer = activeOffer();
    let notificationCount = 0;

    const concurrentDependencies: OfferServiceDependencies = {
      findOfferConversation: async () => ({ conversationId: CONVERSATION_ID }),
      now: () => NOW,
      async runInTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
        let releaseLock: (() => void) | undefined;
        let hasLock = false;
        const transaction = {
          $queryRaw: async () => {
            releaseLock = await mutex.acquire();
            hasLock = true;
            return [{ id: CONVERSATION_ID }];
          },
          offer: {
            findFirst: async () => {
              assert.equal(hasLock, true, 'la conversation doit être verrouillée avant l’offre');
              return {
                ...storedOffer,
                product: {
                  price: 1_000_000n,
                  status: 'AVAILABLE',
                  handoverModes: ['HAND_TO_HAND']
                },
                conversation: {
                  buyerId: BUYER_ID,
                  sellerId: SELLER_ID,
                  status: 'ACTIVE'
                }
              };
            },
            updateMany: async () => {
              if (storedOffer.status !== 'PENDING' || storedOffer.expiresAt <= NOW) {
                return { count: 0 };
              }
              storedOffer = activeOffer({ status: 'ACCEPTED', respondedAt: NOW });
              return { count: 1 };
            },
            findUniqueOrThrow: async () => storedOffer
          },
          userBlock: { findFirst: async () => null },
          notification: {
            create: async () => {
              notificationCount += 1;
              return { id: `notification-${notificationCount}` };
            }
          }
        } as unknown as Prisma.TransactionClient;

        try {
          return await callback(transaction);
        } finally {
          releaseLock?.();
        }
      }
    };

    const results = await Promise.allSettled([
      offerService.respond(SELLER_ID, OFFER_ID, { action: 'ACCEPT' }, concurrentDependencies),
      offerService.respond(SELLER_ID, OFFER_ID, { action: 'REJECT' }, concurrentDependencies)
    ]);

    const fulfilled = results.filter(({ status }) => status === 'fulfilled');
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assertApiError(rejected[0]?.reason, 'OFFER_NOT_ACTIVE');
    assert.equal(storedOffer.status, 'ACCEPTED');
    assert.equal(notificationCount, 1);
  });
});
