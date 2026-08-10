import { Radio, RefreshCw, WifiOff } from 'lucide-react'
import { useRealtime } from '../../realtime/RealtimeContext.jsx'
import { cn } from '../../lib/utils.js'

const statusCopy = {
  connected: {
    label: 'Mise a jour en direct',
    icon: Radio,
    className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  },
  connecting: {
    label: 'Connexion en cours',
    icon: RefreshCw,
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  },
  reconnecting: {
    label: 'Reconnexion en cours',
    icon: RefreshCw,
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  },
  offline: {
    label: 'Mode hors connexion',
    icon: WifiOff,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  disconnected: {
    label: 'Actualisation automatique active',
    icon: RefreshCw,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
}

export default function AdminLiveStatus({ className }) {
  const { status } = useRealtime()
  const current = statusCopy[status] || statusCopy.disconnected
  const Icon = current.icon

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-extrabold',
        current.className,
        className,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'connecting' || status === 'reconnecting' ? 'animate-spin' : '')} />
      {current.label}
    </span>
  )
}
