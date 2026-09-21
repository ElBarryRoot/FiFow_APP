import { Banknote, Check, CreditCard, Smartphone, Truck } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import PaymentBrandBadge from './PaymentBrandBadge.jsx'
import { cn } from '../../lib/utils.js'

const icons = {
  mobile_money: Smartphone,
  cash_on_delivery: Truck,
  card: CreditCard,
}

export default function PaymentMethodCard({ method, selected, onSelect }) {
  const Icon = icons[method.id] ?? Banknote

  return (
    <button
      type="button"
      onClick={() => onSelect(method.id)}
      className={cn(
        'w-full rounded-lg border bg-white p-4 text-left transition active:scale-[0.99] sm:p-5',
        selected ? 'border-fifow-primary bg-fifow-lavender/30 ring-2 ring-violet-100' : 'border-fifow-border hover:border-violet-200',
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-lg', selected ? 'bg-white text-fifow-primary' : 'bg-slate-50 text-fifow-primary')}>
          <Icon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-black text-fifow-dark">{method.title}</span>
            {method.recommended ? <Badge>Recommandé</Badge> : null}
          </span>
          <span className="mt-1 block text-sm font-semibold text-fifow-secondary">{method.description}</span>
          {method.brands.length ? (
            <span className="mt-4 flex flex-wrap gap-2">
              {method.brands.map((brand) => <PaymentBrandBadge key={brand} brand={brand} />)}
            </span>
          ) : null}
        </span>
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full border-2', selected ? 'border-fifow-primary bg-fifow-primary text-white' : 'border-slate-200 text-transparent')}>
          <Check className="h-6 w-6" />
        </span>
      </div>
    </button>
  )
}
