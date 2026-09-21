import { AlertTriangle, Check, CheckCircle2, Clock3, CreditCard, PackageCheck, Truck } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const journey = [
  { id: 'availability', title: 'Disponibilité du produit', icon: CheckCircle2 },
  { id: 'payment', title: 'Paiement confirmé', icon: CreditCard },
  { id: 'preparation', title: 'Préparation', icon: PackageCheck },
  { id: 'handover', title: 'Remise ou livraison', icon: Truck },
  { id: 'receipt', title: 'Réception confirmée', icon: CheckCircle2 },
]

const stageByStatus = {
  AWAITING_SELLER_CONFIRMATION: 0,
  AWAITING_PAYMENT: 1,
  PAID: 2,
  RESERVED: 2,
  PREPARING: 2,
  READY_FOR_HANDOVER: 3,
  IN_DELIVERY: 3,
  RECEIVED: 4,
}

const exceptionalStatuses = {
  CANCELLED: {
    title: 'Commande annulée',
    description: 'Cette commande est terminée. Aucun nouveau paiement ne sera demandé pour cette commande.',
    tone: 'neutral',
  },
  DISPUTED: {
    title: 'Dossier en cours d’examen',
    description: 'Fi Fow suit le dossier avant toute suite à donner à la transaction.',
    tone: 'danger',
  },
  REFUNDED: {
    title: 'Remboursement confirmé',
    description: 'Le remboursement est confirmé pour cette transaction. Consultez le détail de paiement si besoin.',
    tone: 'success',
  },
}

export default function OrderProgress({ order, userId }) {
  const completed = order?.status === 'COMPLETED'
  const currentIndex = completed ? journey.length : stageByStatus[order?.status] ?? 0
  const exceptional = exceptionalStatuses[order?.status]
  const activeDescription = describeActiveStep(order, userId)

  return (
    <section aria-labelledby="order-progress-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="order-progress-title" className="text-lg font-black text-fifow-dark">Parcours de la commande</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">
            Chaque étape se met à jour dès que la personne concernée agit.
          </p>
        </div>
        {!exceptional ? (
          <span className="text-sm font-black text-fifow-primary">
            {completed ? 'Commande terminée' : 'Étape ' + (currentIndex + 1) + ' sur ' + journey.length}
          </span>
        ) : null}
      </div>

      {exceptional ? <ExceptionalStatus status={exceptional} /> : null}

      {!exceptional ? (
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Étapes de la commande">
          {journey.map((step, index) => {
            const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'pending'
            const Icon = state === 'complete' ? Check : state === 'current' ? Clock3 : step.icon
            return (
              <li
                key={step.id}
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'min-w-0 rounded-lg border p-3',
                  state === 'complete' && 'border-emerald-100 bg-emerald-50/70',
                  state === 'current' && 'border-violet-200 bg-fifow-lavender/60 ring-1 ring-violet-100',
                  state === 'pending' && 'border-fifow-border bg-slate-50/70',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full',
                    state === 'complete' && 'bg-fifow-green text-white',
                    state === 'current' && 'bg-fifow-primary text-white',
                    state === 'pending' && 'bg-white text-fifow-muted',
                  )}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-black text-fifow-dark">{step.title}</span>
                </div>
                {state === 'current' ? <p className="mt-2 text-xs font-semibold leading-5 text-fifow-secondary">{activeDescription}</p> : null}
                {state === 'complete' ? <p className="mt-2 text-xs font-bold text-fifow-green">Étape terminée</p> : null}
                {state === 'pending' ? <p className="mt-2 text-xs font-semibold text-fifow-muted">À venir</p> : null}
              </li>
            )
          })}
        </ol>
      ) : null}
    </section>
  )
}

function ExceptionalStatus({ status }) {
  const Icon = status.tone === 'success' ? CheckCircle2 : AlertTriangle
  const tone = status.tone === 'danger' ? 'bg-red-50 text-fifow-red' : 'bg-slate-50 text-fifow-secondary'

  return (
    <div className={cn('mt-5 flex gap-3 rounded-lg p-4', tone)}>
      <Icon className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-black text-fifow-dark">{status.title}</p>
        <p className="mt-1 text-sm font-semibold leading-6">{status.description}</p>
      </div>
    </div>
  )
}

function describeActiveStep(order, userId) {
  const buyer = order?.buyerId === userId
  const seller = order?.sellerId === userId

  if (order?.status === 'AWAITING_SELLER_CONFIRMATION') return seller ? 'Confirmez la disponibilité pour permettre le paiement.' : 'Le vendeur confirme la disponibilité avant le paiement.'
  if (order?.status === 'AWAITING_PAYMENT') return buyer ? 'Réglez le montant affiché pour lancer la préparation.' : 'L’acheteur peut maintenant régler le montant affiché.'
  if (['PAID', 'RESERVED', 'PREPARING'].includes(order?.status)) return seller ? 'Préparez le produit et indiquez dès qu’il est prêt.' : 'Le vendeur prépare votre produit pour la remise.'
  if (['READY_FOR_HANDOVER', 'IN_DELIVERY'].includes(order?.status)) return buyer ? 'Vérifiez le produit avant de confirmer sa réception.' : 'Organisez la remise avec l’acheteur dans la conversation.'
  if (order?.status === 'RECEIVED') return 'La réception est signalée. La transaction se finalise selon son suivi.'
  if (order?.status === 'COMPLETED') return 'La transaction est terminée. Vous pouvez partager votre expérience.'
  return 'Le suivi de cette commande se met à jour automatiquement.'
}
