import Badge from '../ui/Badge.jsx'

const success = new Set(['ACTIVE', 'AVAILABLE', 'APPROVED', 'PUBLISHED', 'SUCCEEDED', 'COMPLETED', 'RESOLVED', 'READY_FOR_HANDOVER', 'RECEIVED', 'REFUNDED', 'SOLD'])
const warning = new Set(['PENDING', 'PENDING_REVIEW', 'OPEN', 'UNDER_REVIEW', 'PROCESSING', 'CREATED', 'AWAITING_PAYMENT', 'AWAITING_SELLER_CONFIRMATION', 'PREPARING', 'PENDING_PAYMENT', 'SCHEDULED', 'WAITING_FOR_USER', 'RESERVED', 'IN_DELIVERY'])
const danger = new Set(['FAILED', 'REJECTED', 'BANNED', 'SUSPENDED', 'DISPUTED', 'HIDDEN', 'BLOCKED', 'REFUND_PENDING'])

const labels = {
  CREATED: 'Créé', PENDING_REVIEW: 'En vérification', RESERVED: 'Réservé', SOLD: 'Vendu', RECEIVED: 'Reçu',
  ACTIVE: 'Actif', AVAILABLE: 'Disponible', APPROVED: 'Approuvé', PUBLISHED: 'Publié',
  SUCCEEDED: 'Réussi', COMPLETED: 'Terminée', RESOLVED: 'Résolu', READY_FOR_HANDOVER: 'Prête',
  PENDING: 'En attente', OPEN: 'Ouvert', UNDER_REVIEW: 'En traitement', PROCESSING: 'En cours',
  AWAITING_PAYMENT: 'Paiement attendu', AWAITING_SELLER_CONFIRMATION: 'Confirmation vendeur', PREPARING: 'Préparation',
  PENDING_PAYMENT: 'Paiement attendu', SCHEDULED: 'Programmé', FAILED: 'Échec', REJECTED: 'Rejeté',
  BANNED: 'Banni', SUSPENDED: 'Suspendu', DISPUTED: 'Litige', HIDDEN: 'Masqué', BLOCKED: 'Bloqué',
  REFUND_PENDING: 'Remboursement', REFUNDED: 'Remboursé', CANCELLED: 'Annulé', ARCHIVED: 'Archivé',
  EXPIRED: 'Expiré', PAID: 'Payée', IN_DELIVERY: 'En livraison', DRAFT: 'Brouillon', REMOVED: 'Retiré',
  NOT_REQUESTED: 'Non demandé', CLOSED: 'Fermé', WAITING_FOR_USER: 'Réponse utilisateur', IN_PROGRESS: 'En cours',
}

export default function AdminStatusBadge({ status, className }) {
  const variant = success.has(status) ? 'success' : warning.has(status) ? 'warning' : danger.has(status) ? 'danger' : 'neutral'
  return <Badge variant={variant} className={className}>{adminStatusLabel(status)}</Badge>
}

export function adminStatusLabel(status) {
  return labels[status] || status || 'Inconnu'
}
