import { Check, CreditCard, PackageCheck, ReceiptText } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const steps = [
  { id: 'order', label: 'Commande', description: 'Le montant est vérifié', icon: ReceiptText },
  { id: 'payment', label: 'Paiement', description: 'Le partenaire confirme', icon: CreditCard },
  { id: 'handover', label: 'Remise', description: 'La commande reste suivie', icon: PackageCheck },
]

const stepIndex = {
  order: 0,
  payment: 1,
  handover: 2,
}

export default function PaymentJourney({ current = 'payment' }) {
  const currentIndex = stepIndex[current] ?? stepIndex.payment

  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Étapes de la transaction">
      {steps.map((step, index) => {
        const complete = index < currentIndex
        const active = index === currentIndex
        const Icon = complete ? Check : step.icon
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex min-w-0 items-center gap-3 rounded-lg border p-3',
              complete && 'border-emerald-100 bg-emerald-50/70',
              active && 'border-violet-200 bg-fifow-lavender/50',
              !complete && !active && 'border-fifow-border bg-white',
            )}
          >
            <span className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full',
              complete && 'bg-fifow-green text-white',
              active && 'bg-fifow-primary text-white',
              !complete && !active && 'bg-slate-100 text-fifow-muted',
            )}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-fifow-dark">{step.label}</span>
              <span className="mt-0.5 block text-xs font-semibold leading-5 text-fifow-secondary">{step.description}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
