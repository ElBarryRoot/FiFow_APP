import { Inbox, RefreshCw } from 'lucide-react'
import Button from '../ui/Button.jsx'

export function AdminLoading({ rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-fifow-border bg-white" role="status" aria-label="Chargement">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-16 animate-pulse items-center gap-4 border-b border-fifow-border px-4 last:border-b-0">
          <span className="h-9 w-9 rounded-lg bg-slate-100" />
          <span className="h-3 w-1/3 rounded bg-slate-100" />
          <span className="ml-auto h-3 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function AdminError({ onRetry, message = 'Les données ne peuvent pas être chargées.' }) {
  return (
    <div className="rounded-lg border border-red-100 bg-white px-5 py-10 text-center" role="alert">
      <p className="font-extrabold text-fifow-red">{message}</p>
      {onRetry ? <Button type="button" variant="secondary" icon={RefreshCw} className="mt-4" onClick={onRetry}>Réessayer</Button> : null}
    </div>
  )
}

export function AdminEmpty({ title = 'Aucun résultat', description = 'Aucune donnée ne correspond aux filtres actuels.' }) {
  return (
    <div className="rounded-lg border border-fifow-border bg-white px-5 py-12 text-center">
      <Inbox className="mx-auto h-9 w-9 text-fifow-muted" />
      <h3 className="mt-3 text-lg font-black text-fifow-dark">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-fifow-secondary">{description}</p>
    </div>
  )
}

