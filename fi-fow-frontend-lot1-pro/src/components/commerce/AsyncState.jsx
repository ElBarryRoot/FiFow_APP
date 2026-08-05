import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

export function LoadingBlock({ label = 'Chargement en cours…', rows = 3 }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg border border-fifow-border bg-white" />
      ))}
    </div>
  )
}

export function ErrorBlock({ title = 'Impossible de charger cette page', message, onRetry }) {
  return (
    <Card className="p-7 text-center" role="alert">
      <AlertCircle className="mx-auto h-10 w-10 text-fifow-red" />
      <h2 className="mt-3 text-xl font-black text-fifow-dark">{title}</h2>
      {message ? <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-fifow-secondary">{message}</p> : null}
      {onRetry ? <Button type="button" variant="secondary" icon={RefreshCw} className="mt-5" onClick={onRetry}>Réessayer</Button> : null}
    </Card>
  )
}

export function EmptyBlock({ title, message, action }) {
  return (
    <Card className="border-dashed p-8 text-center">
      <Inbox className="mx-auto h-10 w-10 text-fifow-muted" />
      <h2 className="mt-3 text-xl font-black text-fifow-dark">{title}</h2>
      {message ? <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-fifow-secondary">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}
