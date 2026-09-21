import { describe, expect, it } from 'vitest'
import {
  listingAvailabilityDescription,
  listingAvailabilityLabel,
  orderedItemLabel,
} from './listingAvailability.js'

describe('présentation du type de vente', () => {
  it('indique précisément le contenu d’un lot', () => {
    const product = { listingMode: 'LOT', lotItemCount: 3 }
    expect(listingAvailabilityLabel(product)).toBe('Lot de 3 articles')
    expect(listingAvailabilityDescription(product)).toBe('Tous les articles sont vendus ensemble')
  })

  it('affiche uniquement le stock réellement disponible', () => {
    expect(listingAvailabilityLabel({
      listingMode: 'STOCK',
      stockQuantity: 8,
      availableQuantity: 5,
    })).toBe('5 exemplaires disponibles')
    expect(listingAvailabilityLabel({ listingMode: 'STOCK', availableQuantity: 0 })).toBe('Rupture de stock')
  })

  it('décrit la quantité figée dans une commande', () => {
    expect(orderedItemLabel({ listingMode: 'STOCK' }, 2)).toBe('2 exemplaires commandés')
    expect(orderedItemLabel({ listingMode: 'LOT', lotItemCount: 4 }, 1)).toBe('Lot de 4 articles')
  })
})
