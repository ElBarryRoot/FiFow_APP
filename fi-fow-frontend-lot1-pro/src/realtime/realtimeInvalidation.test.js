import { describe, expect, it } from 'vitest'
import { initialRealtimeQueryKeys, queryKeysForRealtimeEvent } from './realtimeInvalidation.js'

describe('invalidation temps reel', () => {
  it('rafraichit uniquement la conversation concernee pour un message', () => {
    const keys = queryKeysForRealtimeEvent('message:new', {
      id: 'message-1',
      conversationId: 'conversation-1',
    })

    expect(keys).toEqual(expect.arrayContaining([
      ['conversations', 'list'],
      ['conversations', 'detail', 'conversation-1'],
      ['conversations', 'messages', 'conversation-1'],
    ]))
    expect(keys).not.toContainEqual(['conversations'])
  })

  it('synchronise une notification de paiement avec les ecrans utiles', () => {
    const keys = queryKeysForRealtimeEvent('notification:new', {
      data: { paymentId: 'payment-1', orderId: 'order-1' },
    })

    expect(keys).toEqual(expect.arrayContaining([
      ['notifications', 'list'],
      ['notifications', 'pages'],
      ['payments'],
      ['payments', 'detail', 'payment-1'],
      ['orders'],
      ['orders', 'detail', 'order-1'],
      ['admin', 'payments'],
      ['admin', 'orders'],
      ['admin', 'payouts'],
      ['admin', 'dashboard'],
    ]))
  })

  it('rafraichit les notifications lors d une mise a jour financiere', () => {
    const keys = queryKeysForRealtimeEvent('payout:updated', {
      payoutId: 'payout-1',
      orderId: 'order-1',
      status: 'SUCCEEDED',
    })

    expect(keys).toEqual(expect.arrayContaining([
      ['notifications', 'list'],
      ['notifications', 'pages'],
      ['orders'],
      ['orders', 'detail', 'order-1'],
      ['admin', 'payouts'],
    ]))
  })

  it('comprend le contrat admin extensible sans appliquer de donnees non verifiees', () => {
    const keys = queryKeysForRealtimeEvent('admin:resource-updated', {
      resource: 'BOOST_PLAN',
      id: 'plan-1',
    })

    expect(keys).toEqual([['admin', 'boost-plans']])
  })

  it('ne rafraichit que les compteurs de base lors de la reconnexion', () => {
    expect(initialRealtimeQueryKeys()).toEqual([
      ['conversations', 'list'],
      ['notifications', 'list'],
      ['notifications', 'pages'],
    ])
  })
})
