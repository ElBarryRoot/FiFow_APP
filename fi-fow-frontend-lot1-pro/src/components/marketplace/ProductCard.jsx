import { Eye, Heart, MapPin, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Badge from '../ui/Badge.jsx'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'
import { formatGNF } from '../../lib/formatters.js'
import { cn } from '../../lib/utils.js'
import { useFavorites } from '../../lib/favorites.jsx'
import { useToast } from '../../lib/toast.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

export default function ProductCard({ product, compact = false, horizontal = false }) {
  const { isFavorite, toggle } = useFavorites()
  const showToast = useToast()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const favorite = isFavorite(product.id)

  function prefetchProduct() {
    const identifier = product.slug || product.id
    if (!identifier) return
    void queryClient.prefetchQuery({
      queryKey: queryKeys.product(identifier),
      queryFn: () => catalogueApi.detail(identifier),
      staleTime: 60_000,
    })
  }

  function handleFavorite(event) {
    event.preventDefault()
    event.stopPropagation()
    const added = toggle(product.id)
    if (added === null) return
    showToast(added ? 'Ajouté à vos favoris' : 'Retiré de vos favoris', { type: added ? 'success' : 'info' })
  }

  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      onMouseEnter={prefetchProduct}
      onFocus={prefetchProduct}
      className={cn(
        'group flex min-w-0 flex-col overflow-hidden rounded-lg border border-fifow-border bg-white shadow-card transition duration-200 hover:border-violet-200 hover:shadow-soft',
        horizontal && 'w-[78vw] max-w-[340px] shrink-0 sm:w-[320px] lg:w-auto lg:max-w-none',
      )}
    >
      <div className={cn('relative aspect-[4/3] overflow-hidden bg-slate-100', compact && 'aspect-[5/3]')}>
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = '/assets/empty-product.svg'
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5">
          {product.boosted ? <Badge icon={Zap} variant="boost">Boostée</Badge> : null}
          {product.negotiable ? <Badge variant="warning">Négociable</Badge> : null}
        </div>
        {auth.user?.id !== product.seller?.id ? <button
          type="button"
          onClick={handleFavorite}
          aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={favorite}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/80 bg-white/95 text-fifow-dark shadow-card backdrop-blur transition hover:text-fifow-red active:scale-95"
        >
          <Heart className={cn('h-5 w-5', favorite && 'fill-fifow-red text-fifow-red')} />
        </button> : null}
      </div>

      <div className="flex min-h-[150px] flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-fifow-dark sm:text-base">{product.title}</h3>
          {product.condition ? <span className="mt-0.5 shrink-0 text-[11px] font-bold text-fifow-muted">{product.condition}</span> : null}
        </div>
        <p className="mt-1 text-lg font-black text-fifow-primary sm:text-xl">{formatGNF(product.price)}</p>
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-fifow-muted">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{product.location}</span>
            </p>
            {product.views ? (
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-fifow-muted">
                <Eye className="h-3.5 w-3.5" /> {product.views}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex min-h-4 items-center justify-between gap-2">
            {product.seller?.verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-fifow-green">
                <ShieldCheck className="h-3.5 w-3.5" /> Vendeur vérifié
              </span>
            ) : <span />}
            {product.time ? <span className="text-[11px] font-semibold text-fifow-muted">{product.time}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
