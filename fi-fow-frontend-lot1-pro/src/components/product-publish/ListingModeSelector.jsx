import { Boxes, Layers3, Package } from 'lucide-react'
import Input from '../ui/Input.jsx'
import { cn } from '../../lib/utils.js'

const modes = [
  { value: 'SINGLE', title: 'Article unique', description: 'Une seule pièce disponible', icon: Package },
  { value: 'LOT', title: 'Lot', description: 'Un ensemble vendu en une fois', icon: Layers3 },
  { value: 'STOCK', title: 'Article en stock', description: 'Plusieurs exemplaires identiques', icon: Boxes },
]

export default function ListingModeSelector({ value, quantity, onChange, canManageStock, error }) {
  return (
    <section className="border-t border-fifow-border pt-7">
      <div><h3 className="text-base font-extrabold text-fifow-dark">Type de vente</h3><p className="mt-1 text-sm font-medium text-fifow-secondary">Choisissez selon la réalité de ce que vous vendez, indépendamment de son état.</p></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Type de vente">
        {modes.map((mode) => {
          const Icon = mode.icon
          const disabled = mode.value === 'STOCK' && !canManageStock
          const active = value === mode.value
          return (
            <button key={mode.value} type="button" role="radio" aria-checked={active} disabled={disabled} onClick={() => onChange({ listingMode: mode.value, stockQuantity: mode.value === 'STOCK' ? Math.max(2, Number(quantity) || 2) : 1 })} className={cn('min-h-28 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifow-primary', active ? 'border-fifow-primary bg-fifow-lavender ring-2 ring-violet-100' : 'border-fifow-border bg-white hover:border-violet-200', disabled && 'cursor-not-allowed bg-slate-50 opacity-60')}>
              <Icon className={cn('h-5 w-5', active ? 'text-fifow-primary' : 'text-fifow-secondary')} />
              <span className="mt-2 block text-sm font-black text-fifow-dark">{mode.title}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-fifow-secondary">{disabled ? 'Disponible après autorisation vendeur pro' : mode.description}</span>
            </button>
          )
        })}
      </div>
      {value === 'STOCK' ? <div className="mt-4 max-w-xs"><label className="mb-2 block text-sm font-extrabold text-fifow-dark" htmlFor="stock-quantity">Quantité disponible</label><Input id="stock-quantity" type="number" min="1" max="10000" inputMode="numeric" value={quantity} onChange={(event) => onChange({ stockQuantity: event.target.value })} /><p className="mt-1.5 text-xs font-semibold text-fifow-secondary">Le stock est réservé uniquement lorsqu’une commande est créée.</p></div> : null}
      {error ? <p className="mt-3 text-sm font-bold text-fifow-red" role="alert">{error}</p> : null}
    </section>
  )
}
