import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultAvatar,
  formatRelativeDate,
  toProductView,
  toUserView,
} from './adapters.js'

describe('adaptateurs API', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-05T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('transforme un produit backend complet sans perdre ses donnees metier', () => {
    const product = {
      id: 'product-1',
      slug: 'iphone-15-product-1',
      title: 'iPhone 15',
      price: '8300000.00',
      condition: 'LIKE_NEW',
      status: 'AVAILABLE',
      isNegotiable: true,
      isBoosted: true,
      commune: 'Ratoma',
      quartier: 'Kipé',
      publishedAt: '2026-08-05T11:55:00.000Z',
      viewsCount: 125,
      favoritesCount: 7,
      conversationsCount: 4,
      mainImage: { id: 'image-2', url: '/uploads/main.webp' },
      images: [
        { id: 'image-1', url: '/uploads/one.webp' },
        { id: 'image-2', url: '/uploads/main.webp' },
        { id: 'image-broken', url: '' },
      ],
      category: { id: 'phones', name: 'Telephones' },
      seller: {
        id: 'seller-1',
        fullName: 'Aissatou Diallo',
        avatarUrl: '/uploads/aissatou.webp',
        averageRating: '4.75',
        totalReviews: 18,
      },
    }

    expect(toProductView(product)).toMatchObject({
      id: 'product-1',
      slug: 'iphone-15-product-1',
      price: 8300000,
      image: '/uploads/main.webp',
      gallery: ['/uploads/one.webp', '/uploads/main.webp'],
      location: 'Kipé, Ratoma',
      conditionCode: 'LIKE_NEW',
      condition: 'Très bon état',
      negotiable: true,
      boosted: true,
      views: 125,
      favorites: 7,
      messages: 4,
      statusLabel: 'En ligne',
      categoryLabel: 'Telephones',
      seller: {
        id: 'seller-1',
        name: 'Aissatou Diallo',
        avatar: '/uploads/aissatou.webp',
        rating: 4.75,
        reviews: 18,
      },
    })
    expect(toProductView(product).time).toMatch(/5.*minute/i)
  })

  it('applique les replis sans transformer les valeurs nulles en donnees trompeuses', () => {
    const view = toProductView({
      id: 'draft-1',
      title: 'Produit sans image',
      price: null,
      condition: 'UNKNOWN',
      status: 'DRAFT',
      images: [],
      seller: { fullName: 'Mamadou Barry' },
    })

    expect(view.slug).toBe('draft-1')
    expect(view.price).toBe(0)
    expect(view.image).toBe('/assets/empty-product.svg')
    expect(view.gallery).toEqual(['/assets/empty-product.svg'])
    expect(view.location).toBe('')
    expect(view.condition).toBe('UNKNOWN')
    expect(view.statusLabel).toBe('Brouillon')
    expect(view.seller.avatar).toBe(defaultAvatar)
    expect(view.seller.rating).toBe(0)
    expect(view.seller.reviews).toBe(0)
    expect(toProductView(null)).toBeNull()
  })

  it('transforme un utilisateur et calcule un nom court stable', () => {
    expect(toUserView({
      id: 'user-1',
      fullName: '  Fatoumata Camara  ',
      commune: 'Matam',
      quartier: 'Bonfi',
      averageRating: '4.2',
      sellerVerificationStatus: 'APPROVED',
    })).toMatchObject({
      id: 'user-1',
      name: '  Fatoumata Camara  ',
      shortName: 'Fatoumata',
      avatar: defaultAvatar,
      location: 'Bonfi, Matam',
      neighborhood: 'Bonfi',
      rating: 4.2,
      verified: true,
    })

    expect(toUserView({ fullName: '', verifiedSeller: true }).shortName).toBe('Compte')
    expect(toUserView(null)).toBeNull()
  })

  it('formate les dates proches et rejette les valeurs invalides', () => {
    expect(formatRelativeDate('2026-08-05T12:00:00.000Z')).toBe('maintenant')
    expect(formatRelativeDate('date-invalide')).toBe('')
    expect(formatRelativeDate(null)).toBe('')
  })
})
