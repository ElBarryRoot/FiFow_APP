import { CheckCircle2, Handshake, Store, Truck } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const iconMap = { Handshake, Truck, Store }
const toneMap = {
  violet: 'bg-fifow-lavender text-fifow-primary',
  orange: 'bg-orange-100 text-fifow-orange',
  green: 'bg-green-100 text-fifow-green',
}

export default function DeliveryOptionCard({ option, active, onClick }) {
  const Icon = iconMap[option.icon] || Handshake
  return (
    <button
      type="button"
      onClick={() => onClick(option.id)}
      className={cn(
        'relative flex min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-lg border bg-white p-3 text-center transition-colors',
        active ? 'border-fifow-primary bg-fifow-lavender/40 ring-2 ring-violet-100' : 'border-fifow-border hover:border-violet-200',
      )}
    >
      {active ? <CheckCircle2 className="absolute right-3 top-3 h-6 w-6 fill-fifow-primary text-white" /> : null}
      <span className={cn('grid h-10 w-10 place-items-center rounded-lg', toneMap[option.tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-base font-black text-fifow-dark">{option.title}</span>
      <span className="text-sm font-medium leading-5 text-fifow-secondary">{option.description}</span>
    </button>
  )
}
