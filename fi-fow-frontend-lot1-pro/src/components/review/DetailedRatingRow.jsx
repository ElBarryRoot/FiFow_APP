import { MessageCircle, PackageCheck, ShieldCheck } from 'lucide-react'
import RatingStars from './RatingStars.jsx'

const icons = {
  communicationRating: MessageCircle,
  productAccuracyRating: ShieldCheck,
  behaviorRating: PackageCheck,
}

export default function DetailedRatingRow({ item, value, onChange }) {
  const Icon = icons[item.id] ?? MessageCircle

  return (
    <div className="grid gap-4 border-b border-fifow-border py-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h4 className="font-black text-fifow-dark">{item.title}</h4>
          <p className="text-sm font-semibold text-fifow-secondary">{item.description}</p>
        </div>
      </div>
      <RatingStars value={value} onChange={onChange} size="sm" />
    </div>
  )
}
