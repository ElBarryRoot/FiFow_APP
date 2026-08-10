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
  const primaryAction = getPrimaryAction({ order, buyer, seller, hasReview, available })
  const canCancel = available('CANCEL', canCancelOrder(order))
  const canDispute = available('DISPUTE', canDisputeOrder(order))

  return (
    <div className="space-y-4">
      {primaryAction ? <NextAction action={primaryAction} pendingAction={pendingAction} onAction={onAction} /> : <NoActionMessage order={order} buyer={buyer} seller={seller} />}

      {order.conversationId ? (
        <Button as={Link} to={`/messages/${order.conversationId}`} variant="secondary" icon={MessageCircle} className="w-full">
          Ouvrir la conversation
        </Button>
      ) : null}

      {canCancel || canDispute ? (
        <div className="border-t border-fifow-border pt-4">
          <p className="text-xs font-black uppercase text-fifow-muted">Besoin d’aide</p>
          <div className="mt-3 grid gap-2">
            {canCancel ? <Button type="button" variant="ghost" icon={Ban} disabled={busy} onClick={() => onReasonAction('cancel')}>Annuler la commande</Button> : null}
            {canDispute ? <Button type="button" variant="ghost" icon={AlertTriangle} disabled={busy} className="text-fifow-red hover:bg-red-50" onClick={() => onReasonAction('dispute')}>Signaler un problème</Button> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getPrimaryAction({ order, buyer, seller, hasReview, available }) {
  if (available('SELLER_CONFIRM', seller && order.status === 'AWAITING_SELLER_CONFIRMATION')) {
    return {
      id: 'seller-confirm',
      icon: CheckCircle2,
      title: 'Confirmez la disponibilité',
      description: 'Indiquez que le produit est encore disponible avant que l’acheteur paie.',
      label: 'Confirmer la disponibilité',
    }
  }
  if (available('PAY', buyer && order.status === 'AWAITING_PAYMENT')) {
    return {
      id: 'pay',
      icon: CreditCard,
      title: 'Réglez le montant affiché',
      description: 'Le paiement est suivi dans Fi Fow et doit être confirmé par le partenaire de paiement.',
      label: 'Payer en sécurité',
      to: `/checkout/${order.id}`,
    }
  }
  if (available('PREPARE', seller && order.status === 'PAID')) {
    return {
      id: 'prepare',
      icon: PackageCheck,
      title: 'Préparez le produit',
      description: 'Vérifiez le produit, puis indiquez quand il pourra être remis.',
      label: 'Commencer la préparation',
    }
  }
  if (available('READY', seller && order.status === 'PREPARING')) {
    return {
      id: 'ready',
      icon: Store,
      title: 'Indiquez que le produit est prêt',
      description: 'L’acheteur sera invité à convenir de la remise dans la conversation.',
      label: 'Commande prête',
    }
  }
  if (available('SHIP', seller && order.status === 'READY_FOR_HANDOVER' && order.handoverMode !== 'HAND_TO_HAND')) {
    return {
      id: 'ship',
      icon: Send,
      title: 'Confirmez l’expédition',
      description: 'Partagez uniquement les informations nécessaires à la livraison.',
      label: 'Confirmer l’expédition',
    }
  }
  if (available('RECEIVE', buyer && ['READY_FOR_HANDOVER', 'IN_DELIVERY'].includes(order.status))) {
    return {
      id: 'receive',
      icon: CheckCircle2,
      title: 'Confirmez après vérification',
      description: 'Vérifiez le produit avant de confirmer sa réception.',
      label: 'Confirmer la réception',
    }
  }
  if (available('REVIEW', buyer && order.status === 'COMPLETED' && !hasReview && order.canReview !== false)) {
    return {
      id: 'review',
      icon: Star,
      title: 'Partagez votre expérience',
      description: 'Votre avis aide les prochains membres de la communauté.',
      label: 'Laisser un avis',
      to: `/orders/${order.id}/review`,
    }
  }
  return null
}

function NextAction({ action, pendingAction, onAction }) {
  const Icon = action.icon
  const loading = pendingAction === action.id

  return (
    <section className="rounded-lg bg-fifow-lavender/60 p-4" aria-label="Prochaine action">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-fifow-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-fifow-primary">Prochaine action</p>
          <h3 className="mt-1 font-black text-fifow-dark">{action.title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{action.description}</p>
        </div>
      </div>
      {action.to ? (
        <Button as={Link} to={action.to} icon={Icon} className="mt-4 w-full">{action.label}</Button>
      ) : (
        <Button type="button" icon={Icon} className="mt-4 w-full" loading={loading} disabled={Boolean(pendingAction) && !loading} onClick={() => onAction(action.id)}>{action.label}</Button>
      )}
    </section>
  )
}

function NoActionMessage({ order, buyer, seller }) {
  let message = 'Aucune action n’est requise pour le moment. Le suivi se met à jour automatiquement.'
  if (order.status === 'AWAITING_SELLER_CONFIRMATION' && buyer) message = 'Le vendeur doit confirmer la disponibilité du produit avant le paiement.'
  if (order.status === 'AWAITING_PAYMENT' && seller) message = 'L’acheteur peut maintenant régler le montant affiché.'
  if (order.status === 'DISPUTED') message = 'Le dossier est en cours d’examen. Fi Fow vous informera de la prochaine étape.'
  if (order.status === 'COMPLETED' && seller) message = 'La commande est terminée. Merci d’avoir utilisé Fi Fow.'

  return <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-fifow-secondary">{message}</p>
}
