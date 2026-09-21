import SectionHeader from '../ui/SectionHeader.jsx'
import ProductCard from './ProductCard.jsx'

export default function ProductSection({ title, products = [], horizontal = false, icon, loading = false }) {
  const skeletons = Array.from({ length: horizontal ? 3 : 6 }, (_, index) => (
    <div key={index} className="min-h-[280px] animate-pulse rounded-lg border border-fifow-border bg-white">
      <div className="aspect-[4/3] bg-slate-100" />
      <div className="space-y-3 p-4"><div className="h-4 w-4/5 rounded bg-slate-100" /><div className="h-6 w-2/5 rounded bg-slate-100" /></div>
    </div>
  ))
  if (horizontal) {
    return (
      <section className="mt-10">
        <SectionHeader title={title} icon={icon} showAll={loading || products.length > 0} />
        <div className="premium-scrollbar flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {loading ? skeletons : products.map((product) => <ProductCard key={product.id} product={product} horizontal />)}
          {!loading && !products.length ? <p className="py-8 text-sm font-semibold text-fifow-secondary">Aucune annonce disponible dans cette sélection.</p> : null}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-10">
      <SectionHeader title={title} icon={icon} showAll={loading || products.length > 0} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {loading ? skeletons : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {!loading && !products.length ? <p className="rounded-lg border border-dashed border-fifow-border bg-white px-5 py-10 text-center text-sm font-semibold text-fifow-secondary">Les prochaines annonces apparaîtront ici.</p> : null}
    </section>
  )
}
