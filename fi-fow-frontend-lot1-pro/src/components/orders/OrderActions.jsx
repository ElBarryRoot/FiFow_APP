import { AlertTriangle, Ban, CheckCircle2, CreditCard, MessageCircle, PackageCheck, Send, Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { canCancelOrder, canDisputeOrder, isOrderBuyer, isOrderSeller } from '../../lib/commerce.js'

export default function OrderActions({ order, userId, pendingAction, onAction, onReasonAction }) {
  const buyer = isOrderBuyer(order, userId)
  const seller = isOrderSeller(order, userId)
  const busy = Boolean(pendingAction)
  const hasReview = Boolean(order.myReview) || (Array.isArray(order.reviews) && order.reviews.some((review) => review.authorId === userId))
  const availableActions = Array.isArray(order.availableActions) ? new Set(order.availableActions) : null
  const available = (action, fallback) => availableActions ? availableActions.has(action) : fallback

  return (
    <div className="grid gap-2">
      {available('SELLER_CONFIRM', seller && order.status === 'AWAITING_SELLER_CONFIRMATION') ? <ActionButton icon={CheckCircle2} action="seller-confirm" pendingAction={pendingAction} onClick={onAction}>Confirmer la disponibilité</ActionButton> : null}
      {available('PAY', buyer && order.status === 'AWAITING_PAYMENT') ? <Button as={Link} to={`/checkout/${order.id}`} icon={CreditCard} className="w-full">Payer en sécurité</Button> : null}
      {available('PREPARE', seller && order.status === 'PAID') ? <ActionButton icon={PackageCheck} action="prepare" pendingAction={pendingAction} onClick={onAction}>Commencer la préparation</ActionButton> : null}
      {available('READY', seller && order.status === 'PREPARING') ? <ActionButton icon={Store} action="ready" pendingAction={pendingAction} onClick={onAction}>Commande prête</ActionButton> : null}
      {available('SHIP', seller && order.status === 'READY_FOR_HANDOVER' && order.handoverMode !== 'HAND_TO_HAND') ? <ActionButton icon={Send} action="ship" pendingAction={pendingAction} onClick={onAction}>Confirmer l’expédition</ActionButton> : null}
      {available('RECEIVE', buyer && ['READY_FOR_HANDOVER', 'IN_DELIVERY'].includes(order.status)) ? <ActionButton icon={CheckCircle2} action="receive" pendingAction={pendingAction} onClick={onAction}>Confirmer la réception</ActionButton> : null}
      {available('REVIEW', buyer && order.status === 'COMPLETED' && !hasReview && order.canReview !== false) ? <Button as={Link} to={`/orders/${order.id}/review`} icon={Star} className="w-full">Laisser un avis</Button> : null}
      {order.conversationId ? <Button as={Link} to={`/messages/${order.conversationId}`} variant="secondary" icon={MessageCircle} className="w-full">Ouvrir la conversation</Button> : null}
      {available('CANCEL', canCancelOrder(order)) ? <Button type="button" variant="ghost" icon={Ban} disabled={busy} onClick={() => onReasonAction('cancel')}>Annuler la commande</Button> : null}
      {available('DISPUTE', canDisputeOrder(order)) ? <Button type="button" variant="ghost" icon={AlertTriangle} disabled={busy} className="text-fifow-red hover:bg-red-50" onClick={() => onReasonAction('dispute')}>Signaler un problème</Button> : null}
    </div>
  )
}

function ActionButton({ action, pendingAction, onClick, icon, children }) {
  return <Button type="button" icon={icon} className="w-full" loading={pendingAction === action} disabled={Boolean(pendingAction) && pendingAction !== action} onClick={() => onClick(action)}>{children}</Button>
}
