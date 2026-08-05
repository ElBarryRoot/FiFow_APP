const conditionLabels = {
  NEW: 'Neuf',
  LIKE_NEW: 'Très bon état',
  GOOD: 'Bon état',
  FAIR: 'État correct',
  TO_REPAIR: 'À réparer',
}

const statusLabels = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En vérification',
  AVAILABLE: 'En ligne',
  RESERVED: 'Réservée',
  SOLD: 'Vendue',
  REJECTED: 'À corriger',
  HIDDEN: 'Masquée',
  ARCHIVED: 'Archivée',
}

const defaultProductImage = '/assets/empty-product.svg'
export const defaultAvatar = '/assets/avatar-default.svg'

export function formatRelativeDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return formatter.format(days, 'day')
  return new Intl.DateTimeFormat('fr-GN', { dateStyle: 'medium' }).format(date)
}

export function toProductView(product) {
  if (!product) return null
  const images = product.images?.map((image) => image.url).filter(Boolean) || []
  const mainImage = product.mainImage?.url || images[0] || defaultProductImage
  return {
    ...product,
    id: product.id,
    slug: product.slug || product.id,
    price: Number(product.price || 0),
    image: mainImage,
    gallery: images.length ? images : [mainImage],
    location: [product.quartier, product.commune].filter(Boolean).join(', '),
    conditionCode: product.condition,
    condition: conditionLabels[product.condition] || product.condition,
    negotiable: Boolean(product.isNegotiable),
    boosted: Boolean(product.isBoosted),
    time: formatRelativeDate(product.publishedAt || product.createdAt),
    views: product.viewsCount || 0,
    favorites: product.favoritesCount || 0,
    messages: product.conversationsCount || 0,
    statusLabel: statusLabels[product.status] || product.status,
    category: product.category || null,
    categoryLabel: product.category?.name || '',
    seller: product.seller ? {
      ...product.seller,
      name: product.seller.fullName,
      avatar: product.seller.avatarUrl || defaultAvatar,
      rating: Number(product.seller.averageRating || 0),
      reviews: product.seller.totalReviews || 0,
    } : null,
  }
}

export function toUserView(user) {
  if (!user) return null
  return {
    ...user,
    name: user.fullName,
    shortName: user.fullName?.trim().split(/\s+/)[0] || 'Compte',
    avatar: user.avatarUrl || defaultAvatar,
    location: [user.quartier, user.commune].filter(Boolean).join(', '),
    neighborhood: user.quartier,
    rating: Number(user.averageRating || 0),
    verified: user.sellerVerificationStatus === 'APPROVED' || user.verifiedSeller,
  }
}
