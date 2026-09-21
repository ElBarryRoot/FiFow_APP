import { Boxes, Gift, Layers3, Package } from 'lucide-react'
import Input from '../ui/Input.jsx'
import { cn } from '../../lib/utils.js'

const modes = [
  {
    value: 'SINGLE',
    title: 'Article unique',
    description: 'Une seule pièce disponible',
    icon: Package,
  },
  {
    value: 'LOT',
    title: 'Lot d’articles',
    description: 'Plusieurs articles vendus ensemble',
    icon: Layers3,
  },
  {
    value: 'STOCK',
    title: 'Article en stock',
    description: 'Plusieurs exemplaires identiques',
    icon: Boxes,
  },
  {
    value: 'DONATION',
    title: 'Don',
    description: 'Produit offert gratuitement',
    icon: Gift,
  },
]

export default function ListingModeSelector({
  value,
  quantity,
  lotItemCount,
  onChange,
  canManageStock,
  error,
  lotError,
}) {
  function selectMode(mode) {
    onChange({
      listingMode: mode,
      stockQuantity: mode === 'STOCK' ? Math.max(2, Number(quantity) || 2) : 1,
      lotItemCount: mode === 'LOT' ? Math.max(2, Number(lotItemCount) || 2) : null,
      ...(mode === 'DONATION' ? { price: '0', negotiable: false } : {}),
    })
  }

  return (
    <section className="border-t border-fifow-border pt-7">
      <div>
        <h3 className="text-base font-extrabold text-fifow-dark">Type de vente</h3>
        <p className="mt-1 text-sm font-medium text-fifow-secondary">
          Cette information sera clairement présentée aux acheteurs.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Type de vente">
        {modes.map((mode) => {
          const Icon = mode.icon
          const disabled = mode.value === 'STOCK' && !canManageStock
          const active = value === mode.value

          return (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => selectMode(mode.value)}
              className={cn(
                'min-h-28 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifow-primary',
                active
                  ? 'border-fifow-primary bg-fifow-lavender ring-2 ring-violet-100'
                  : 'border-fifow-border bg-white hover:border-violet-200',
                disabled && 'cursor-not-allowed bg-slate-50 opacity-60',
              )}
            >
              <Icon className={cn('h-5 w-5', active ? 'text-fifow-primary' : 'text-fifow-secondary')} />
              <span className="mt-2 block text-sm font-black text-fifow-dark">{mode.title}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-fifow-secondary">
                {disabled ? 'Disponible après autorisation de Fi Fow' : mode.description}
              </span>
            </button>
          )
        })}
      </div>

      {value === 'LOT' ? (
        <InventoryField
          id="lot-item-count"
          label="Nombre d’articles dans le lot"
          value={lotItemCount ?? ''}
          min="2"
          help="Le prix concerne l’ensemble. L’acheteur recevra tous les articles du lot."
          error={lotError}
          onChange={(nextValue) => onChange({ lotItemCount: nextValue })}
        />
      ) : null}

      {value === 'STOCK' ? (
        <InventoryField
          id="stock-quantity"
          label="Nombre d’exemplaires disponibles"
          value={quantity}
          min="1"
          help="La quantité visible est actualisée automatiquement après chaque réservation ou vente."
          error={error}
          onChange={(nextValue) => onChange({ stockQuantity: nextValue })}
        />
      ) : null}
    </section>
  )
}

function InventoryField({ id, label, value, min, help, error, onChange }) {
  return (
    <div className="mt-4 max-w-sm rounded-xl border border-violet-100 bg-violet-50/40 p-4">
      <label className="mb-2 block text-sm font-extrabold text-fifow-dark" htmlFor={id}>{label}</label>
      <Input
        id={id}
        type="number"
        min={min}
        max="10000"
        inputMode="numeric"
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={`${id}-help`} className="mt-2 text-xs font-semibold leading-5 text-fifow-secondary">{help}</p>
      {error ? <p id={`${id}-error`} className="mt-2 text-sm font-bold text-fifow-red" role="alert">{error}</p> : null}
    </div>
  )
}
