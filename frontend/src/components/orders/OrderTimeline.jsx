import { Check, Circle } from 'lucide-react'
import { formatDateTime, orderStatus } from '../../lib/commerce.js'

export default function OrderTimeline({ history = [] }) {
  if (!history.length) return <p className="text-sm font-semibold text-fifow-secondary">L’historique détaillé sera disponible après la prochaine mise à jour.</p>

  return (
    <ol className="space-y-0">
      {history.map((entry, index) => {
        const status = orderStatus(entry.toStatus || entry.status)
        const last = index === history.length - 1
        return (
          <li key={entry.id || `${entry.toStatus}-${entry.createdAt}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            {!last ? <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-emerald-200" /> : null}
            <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fifow-green text-white">
              {last ? <Circle className="h-3 w-3 fill-current" /> : <Check className="h-4 w-4" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-black text-fifow-dark">{entry.statusLabel || status.label}</p>
              <p className="mt-0.5 text-xs font-bold text-fifow-muted">{formatDateTime(entry.createdAt)}</p>
              {entry.reason ? <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{entry.reason}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
