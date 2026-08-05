import { defaultAvatar } from '../api/adapters.js'

export const handoverLabels = {
  HAND_TO_HAND: 'Remise en main propre',
  HOME_DELIVERY: 'Livraison à domicile',
  PICKUP_POINT: 'Point de retrait',
}

export const orderStatusConfig = {
  AWAITING_SELLER_CONFIRMATION: {
    label: 'Confirmation du vendeur attendue',
    shortLabel: 'À confirmer',
    description: 'Le vendeur doit confirmer la disponibilité avant le paiement.',
    tone: 'warning',
  },
  AWAITING_PAYMENT: {
    label: 'Paiement attendu',
    shortLabel: 'À payer',
    description: 'La commande est confirmée. Le paiement sécurisé peut être effectué.',
    tone: 'primary',
  },
  PAID: {
    label: 'Paiement sécurisé',
    shortLabel: 'Payée',
    description: 'Le paiement est conservé par Fi Fow pendant la transaction.',
    tone: 'success',
  },
  RESERVED: {
    label: 'Produit réservé',
    shortLabel: 'Réservée',
    description: 'Le produit est réservé pour cette commande.',
    tone: 'success',
  },
  PREPARING: {
    label: 'En préparation',
    shortLabel: 'Préparation',
    description: 'Le vendeur prépare le produit pour la remise.',
    tone: 'primary',
  },
  READY_FOR_HANDOVER: {
    label: 'Prête pour la remise',
    shortLabel: 'Prête',
    description: 'Le produit peut maintenant être remis ou expédié.',
    tone: 'success',
  },
  IN_DELIVERY: {
    label: 'En livraison',
    shortLabel: 'Livraison',
    description: 'Le produit est en cours d’acheminement.',
    tone: 'primary',
  },
  RECEIVED: {
    label: 'Réception signalée',
    shortLabel: 'Reçue',
    description: 'La réception a été signalée et doit être finalisée.',
    tone: 'success',
  },
  COMPLETED: {
    label: 'Commande terminée',
    shortLabel: 'Terminée',
    description: 'La réception est confirmée et la transaction est terminée.',
    tone: 'success',
  },
  CANCELLED: {
    label: 'Commande annulée',
    shortLabel: 'Annulée',
    description: 'Cette commande a été annulée avant sa finalisation.',
    tone: 'neutral',
  },
  DISPUTED: {
    label: 'Litige en cours',
    shortLabel: 'Litige',
    description: 'Le versement est bloqué pendant l’examen du litige.',
    tone: 'danger',
  },
  REFUNDED: {
    label: 'Commande remboursée',
    shortLabel: 'Remboursée',
    description: 'Le remboursement a été confirmé.',
    tone: 'neutral',
  },
}

export const paymentStatusConfig = {
  CREATED: { label: 'Créé', tone: 'neutral', terminal: false },
  PROCESSING: { label: 'En vérification', tone: 'primary', terminal: false },
  SUCCEEDED: { label: 'Confirmé', tone: 'success', terminal: true },
  FAILED: { label: 'Échoué', tone: 'danger', terminal: true },
  CANCELLED: { label: 'Annulé', tone: 'neutral', terminal: true },
  REFUND_PENDING: { label: 'Remboursement en cours', tone: 'warning', terminal: false },
  REFUNDED: { label: 'Remboursé', tone: 'neutral', terminal: true },
}

export const boostStatusConfig = {
  PENDING_PAYMENT: { label: 'Paiement attendu', tone: 'warning' },
  ACTIVE: { label: 'Actif', tone: 'success' },
  EXPIRED: { label: 'Expiré', tone: 'neutral' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  REJECTED: { label: 'Refusé', tone: 'danger' },
  REFUNDED: { label: 'Remboursé', tone: 'neutral' },
}

export function orderStatus(status) {
  return orderStatusConfig[status] || {
    label: status || 'Statut indisponible',
    shortLabel: status || 'Inconnu',
    description: 'Le statut de cette commande est en cours de synchronisation.',
    tone: 'neutral',
  }
}

export function paymentStatus(status) {
  return paymentStatusConfig[status] || { label: status || 'Inconnu', tone: 'neutral', terminal: false }
}

export function boostStatus(status) {
  return boostStatusConfig[status] || { label: status || 'Inconnu', tone: 'neutral' }
}

export function orderProduct(order) {
  const snapshot = order?.productSnapshot || {}
  const product = order?.product || {}
  const mainImage = product.mainImage?.url || product.imageUrl || snapshot.imageUrl || snapshot.image
  return {
    id: order?.productId || product.id || snapshot.id,
    slug: product.slug || snapshot.slug || product.id || snapshot.id,
    title: product.title || snapshot.title || 'Produit Fi Fow',
    image: mainImage || '/assets/empty-product.svg',
    price: Number(order?.itemAmount || product.price || snapshot.price || 0),
  }
}

export function orderCounterpart(order, currentUserId) {
  const buyer = order?.buyer || order?.buyerSnapshot || {}
  const seller = order?.seller || order?.sellerSnapshot || {}
  const counterpart = order?.counterpart || (order?.buyerId === currentUserId ? seller : buyer)
  return {
    id: counterpart.id || (order?.buyerId === currentUserId ? order?.sellerId : order?.buyerId),
    name: counterpart.fullName || counterpart.name || (order?.buyerId === currentUserId ? 'Vendeur Fi Fow' : 'Acheteur Fi Fow'),
    avatar: counterpart.avatarUrl || defaultAvatar,
  }
}

export function formatDateTime(value, options = {}) {
  if (!value) return 'Non renseigné'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Non renseigné'
  return new Intl.DateTimeFormat('fr-GN', {
    dateStyle: options.dateOnly ? 'medium' : 'medium',
    ...(options.dateOnly ? {} : { timeStyle: 'short' }),
  }).format(date)
}

export function isOrderBuyer(order, userId) {
  return order?.buyerId === userId
}

export function isOrderSeller(order, userId) {
  return order?.sellerId === userId
}

export function canDisputeOrder(order) {
  return ['PAID', 'PREPARING', 'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED'].includes(order?.status)
}

export function canCancelOrder(order) {
  return ['AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT'].includes(order?.status)
}
