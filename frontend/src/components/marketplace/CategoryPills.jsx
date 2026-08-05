import { categories } from '../../data/categories.js'
import { cn } from '../../lib/utils.js'
import { Link, useSearchParams } from 'react-router-dom'

export default function CategoryPills({ connected = false, compact = false }) {
  const [searchParams] = useSearchParams()
  const activeCategory = searchParams.get('category')

  return (
    <nav aria-label="Catégories" className="premium-scrollbar flex gap-2 overflow-x-auto py-3">
      {categories
        .filter((category) => connected || !category.connectedOnly)
        .map((category) => (
          <Link
            key={category.id}
            to={category.id === 'plus' ? '/products' : `/products?category=${encodeURIComponent(category.label)}`}
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-extrabold transition-colors',
              activeCategory === category.label
                ? 'border-fifow-primary bg-fifow-lavender text-fifow-primary'
                : 'border-fifow-border text-fifow-dark hover:border-violet-200 hover:bg-fifow-lavender',
              compact && 'h-10 px-3 text-xs',
            )}
          >
            <span className={cn('grid h-7 w-7 place-items-center rounded-md', category.bg)}>
              <category.icon className={cn('h-4 w-4', category.color)} />
            </span>
            {category.label}
          </Link>
        ))}
    </nav>
  )
}
