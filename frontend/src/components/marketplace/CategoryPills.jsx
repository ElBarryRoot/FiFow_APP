import { Car, Grid2X2, Home, Monitor, Package, Smartphone, Shirt } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCategories } from '../../hooks/useCatalogue.js'
import { cn } from '../../lib/utils.js'

const presentations = [
  { icon: Shirt, color: 'text-fifow-primary', bg: 'bg-fifow-lavender' },
  { icon: Smartphone, color: 'text-sky-600', bg: 'bg-sky-50' },
  { icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Car, color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: Monitor, color: 'text-violet-700', bg: 'bg-violet-50' },
]

export default function CategoryPills({ compact = false }) {
  const [searchParams] = useSearchParams()
  const categoriesQuery = useCategories()
  const activeCategory = searchParams.get('category')

  if (categoriesQuery.isLoading) {
    return <div className="flex gap-2 overflow-hidden py-3" aria-label="Chargement des catégories">{Array.from({ length: 5 }, (_, index) => <span key={index} className="h-11 w-32 shrink-0 animate-pulse rounded-lg bg-slate-100" />)}</div>
  }

  const categories = categoriesQuery.data || []
  return (
    <nav aria-label="Catégories" className="premium-scrollbar flex gap-2 overflow-x-auto py-3">
      {categories.map((category, index) => {
        const presentation = presentations[index % presentations.length]
        const Icon = presentation?.icon || Package
        return (
          <Link
            key={category.id}
            to={`/products?category=${encodeURIComponent(category.slug)}`}
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-extrabold transition-colors',
              activeCategory === category.slug
                ? 'border-fifow-primary bg-fifow-lavender text-fifow-primary'
                : 'border-fifow-border text-fifow-dark hover:border-violet-200 hover:bg-fifow-lavender',
              compact && 'h-10 px-3 text-xs',
            )}
          >
            <span className={cn('grid h-7 w-7 place-items-center rounded-md', presentation?.bg || 'bg-slate-50')}>
              <Icon className={cn('h-4 w-4', presentation?.color || 'text-fifow-dark')} />
            </span>
            {category.name}
          </Link>
        )
      })}
      <Link to="/products" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-fifow-border bg-white px-4 text-sm font-extrabold text-fifow-dark hover:bg-slate-50">
        <Grid2X2 className="h-4 w-4" /> Toutes
      </Link>
    </nav>
  )
}

