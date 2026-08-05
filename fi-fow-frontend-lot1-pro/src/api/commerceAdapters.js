import { defaultAvatar, formatRelativeDate } from './adapters.js'

const defaultProductImage = '/assets/empty-product.svg'

const orderStatusLabels = {
  AWAITING_SELLER_CONFIRMATION: 'Confirmation du vendeur',
  AWAITING_PAYMENT: 'Paiement attendu',
  PAID: 'Payée',
  RESERVED: 'Réservée',
  PREPARING: 'En préparation',
  READY_FOR_HANDOVER: 'Prête pour la remise',
  IN_DELIVERY: 'En livraison',
  RECEIVED: 'Reçue',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige en cours',
  REFUNDED: 'Remboursée',
}

const paymentStatusLabels = {
  CREATED: 'Créé',
  PROCESSING: 'En cours',
  SUCCEEDED: 'Payé',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
  REFUND_PENDING: 'Remboursement en cours',
  REFUNDED: 'Remboursé',
}

const boostStatusLabels = {
  PENDING_PAYMENT: 'Paiement attendu',
  ACTIVE: 'Actif',
  EXPIRED: 'Terminé',
  CANCELLED: 'Annulé',
  REJECTED: 'Refusé',
  REFUNDED: 'Remboursé',
}

const ticketStatusLabels = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_FOR_USER: 'Votre réponse est attendue',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
}

const verificationStatusLabels = {
  NOT_REQUESTED: 'Non demandée',
  PENDING: 'En vérification',
  APPROVED: 'Vendeur vérifié',
  REJECTED: 'À compléter',
  REMOVED: 'Vérification retirée',
}

function toNumber(value) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function asObject(value) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function toProductSnapshot(order) {
  const snapshot = asObject(order.productSnapshot)
  const product = asObject(order.product)
  const source = { ...snapshot, ...product }
  const mainImage = asObject(source.mainImage)

  return {
    ...source,
    id: source.id || order.productId,
    slug: source.slug || source.id || order.productId,
    title: source.title || 'Produit Fi Fow',
    image: source.image || source.imageUrl || source.mainImageUrl || mainImage.url || defaultProductImage,
    price: toNumber(source.price ?? order.itemAmount),
  }
}

export function createIdempotencyKey(scope = 'request') {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Ce navigateur ne permet pas de sécuriser cette opération. Mettez-le à jour puis réessayez.')
  }
  return `fifow:${scope}:${globalThis.crypto.randomUUID()}`
}

export function toQuoteView(quote) {
  if (!quote) return null
  return {
    ...quote,
    itemAmount: toNumber(quote.itemAmount),
    buyerProtectionFee: toNumber(quote.buyerProtectionFee),
    deliveryFee: toNumber(quote.deliveryFee),
    discountAmount: toNumber(quote.discountAmount),
    totalAmount: toNumber(quote.totalAmount),
    sellerNetAmount: toNumber(quote.sellerNetAmount),
  }
}

export function toPaymentView(payment) {
  if (!payment) return null
  return {
    ...payment,
    amount: toNumber(payment.amount),
    refundedAmount: toNumber(payment.refundedAmount),
    statusLabel: paymentStatusLabels[payment.status] || payment.status,
    time: formatRelativeDate(payment.updatedAt || payment.createdAt),
  }
}

export function toOrderView(order, currentUserId) {
  if (!order) return null
  const product = toProductSnapshot(order)
  const seller = { ...asObject(order.sellerSnapshot), ...asObject(order.seller) }
  const buyer = { ...asObject(order.buyerSnapshot), ...asObject(order.buyer) }
  const counterpart = asObject(order.counterpart)
  const sellerId = order.sellerId || seller.id
  const buyerId = order.buyerId || buyer.id
  const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : []

  return {
    ...order,
    itemAmount: toNumber(order.itemAmount),
    buyerProtectionFee: toNumber(order.buyerProtectionFee),
    deliveryFee: toNumber(order.deliveryFee),
    discountAmount: toNumber(order.discountAmount),
    totalAmount: toNumber(order.totalAmount),
    sellerNetAmount: toNumber(order.sellerNetAmount),
    product,
    sellerId,
    buyerId,
    productTitle: product.title,
    image: product.image,
    seller,
    buyer,
    counterpart,
    sellerName: seller.fullName || (buyerId === currentUserId ? counterpart.fullName : '') || 'Vendeur Fi Fow',
    buyerName: buyer.fullName || (sellerId === currentUserId ? counterpart.fullName : '') || 'Acheteur Fi Fow',
    role: currentUserId
      ? (sellerId === currentUserId ? 'seller' : buyerId === currentUserId ? 'buyer' : String(order.role || '').toLowerCase() || null)
      : String(order.role || '').toLowerCase() || null,
    statusLabel: orderStatusLabels[order.status] || order.status,
    time: formatRelativeDate(order.updatedAt || order.createdAt),
    statusHistory: statusHistory.map((entry) => ({
      ...entry,
      status: entry.toStatus,
      statusLabel: orderStatusLabels[entry.toStatus] || entry.toStatus,
    })),
    delivery: order.delivery || null,
    payment: toPaymentView(order.payment),
    payments: Array.isArray(order.payments) ? order.payments.map(toPaymentView) : [],
  }
}

export function toBoostPlanView(plan) {
  if (!plan) return null
  const durationHours = toNumber(plan.durationHours)
  return {
    ...plan,
    price: toNumber(plan.price),
    durationHours,
    durationDays: durationHours / 24,
  }
}

export function toBoostView(boost) {
  if (!boost) return null
  const plan = toBoostPlanView(boost.plan)
  return {
    ...boost,
    plan,
    product: boost.product || null,
    payment: toPaymentView(boost.payment),
    statusLabel: boostStatusLabels[boost.status] || boost.status,
    time: formatRelativeDate(boost.updatedAt || boost.createdAt),
  }
}

export function toReviewView(review) {
  if (!review) return null
  const author = review.author || {}
  return {
    ...review,
    rating: toNumber(review.rating),
    communicationRating: review.communicationRating == null ? null : toNumber(review.communicationRating),
    productAccuracyRating: review.productAccuracyRating == null ? null : toNumber(review.productAccuracyRating),
    behaviorRating: review.behaviorRating == null ? null : toNumber(review.behaviorRating),
    author: {
      ...author,
      name: author.fullName || 'Utilisateur Fi Fow',
      avatar: author.avatarUrl || defaultAvatar,
    },
    time: formatRelativeDate(review.createdAt),
  }
}

export function toSupportTicketView(ticket) {
  if (!ticket) return null
  const messages = Array.isArray(ticket.messages) ? ticket.messages : []
  return {
    ...ticket,
    statusLabel: ticketStatusLabels[ticket.status] || ticket.status,
    time: formatRelativeDate(ticket.updatedAt || ticket.createdAt),
    messages: messages.map((message) => ({
      ...message,
      time: formatRelativeDate(message.createdAt),
    })),
  }
}

export function toSellerVerificationView(verification) {
  if (!verification) return null
  return {
    ...verification,
    documentCount: toNumber(verification.documentCount),
    statusLabel: verificationStatusLabels[verification.status] || verification.status,
    time: formatRelativeDate(verification.reviewedAt || verification.requestedAt),
  }
}
