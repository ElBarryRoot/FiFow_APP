import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils.js'

export default function Logo({ compact = false, className }) {
  return (
    <Link to="/" className={cn('inline-flex shrink-0 items-center', className)} aria-label="Fi Fow, accueil">
      <span className={cn('relative block overflow-hidden', compact ? 'h-12 w-12 rounded-lg' : 'h-12 w-32')}>
        <img
          src="/assets/logo_2.png"
          alt="Fi Fow"
          className={cn(
            'absolute max-w-none',
            compact ? 'left-1 -top-9 w-32' : 'left-0 -top-[34px] w-32',
          )}
        />
      </span>
    </Link>
  )
}
