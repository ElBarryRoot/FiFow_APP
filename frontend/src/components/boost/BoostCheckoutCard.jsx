import { CalendarDays, Eye, TrendingUp } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function BoostCheckoutCard({ product, plan }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex gap-4">
          <div className="relative">
            <img src={product.image} alt={product.title} className="h-28 w-28 rounded-2xl object-cover" />
            <span className="absolute bottom-2 left-2 rounded-xl bg-black/70 px-2 py-1 text-xs font-black text-white">{product.photosCount} photos</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-fifow-dark">{product.title}</h2>
            <p className="mt-1 font-semibold text-fifow-secondary">{product.condition}</p>
            <p className="mt-1 text-sm font-bold text-fifow-secondary">{product.location}</p>
            <p className="mt-3 text-xl font-black text-fifow-dark">{formatGNF(product.price)}</p>
          </div>
        </div>
      </Card>

      <Card className="border-fifow-primary p-5 ring-4 ring-violet-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-fifow-primary">Recommandé</p>
            <h3 className="mt-2 text-2xl font-black text-fifow-primary">{plan.name}</h3>
            <p className="mt-1 font-semibold text-fifow-secondary">{plan.description}</p>
          </div>
          <span className="h-7 w-7 rounded-full border-[7px] border-fifow-primary" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-fifow-lavender p-4"><CalendarDays className="h-6 w-6 text-fifow-primary" /><p className="mt-2 text-sm font-bold text-fifow-secondary">Durée</p><p className="font-black text-fifow-dark">{plan.duration}</p></div>
          <div className="rounded-2xl bg-fifow-lavender p-4"><Eye className="h-6 w-6 text-fifow-primary" /><p className="mt-2 text-sm font-bold text-fifow-secondary">Visibilité</p><p className="font-black text-fifow-dark">{plan.views}</p></div>
          <div className="rounded-2xl bg-emerald-50 p-4"><TrendingUp className="h-6 w-6 text-fifow-green" /><p className="mt-2 text-sm font-bold text-fifow-secondary">Priorité</p><p className="font-black text-fifow-dark">{plan.priority}</p></div>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div>
          <p className="text-xl font-black text-fifow-dark">Prix total</p>
          <p className="font-semibold text-fifow-secondary">Toutes taxes incluses</p>
        </div>
        <p className="text-3xl font-black text-fifow-primary">{formatGNF(plan.price)}</p>
      </Card>
    </div>
  )
}
