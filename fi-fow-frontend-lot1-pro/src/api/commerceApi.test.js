import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http.js', () => ({
  apiRequest: vi.fn(),
  buildSearchParams: vi.fn((values) => {
    const query = new URLSearchParams()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
    })
    const serialized = query.toString()
    return serialized ? `?${serialized}` : ''
  }),
}))

import { boostsApi } from './boosts.js'
import { apiRequest } from './http.js'
import { ordersApi } from './orders.js'
import { paymentsApi } from './payments.js'
import { reviewsApi } from './reviews.js'
import { sellerVerificationApi } from './sellerVerification.js'
import { supportApi } from './support.js'

describe('contrats API commerce', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('transmet les détails de remise et une clé d idempotence à la création de commande', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'order-1', status: 'AWAITING_SELLER_CONFIRMATION' } })

    await ordersApi.create({
      quoteId: 'quote-1',
      handoverDetails: { commune: 'Ratoma', quartier: 'Kipé' },
    }, { idempotencyKey: 'order-idempotency-key-1234' })

    expect(apiRequest).toHaveBeenCalledWith('/orders', expect.objectContaining({
      method: 'POST',
      body: {
        quoteId: 'quote-1',
        handoverDetails: { commune: 'Ratoma', quartier: 'Kipé' },
      },
      headers: { 'Idempotency-Key': 'order-idempotency-key-1234' },
      auth: 'required',
    }))
  })

  it('envoie les détails de remise lors des transitions concernées', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'order-1', status: 'IN_DELIVERY' } })

    await ordersApi.ship('order/1', { trackingReference: 'FF-LIV-001' })

    expect(apiRequest).toHaveBeenCalledWith('/orders/order%2F1/ship', {
      method: 'PATCH',
      body: { handoverDetails: { trackingReference: 'FF-LIV-001' } },
      auth: 'required',
    })
  })

  it('initie un paiement sans envoyer la clé d idempotence dans le JSON', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'payment-1', amount: '530000', status: 'PROCESSING' } })

    const payment = await paymentsApi.initiate({
      orderId: 'order-1',
      phone: '+224620000000',
      idempotencyKey: 'payment-idempotency-1234',
    })

    expect(payment.amount).toBe(530000)
    expect(apiRequest).toHaveBeenCalledWith('/payments/initiate', expect.objectContaining({
      body: { orderId: 'order-1', phone: '+224620000000' },
      headers: { 'Idempotency-Key': 'payment-idempotency-1234' },
    }))
  })

  it('crée un boost avec l UUID produit et une clé d idempotence hors du JSON', async () => {
    apiRequest.mockResolvedValue({
      data: {
        boost: { id: 'boost-1', status: 'PENDING_PAYMENT' },
        payment: { id: 'payment-1', amount: '25000', status: 'PROCESSING' },
      },
    })

    const result = await boostsApi.create(
      'product/1',
      { planId: 'plan-1', phone: '+224620000000' },
      { idempotencyKey: 'boost-idempotency-key-1234' },
    )

    expect(result.payment.amount).toBe(25000)
    expect(apiRequest).toHaveBeenCalledWith('/boosts/products/product%2F1', {
      method: 'POST',
      body: { planId: 'plan-1', phone: '+224620000000' },
      headers: { 'Idempotency-Key': 'boost-idempotency-key-1234' },
      auth: 'required',
    })
  })

  it('envoie explicitement le résultat demandé au bac à sable de paiement', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'payment-1', amount: '25000', status: 'SUCCEEDED' } })

    await expect(paymentsApi.mockConfirm('payment/1', { outcome: 'SUCCEEDED' })).resolves.toMatchObject({
      id: 'payment-1',
      status: 'SUCCEEDED',
    })
    expect(apiRequest).toHaveBeenCalledWith('/payments/payment%2F1/mock-confirm', {
      method: 'POST',
      body: { outcome: 'SUCCEEDED' },
      auth: 'required',
    })
  })

  it('normalise la pagination des boosts et du support', async () => {
    apiRequest
      .mockResolvedValueOnce({ data: [{ id: 'boost-1', status: 'ACTIVE' }], meta: { nextCursor: 'boost-2' } })
      .mockResolvedValueOnce({ data: [{ id: 'ticket-1', status: 'OPEN' }], meta: { nextCursor: null } })

    await expect(boostsApi.mine({ cursor: 'boost-0', limit: 10 })).resolves.toMatchObject({
      items: [{ id: 'boost-1', statusLabel: 'Actif' }],
      nextCursor: 'boost-2',
    })
    await expect(supportApi.list({ status: 'OPEN', limit: 5 })).resolves.toMatchObject({
      items: [{ id: 'ticket-1', statusLabel: 'Ouvert' }],
      nextCursor: null,
    })
    expect(apiRequest.mock.calls[0][0]).toBe('/boosts/mine?cursor=boost-0&limit=10')
    expect(apiRequest.mock.calls[1][0]).toBe('/support/tickets?limit=5&status=OPEN')
  })

  it('construit le multipart de vérification vendeur avec plusieurs documents', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'verification-1', status: 'PENDING', documentCount: 2 } })
    const front = new File(['recto'], 'recto.png', { type: 'image/png' })
    const back = new File(['verso'], 'verso.png', { type: 'image/png' })

    await sellerVerificationApi.request({ documents: [front, back], note: '  Carte nationale  ' })

    const [, options] = apiRequest.mock.calls[0]
    expect(apiRequest.mock.calls[0][0]).toBe('/seller-verification/request')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.getAll('documents')).toEqual([front, back])
    expect(options.body.get('note')).toBe('Carte nationale')
    expect(options.timeoutMs).toBe(60_000)
  })

  it('respecte les contrats support et avis', async () => {
    apiRequest
      .mockResolvedValueOnce({ data: { id: 'ticket-1', status: 'OPEN' } })
      .mockResolvedValueOnce({ data: { id: 'review-1', rating: 5, author: null } })
      .mockResolvedValueOnce({ data: null })

    await supportApi.create({ category: 'PAYMENT', subject: 'Paiement bloqué', message: 'Besoin d’aide', reference: 'FF-001' })
    await reviewsApi.create({ orderId: 'order-1', rating: 5, comment: 'Très bien' })
    await reviewsApi.reply('review/1', 'Merci beaucoup')

    expect(apiRequest.mock.calls[0]).toEqual(['/support/tickets', expect.objectContaining({ method: 'POST' })])
    expect(apiRequest.mock.calls[1]).toEqual(['/reviews', expect.objectContaining({ method: 'POST' })])
    expect(apiRequest.mock.calls[2]).toEqual(['/reviews/review%2F1/reply', expect.objectContaining({
      method: 'PATCH',
      body: { reply: 'Merci beaucoup' },
    })])
  })
})
