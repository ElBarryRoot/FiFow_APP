import { Star } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function RatingStars({ value, onChange, size = 'lg', label }) {
  const sizes = size === 'sm' ? 'h-7 w-7' : 'h-11 w-11'

  return (
    <div className="text-center">
      <div className="flex justify-center gap-2 sm:gap-3" role="radiogroup" aria-label="Note sur cinq étoiles">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={rating === value}
            onClick={() => onChange(rating)}
            className="rounded-lg p-1 transition hover:bg-fifow-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifow-primary focus-visible:ring-offset-2"
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
