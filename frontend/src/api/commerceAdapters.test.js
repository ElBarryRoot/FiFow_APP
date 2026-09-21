import { describe, expect, it } from 'vitest'
import {
  toBoostPlanView,
  toBoostView,
  toOrderView,
  toQuoteView,
  toReviewView,
  toSellerVerificationView,
  toSupportTicketView,
} from './commerceAdapters.js'

describe('adaptateurs commerce', () => {
  it('normalise tous les montants d un devis', () => {
    expect(toQuoteView({
      id: 'quote-1',
      itemAmount: '500000',
      buyerProtectionFee: '30000',
      deliveryFee: '0',
      discountAmount: null,
      totalAmount: '530000',
      sellerNetAmount: '500000',
    })).toMatchObject({
      itemAmount: 500000,
      buyerProtectionFee: 30000,
      deliveryFee: 0,
      discountAmount: 0,
      totalAmount: 530000,
      sellerNetAmount: 500000,
    })
  })

  it('construit une commande exploitable depuis les snapshots immuables', () => {
    const view = toOrderView({
      id: 'order-1',
      productId: 'product-1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      status: 'AWAITING_PAYMENT',
      itemAmount: '700000',
      buyerProtectionFee: '40000',
      deliveryFee: '10000',
      discountAmount: '0',
      totalAmount: '750000',
      sellerNetAmount: '700000',
      productSnapshot: JSON.stringify({ id: 'product-1', title: 'Téléphone', slug: 'telephone-1', price: '700000' }),
      sellerSnapshot: { id: 'seller-1', fullName: 'Aïssatou Diallo' },
      buyerSnapshot: { id: 'buyer-1', fullName: 'Mamadou Barry' },
      statusHistory: [{ id: 'history-1', toStatus: 'AWAITING_PAYMENT' }],
      payments: [{ id: 'payment-1', amount: '750000', status: 'PROCESSING' }],
    }, 'buyer-1')

    expect(view).toMatchObject({
      role: 'buyer',
      statusLabel: 'Paiement attendu',
      product: {
        id: 'product-1',
        title: 'Téléphone',
        slug: 'telephone-1',
        price: 700000,
        image: '/assets/empty-product.svg',
      },
      sellerName: 'Aïssatou Diallo',
      buyerName: 'Mamadou Barry',
      totalAmount: 750000,
      payments: [{ amount: 750000, statusLabel: 'En cours' }],
      statusHistory: [{ status: 'AWAITING_PAYMENT', statusLabel: 'Paiement attendu' }],
    })
  })

  it('normalise les boosts et leurs formules', () => {
    expect(toBoostPlanView({ id: 'plan-1', price: '25000', durationHours: 168 })).toMatchObject({
      price: 25000,
      durationHours: 168,
      durationDays: 7,
    })
    expect(toBoostView({
      id: 'boost-1',
      status: 'ACTIVE',
      plan: { id: 'plan-1', price: '25000', durationHours: 24 },
      payment: { id: 'payment-1', amount: '25000', status: 'SUCCEEDED' },
    })).toMatchObject({
      statusLabel: 'Actif',
      plan: { price: 25000, durationDays: 1 },
      payment: { amount: 25000, statusLabel: 'Payé' },
    })
  })

  it('enrichit les avis, tickets et vérifications sans perdre le payload backend', () => {
    expect(toReviewView({
      id: 'review-1',
      rating: 5,
      comment: 'Très bonne transaction',
      author: { id: 'author-1', fullName: 'Fatou Camara' },
    })).toMatchObject({
      comment: 'Très bonne transaction',
      author: { name: 'Fatou Camara', avatar: '/assets/avatar-default.svg' },
    })

    expect(toSupportTicketView({
      id: 'ticket-1',
      status: 'WAITING_FOR_USER',
      subject: 'Paiement',
      messages: [{ id: 'message-1', message: 'Informations demandées' }],
    })).toMatchObject({
      subject: 'Paiement',
      statusLabel: 'Votre réponse est attendue',
      messages: [{ id: 'message-1', message: 'Informations demandées' }],
    })

    expect(toSellerVerificationView({
      id: 'verification-1',
      status: 'PENDING',
      documentCount: '2',
    })).toMatchObject({
      statusLabel: 'En vérification',
      documentCount: 2,
    })
  })
})
