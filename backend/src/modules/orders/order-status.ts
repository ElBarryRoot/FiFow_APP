import type { OrderStatus } from '@prisma/client';
import { orderTransitions } from './order-transitions.js';

type OrderStatusPresentation = {
  code: string;
  label: string;
  tone: 'warning' | 'primary' | 'success' | 'danger' | 'neutral';
  icon: string;
  description: string;
  concernedRole: 'BUYER' | 'SELLER' | 'BOTH' | 'FI_FOW';
  notification: string;
  deadlineField: 'sellerConfirmationExpiresAt' | 'paymentExpiresAt' | null;
};

const definitions: Record<OrderStatus, OrderStatusPresentation> = {
  AWAITING_SELLER_CONFIRMATION: { code: 'PENDING_SELLER_CONFIRMATION', label: 'En attente de confirmation du vendeur', tone: 'warning', icon: 'clock', description: 'Le vendeur vérifie que le produit est disponible.', concernedRole: 'SELLER', notification: 'Confirmez la disponibilité de votre produit.', deadlineField: 'sellerConfirmationExpiresAt' },
  AWAITING_PAYMENT: { code: 'PAYMENT_PENDING', label: 'Paiement attendu', tone: 'primary', icon: 'credit-card', description: 'Le vendeur a confirmé la disponibilité. L’acheteur peut payer en sécurité.', concernedRole: 'BUYER', notification: 'Vous pouvez maintenant effectuer le paiement sécurisé.', deadlineField: 'paymentExpiresAt' },
  PAID: { code: 'PAYMENT_CONFIRMED', label: 'Paiement confirmé', tone: 'success', icon: 'shield-check', description: 'Le paiement est confirmé et Fi Fow conserve la transaction pendant la remise.', concernedRole: 'SELLER', notification: 'Le paiement est confirmé. Préparez le produit.', deadlineField: null },
  RESERVED: { code: 'PAYMENT_CONFIRMED', label: 'Produit réservé', tone: 'primary', icon: 'lock', description: 'Le produit est réservé pour cette commande.', concernedRole: 'SELLER', notification: 'Le produit est réservé pour cette commande.', deadlineField: null },
  PREPARING: { code: 'PREPARING', label: 'Préparation en cours', tone: 'primary', icon: 'package', description: 'Le vendeur prépare le produit avant la remise.', concernedRole: 'SELLER', notification: 'Votre commande est en préparation.', deadlineField: null },
  READY_FOR_HANDOVER: { code: 'READY_FOR_HANDOVER', label: 'Prête pour la remise', tone: 'primary', icon: 'package-check', description: 'Le produit est prêt à être remis ou expédié.', concernedRole: 'BOTH', notification: 'La commande est prête pour la remise.', deadlineField: null },
  IN_DELIVERY: { code: 'IN_TRANSIT', label: 'En cours de livraison', tone: 'primary', icon: 'truck', description: 'Le produit est en route vers le lieu convenu.', concernedRole: 'BUYER', notification: 'Votre commande est en cours de livraison.', deadlineField: null },
  RECEIVED: { code: 'RECEIVED', label: 'Réception signalée', tone: 'success', icon: 'check-circle', description: 'La réception a été signalée. Fi Fow finalise la transaction.', concernedRole: 'FI_FOW', notification: 'La réception a été signalée.', deadlineField: null },
  DISPUTED: { code: 'DISPUTED', label: 'Problème signalé', tone: 'danger', icon: 'alert-triangle', description: 'Fi Fow examine la situation avant toute suite.', concernedRole: 'FI_FOW', notification: 'Un problème est en cours d’examen.', deadlineField: null },
  CANCELLED: { code: 'CANCELLED', label: 'Commande annulée', tone: 'neutral', icon: 'ban', description: 'Cette commande est terminée et ne peut plus être payée.', concernedRole: 'BOTH', notification: 'La commande a été annulée.', deadlineField: null },
  REFUNDED: { code: 'REFUNDED', label: 'Remboursement confirmé', tone: 'success', icon: 'rotate-ccw', description: 'Le remboursement de la transaction a été confirmé.', concernedRole: 'BUYER', notification: 'Votre remboursement est confirmé.', deadlineField: null },
  COMPLETED: { code: 'COMPLETED', label: 'Commande terminée', tone: 'success', icon: 'check-circle', description: 'La remise et la transaction sont terminées.', concernedRole: 'BOTH', notification: 'La commande est terminée.', deadlineField: null }
};

export function orderStatusInfo(status: OrderStatus) {
  return { ...definitions[status], allowedTransitions: orderTransitions[status] };
}
