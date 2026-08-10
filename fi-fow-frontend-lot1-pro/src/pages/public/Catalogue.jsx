import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import FilterBar from '../../components/marketplace/FilterBar.jsx'
import ProductCard from '../../components/marketplace/ProductCard.jsx'
import Button from '../../components/ui/Button.jsx'

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const loadMoreRef = useRef(null)
  const filters = useMemo(() => ({
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    location: searchParams.get('location') ?? '',
    condition: searchParams.get('condition') ?? '',
    negotiable: searchParams.get('negotiable') === '1',
    verified: searchParams.get('verified') === '1',
    sort: searchParams.get('sort') ?? 'recent',
  }), [searchParams])

  const apiFilters = useMemo(() => ({
    search: filters.q.length >= 2 ? filters.q : undefined,
    category: filters.category || undefined,
    minPrice: filters.minPrice.length >= 3 ? filters.minPrice : undefined,
    maxPrice: filters.maxPrice.length >= 3 ? filters.maxPrice : undefined,
    commune: filters.location || undefined,
    condition: filters.condition || undefined,
    negotiable: filters.negotiable ? true : undefined,
    verified: filters.verified ? true : undefined,
    sort: filters.sort,
    limit: 24,
  }), [filters])

  const productsQuery = useInfiniteQuery({
    queryKey: queryKeys.products(apiFilters),
    queryFn: ({ pageParam }) => catalogueApi.list({ ...apiFilters, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const products = productsQuery.data?.pages.flatMap((page) => page.items) || []

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !productsQuery.hasNextPage || productsQuery.isFetchingNextPage || !('IntersectionObserver' in window)) return undefined

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) productsQuery.fetchNextPage()
    }, { rootMargin: '480px 0px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [productsQuery.fetchNextPage, productsQuery.hasNextPage, productsQuery.isFetchingNextPage])

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    const normalizedValue = typeof value === 'boolean' ? (value ? '1' : '') : value
    if (normalizedValue) next.set(key, normalizedValue)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  function clearFilters() {
    setSearchParams(filters.q ? { q: filters.q } : {}, { replace: true })
  }

  const activeFilterCount = ['category', 'minPrice', 'maxPrice', 'location', 'condition']
    .filter((key) => filters[key]).length + Number(filters.negotiable) + Number(filters.verified)

  return (
    <MainLayout>
      <AppHeader onFilters={() => setFiltersOpen(true)} searchDefaultValue={filters.q} onSearch={(query) => updateFilter('q', query)} />
      <div className="marketplace-container py-6 lg:py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="page-eyebrow">Marketplace</p>
            <h1 className="page-title mt-1">{filters.q ? `Résultats pour “${filters.q}”` : 'Toutes les annonces'}</h1>
            <p className="mt-1 text-sm font-medium text-fifow-secondary">{products.length} annonce{products.length > 1 ? 's' : ''} affichée{products.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)} className="lg:hidden">Filtres {activeFilterCount ? `(${activeFilterCount})` : ''}</Button>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-fifow-border bg-white px-3 text-sm font-semibold text-fifow-secondary">
              <span className="hidden sm:inline">Trier par</span>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="bg-transparent font-extrabold text-fifow-dark outline-none">
                <option value="recent">Plus récent</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="sticky top-[92px] hidden lg:block"><FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} /></aside>
          <section aria-live="polite" aria-busy={productsQuery.isLoading || productsQuery.isFetchingNextPage}>
            {productsQuery.isLoading ? <ProductGridSkeleton /> : null}
            {productsQuery.isError ? <ErrorState onRetry={productsQuery.refetch} /> : null}
            {!productsQuery.isLoading && !productsQuery.isError && products.length ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
                {productsQuery.hasNextPage ? <div ref={loadMoreRef} className="mt-7 flex justify-center"><Button variant="secondary" loading={productsQuery.isFetchingNextPage} onClick={() => productsQuery.fetchNextPage()}>Afficher plus d’annonces</Button></div> : null}
              </>
            ) : null}
            {!productsQuery.isLoading && !productsQuery.isError && !products.length ? <EmptyState onClear={clearFilters} /> : null}
          </section>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Fermer les filtres" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" />
          <div className="absolute inset-y-0 right-0 w-[min(92vw,390px)] overflow-y-auto bg-fifow-bg p-3 shadow-2xl">
            <FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} onClose={() => setFiltersOpen(false)} />
            <Button className="mt-3 w-full" onClick={() => setFiltersOpen(false)}>Voir les résultats</Button>
          </div>
        </div>
      ) : null}
    </MainLayout>
  )
}

function ProductGridSkeleton() {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="min-h-[300px] animate-pulse overflow-hidden rounded-lg border border-fifow-border bg-white"><div className="aspect-[4/3] bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 rounded bg-slate-100" /><div className="h-6 w-1/2 rounded bg-slate-100" /></div></div>)}</div>
}

function ErrorState({ onRetry }) {
  return <div role="alert" className="grid min-h-[420px] place-items-center rounded-lg border border-red-100 bg-red-50 px-6 text-center"><div><SearchX className="mx-auto h-12 w-12 text-fifow-red" /><h2 className="mt-4 text-xl font-black text-fifow-dark">Catalogue indisponible</h2><p className="mt-2 text-sm font-semibold text-fifow-secondary">Vérifiez que l’API Fi Fow est démarrée.</p><Button onClick={onRetry} className="mt-5">Réessayer</Button></div></div>
}

function EmptyState({ onClear }) {
  return <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-fifow-border bg-white px-6 text-center"><div><SearchX className="mx-auto h-12 w-12 text-fifow-muted" /><h2 className="mt-4 text-xl font-black text-fifow-dark">Aucune annonce trouvée</h2><p className="mt-2 text-sm font-semibold text-fifow-secondary">Essayez une autre recherche ou retirez certains filtres.</p><Button onClick={onClear} variant="secondary" className="mt-5">Réinitialiser les filtres</Button></div></div>
}
