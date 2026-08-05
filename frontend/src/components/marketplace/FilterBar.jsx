import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { categories } from '../../data/categories.js'

const conditions = ['Neuf', 'Très bon état', 'Bon état']
const locations = ['Conakry', 'Kaloum', 'Matam', 'Matoto', 'Ratoma', 'Dixinn']

export default function FilterBar({ filters, onChange, onClear, onClose }) {
  return (
    <div className="rounded-lg border border-fifow-border bg-white">
      <div className="flex h-14 items-center justify-between border-b border-fifow-border px-4">
        <h2 className="flex items-center gap-2 font-extrabold text-fifow-dark">
          <SlidersHorizontal className="h-5 w-5 text-fifow-primary" />
          Filtres
        </h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onClear} className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-bold text-fifow-secondary transition hover:bg-slate-100 hover:text-fifow-dark">
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Fermer les filtres" className="grid h-9 w-9 place-items-center rounded-md text-fifow-secondary hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-fifow-border">
        <FilterGroup title="Catégorie">
          <select value={filters.category} onChange={(event) => onChange('category', event.target.value)} className="h-11 w-full rounded-md border border-fifow-border bg-white px-3 text-sm font-semibold text-fifow-dark outline-none focus:border-fifow-primary">
            <option value="">Toutes les catégories</option>
            {categories.filter((item) => item.id !== 'plus').map((category) => (
              <option key={category.id} value={category.label}>{category.label}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Fourchette de prix">
          <div className="grid grid-cols-2 gap-2">
            <input value={filters.minPrice} onChange={(event) => onChange('minPrice', event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Minimum" aria-label="Prix minimum" className="h-11 min-w-0 rounded-md border border-fifow-border px-3 text-sm outline-none focus:border-fifow-primary" />
            <input value={filters.maxPrice} onChange={(event) => onChange('maxPrice', event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Maximum" aria-label="Prix maximum" className="h-11 min-w-0 rounded-md border border-fifow-border px-3 text-sm outline-none focus:border-fifow-primary" />
          </div>
        </FilterGroup>

        <FilterGroup title="Localisation">
          <select value={filters.location} onChange={(event) => onChange('location', event.target.value)} className="h-11 w-full rounded-md border border-fifow-border bg-white px-3 text-sm font-semibold text-fifow-dark outline-none focus:border-fifow-primary">
            <option value="">Toute la Guinée</option>
            {locations.map((location) => <option key={location}>{location}</option>)}
          </select>
        </FilterGroup>

        <FilterGroup title="État du produit">
          <div className="space-y-2">
            {conditions.map((condition) => (
              <label key={condition} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-fifow-secondary">
                <input type="radio" name="condition" checked={filters.condition === condition} onChange={() => onChange('condition', condition)} className="h-4 w-4 accent-fifow-primary" />
                {condition}
              </label>
            ))}
            {filters.condition ? (
              <button type="button" onClick={() => onChange('condition', '')} className="text-xs font-bold text-fifow-primary">Tous les états</button>
            ) : null}
          </div>
        </FilterGroup>

        <FilterGroup title="Préférences">
          <div className="space-y-3">
            <CheckRow label="Prix négociable" checked={filters.negotiable} onChange={(checked) => onChange('negotiable', checked)} />
            <CheckRow label="Vendeur vérifié" checked={filters.verified} onChange={(checked) => onChange('verified', checked)} />
          </div>
        </FilterGroup>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div className="p-4">
      <h3 className="mb-3 text-sm font-extrabold text-fifow-dark">{title}</h3>
      {children}
    </div>
  )
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-fifow-secondary">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded accent-fifow-primary" />
    </label>
  )
}
