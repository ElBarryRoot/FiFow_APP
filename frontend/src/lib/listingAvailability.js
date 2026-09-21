function positiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function availableInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : null
}

function plural(value, singular, pluralForm = `${singular}s`) {
  return value === 1 ? singular : pluralForm
}

export function listingAvailabilityLabel(product) {
  if (product?.listingMode === 'DONATION') return 'Don gratuit'
  if (product?.listingMode === 'LOT') {
    const count = positiveInteger(product.lotItemCount)
    return count ? `Lot de ${count} ${plural(count, 'article')}` : 'Lot d’articles'
  }

  if (product?.listingMode === 'STOCK') {
    const count = availableInteger(product.availableQuantity ?? product.stockQuantity)
    if (count == null) return 'Article en stock'
    if (count === 0) return 'Rupture de stock'
    return `${count} ${plural(count, 'exemplaire')} ${plural(count, 'disponible')}`
  }

  return 'Pièce unique'
}

export function listingAvailabilityDescription(product) {
  if (product?.listingMode === 'DONATION') return 'Contactez le vendeur pour convenir de la remise'
  if (product?.listingMode === 'LOT') return 'Tous les articles sont vendus ensemble'
  if (product?.listingMode === 'STOCK') return 'Choisissez la quantité souhaitée'
  return 'Une seule pièce est disponible'
}

export function orderedItemLabel(product, quantity = 1) {
  if (product?.listingMode === 'LOT') return listingAvailabilityLabel(product)
  if (product?.listingMode === 'STOCK') {
    const count = positiveInteger(quantity) || 1
    return `${count} ${plural(count, 'exemplaire')} ${plural(count, 'commandé')}`
  }
  return '1 article unique'
}
