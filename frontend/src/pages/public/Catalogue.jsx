import { useEffect, useMemo, useState } from 'react'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import FilterBar from '../../components/marketplace/FilterBar.jsx'
import ProductCard from '../../components/marketplace/ProductCard.jsx'
import Button from '../../components/ui/Button.jsx'
import { products } from '../../data/products.js'

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filters = {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    location: searchParams.get('location') ?? '',
    condition: searchParams.get('condition') ?? '',
    negotiable: searchParams.get('negotiable') === '1',
    verified: searchParams.get('verified') === '1',
    sort: searchParams.get('sort') ?? 'relevance',
  }

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    const normalizedValue = typeof value === 'boolean' ? (value ? '1' : '') : value
    if (normalizedValue) next.set(key, normalizedValue)
    else next.delete(key)
    if (key !== 'sort') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  function clearFilters() {
    const query = filters.q
    setSearchParams(query ? { q: query } : {}, { replace: true })
  }

  const filteredProducts = useMemo(() => {
    const query = normalize(filters.q)
    const result = products.filter((product) => {
      const searchable = normalize(`${product.title} ${product.category} ${product.location}`)
      if (query && !searchable.includes(query)) return false
      if (filters.category && product.category !== filters.category) return false
      if (filters.location && !normalize(product.location).includes(normalize(filters.location))) return false
      if (filters.condition && product.condition !== filters.condition) return false
      if (filters.minPrice && product.price < Number(filters.minPrice)) return false
      if (filters.maxPrice && product.price > Number(filters.maxPrice)) return false
      if (filters.negotiable && !product.negotiable) return false
      if (filters.verified && !product.seller?.verified) return false
      return true
    })

    return [...result].sort((first, second) => {
      if (filters.sort === 'price-asc') return first.price - second.price
      if (filters.sort === 'price-desc') return second.price - first.price
      if (filters.sort === 'recent') return products.indexOf(second) - products.indexOf(first)
      return Number(second.boosted) - Number(first.boosted)
    })
  }, [filters])

  const activeFilterCount = ['category', 'minPrice', 'maxPrice', 'location', 'condition']
    .filter((key) => filters[key]).length + Number(filters.negotiable) + Number(filters.verified)

  return (
    <MainLayout connected>
      <AppHeader
        connected
        onFilters={() => setFiltersOpen(true)}
        searchDefaultValue={filters.q}
        onSearch={(query) => updateFilter('q', query)}
      />

      <div className="marketplace-container py-6 lg:py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-fifow-primary">Marketplace</p>
            <h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">
              {filters.q ? `Résultats pour “${filters.q}”` : 'Toutes les annonces'}
            </h1>
            <p className="mt-1 text-sm font-semibold text-fifow-secondary">{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)} className="lg:hidden">
              Filtres {activeFilterCount ? `(${activeFilterCount})` : ''}
            </Button>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-fifow-border bg-white px-3 text-sm font-semibold text-fifow-secondary">
              <span className="hidden sm:inline">Trier par</span>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="bg-transparent font-extrabold text-fifow-dark outline-none">
                <option value="relevance">Pertinence</option>
                <option value="recent">Plus récent</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="sticky top-[92px] hidden lg:block">
            <FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
          </aside>

          <section aria-live="polite">
            {filteredProducts.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-fifow-border bg-white px-6 text-center">
                <div>
                  <SearchX className="mx-auto h-12 w-12 text-fifow-muted" />
                  <h2 className="mt-4 text-xl font-black text-fifow-dark">Aucune annonce trouvée</h2>
                  <p className="mt-2 text-sm font-semibold text-fifow-secondary">Essayez une autre recherche ou retirez certains filtres.</p>
                  <Button onClick={clearFilters} variant="secondary" className="mt-5">Réinitialiser les filtres</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Fermer les filtres" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" />
          <div className="absolute inset-y-0 right-0 w-[min(92vw,390px)] overflow-y-auto bg-fifow-bg p-3 shadow-2xl">
            <FilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} onClose={() => setFiltersOpen(false)} />
            <Button className="mt-3 w-full" onClick={() => setFiltersOpen(false)}>
              Voir {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      ) : null}
    </MainLayout>
  )
}
