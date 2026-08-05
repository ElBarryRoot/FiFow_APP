import { CalendarDays, CheckCircle2, Crown, Flame, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { cn } from '../../lib/utils.js'

const toneClasses = {
  purple: 'border-fifow-primary ring-4 ring-violet-100',
  orange: 'border-orange-100',
  green: 'border-emerald-100',
}

export default function BoostPlanCard({ plan }) {
  return (
    <Card className={cn('relative overflow-visible p-5 sm:p-6', toneClasses[plan.tone])}>
      {plan.popular ? (
        <span className="absolute -top-4 left-5 rounded-full bg-fifow-primary px-4 py-2 text-xs font-black text-white shadow-float">{plan.label}</span>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-orange-50 text-fifow-orange">
          <CalendarDays className="h-12 w-12" />
        </div>
        <div>
          {!plan.popular ? <span className="rounded-xl border border-orange-200 px-3 py-1 text-xs font-black text-fifow-orange">{plan.label}</span> : null}
          <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-fifow-dark">{plan.name}</h3>
          <p className="mt-1 font-semibold text-fifow-secondary">{plan.description}</p>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm font-bold text-fifow-dark">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fifow-orange" /> {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:min-w-56 lg:text-right">
          <p className="text-3xl font-black tracking-[-0.05em] text-fifow-orange">{formatGNF(plan.price)}</p>
          <p className="mt-1 text-sm font-bold text-fifow-muted line-through">{formatGNF(plan.oldPrice)}</p>
          <Button as={Link} to="/products/iphone-13-pro/boost/checkout" className="mt-4 w-full bg-fifow-orange hover:bg-orange-600" icon={Flame}>
            Booster maintenant
          </Button>
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-black text-fifow-orange">
            {plan.popular ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />} {plan.highlight}
          </div>
        </div>
      </div>
    </Card>
  )
}
