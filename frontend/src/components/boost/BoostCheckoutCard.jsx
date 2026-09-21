import { CalendarDays, MapPinned } from 'lucide-react'
import { formatGNF } from '../../lib/formatters.js'
import Card from '../ui/Card.jsx'

export default function BoostCheckoutCard({ product, plan }) {
  return (
    <Card className="p-5">
      <div className="flex gap-4">
        <img src={product.image} alt={product.title} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1"><h2 className="line-clamp-2 text-lg font-black text-fifow-dark">{product.title}</h2><p className="mt-1 text-sm font-semibold text-fifow-secondary">{product.location}</p><p className="mt-2 font-black text-fifow-primary">{formatGNF(product.price)}</p></div>
      </div>
      <div className="my-5 h-px bg-fifow-border" />
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase text-fifow-primary">Plan choisi</p><h3 className="mt-1 text-xl font-black text-fifow-dark">{plan.name}</h3></div><p className="text-xl font-black text-fifow-orange">{formatGNF(plan.price)}</p></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info icon={CalendarDays} label="Durée" value={formatDuration(plan.durationHours)} />
        <Info icon={MapPinned} label="Emplacement" value={placementLabel(plan.placement)} />
      </div>
    </Card>
  )
}

function Info({ icon: Icon, label, value }) {
  return <div className="rounded-lg bg-slate-50 p-3"><Icon className="h-5 w-5 text-fifow-primary" /><p className="mt-2 text-xs font-bold text-fifow-muted">{label}</p><p className="mt-0.5 text-sm font-black text-fifow-dark">{value}</p></div>
}

function formatDuration(hours) {
  const value = Number(hours || 0)
  return value < 24 ? `${value} h` : `${value / 24} jour${value / 24 > 1 ? 's' : ''}`
}

function placementLabel(value) {
  return ({ HOME_FEED: 'Accueil', SEARCH_RESULTS: 'Recherche', CATEGORY_PAGE: 'Catégorie', SIMILAR_PRODUCTS: 'Produits similaires' })[value] || value
}
