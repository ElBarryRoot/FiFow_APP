import { ArrowRight, CalendarDays, CheckCircle2, MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatGNF } from '../../lib/formatters.js'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

const placementLabels = {
  HOME_FEED: 'Accueil marketplace',
  SEARCH_RESULTS: 'Résultats de recherche',
  CATEGORY_PAGE: 'Page de catégorie',
  SIMILAR_PRODUCTS: 'Produits similaires',
}

export default function BoostPlanCard({ plan, productSlug }) {
  const duration = formatDuration(plan.durationHours)
  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-orange-50 text-fifow-orange"><CalendarDays className="h-6 w-6" /></span>
        <p className="text-2xl font-black text-fifow-orange">{formatGNF(plan.price)}</p>
      </div>
      <h2 className="mt-5 text-xl font-black text-fifow-dark">{plan.name}</h2>
      <div className="mt-4 space-y-3 text-sm font-semibold text-fifow-secondary">
        <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-fifow-green" /> Durée : <strong className="text-fifow-dark">{duration}</strong></p>
        <p className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-fifow-primary" /> Emplacement : <strong className="text-fifow-dark">{placementLabels[plan.placement] || plan.placement}</strong></p>
      </div>
      <p className="mt-4 flex-1 text-sm font-semibold leading-6 text-fifow-secondary">Votre annonce est mise en avant sur l’emplacement sélectionné pendant toute la durée du plan.</p>
      {productSlug ? <Button as={Link} to={`/products/${encodeURIComponent(productSlug)}/boost/checkout?planId=${encodeURIComponent(plan.id)}`} icon={ArrowRight} className="mt-5 w-full">Choisir ce plan</Button> : <Button as={Link} to="/profile/listings" variant="secondary" className="mt-5 w-full">Choisir une annonce</Button>}
    </Card>
  )
}

function formatDuration(hours) {
  const value = Number(hours || 0)
  if (value < 24) return `${value} h`
  const days = value / 24
  return `${days} jour${days > 1 ? 's' : ''}`
}
