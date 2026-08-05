import { Star } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function RatingStars({ value, onChange, size = 'lg', label }) {
  const sizes = size === 'sm' ? 'h-7 w-7' : 'h-11 w-11'

  return (
    <div className="text-center">
      <div className="flex justify-center gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="rounded-xl p-1 transition hover:bg-fifow-lavender"
            aria-label={`${rating} étoile${rating > 1 ? 's' : ''}`}
          >
            <Star className={cn(sizes, rating <= value ? 'fill-fifow-orange text-fifow-orange' : 'text-fifow-primary')} />
          </button>
        ))}
      </div>
      {label ? <p className="mt-2 text-sm font-semibold text-fifow-secondary">{label}</p> : null}
    </div>
  )
}
