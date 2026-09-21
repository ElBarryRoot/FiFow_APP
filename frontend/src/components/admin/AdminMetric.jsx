import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils.js'

const tones = {
  primary: 'bg-fifow-lavender text-fifow-primary',
  green: 'bg-emerald-50 text-fifow-green',
  orange: 'bg-orange-50 text-fifow-orange',
  red: 'bg-red-50 text-fifow-red',
  blue: 'bg-blue-50 text-fifow-blue',
}

export default function AdminMetric({ label, value, helper, icon: Icon, tone = 'primary', to, as: Component = to ? Link : 'div' }) {
  return (
    <Component {...(to ? { to } : {})} className="flex min-h-32 items-start justify-between rounded-lg border border-fifow-border bg-white p-4 shadow-card transition-colors hover:border-violet-200">
      <div className="min-w-0">
        <p className="text-sm font-bold text-fifow-secondary">{label}</p>
        <p className="mt-2 break-words text-2xl font-black text-fifow-dark">{value}</p>
        {helper ? <p className="mt-1 text-xs font-semibold text-fifow-muted">{helper}</p> : null}
      </div>
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', tones[tone])}>
        {Icon ? <Icon className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
      </span>
    </Component>
  )
}
