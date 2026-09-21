import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Boxes, Gift, Layers3, MapPin, PackageCheck, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import ProductActions from '../../components/marketplace/ProductActions.jsx'
import ProductGallery from '../../components/marketplace/ProductGallery.jsx'
import ProductCard from '../../components/marketplace/ProductCard.jsx'
import SellerPreviewCard from '../../components/marketplace/SellerPreviewCard.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { listingAvailabilityDescription, listingAvailabilityLabel } from '../../lib/listingAvailability.js'

export default function ProductDetail() {
  const { id: slug } = useParams()
  const viewedProducts = useRef(new Set())
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const productQuery = useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => catalogueApi.detail(slug),
    enabled: Boolean(slug),
  })
  const product = productQuery.data
  const similarQuery = useQuery({
    queryKey: queryKeys.similarProducts(product?.id),
    queryFn: () => catalogueApi.similar(product.id, 4),
    enabled: Boolean(product?.id),
  })

  useEffect(() => {
    if (!product?.id || viewedProducts.current.has(product.id)) return
    viewedProducts.current.add(product.id)
    catalogueApi.view(product.id).catch(() => undefined)
  }, [product?.id])

  if (productQuery.isLoading) return <DetailLoader />
  if (productQuery.isError || !product) return <DetailError onRetry={productQuery.refetch} />
  const suggestions = similarQuery.data || []

  return (
    <MainLayout>
      <AppHeader />
      <div className="marketplace-container py-3 sm:py-5 lg:py-7">
        <nav className="mb-3 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-fifow-secondary sm:mb-4 sm:gap-2 sm:text-sm">
          <Link to="/products" className="inline-flex items-center gap-2 transition hover:text-fifow-primary"><ArrowLeft className="h-4 w-4" /> Annonces</Link>
          <span>/</span><span className="truncate text-fifow-dark">{product.title}</span>
        </nav>
        <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)] xl:grid-cols-[minmax(0,720px)_minmax(380px,1fr)] xl:gap-7">
          <ProductGallery product={product} />
          <aside className="space-y-4 lg:sticky lg:top-[92px]">
            <section className="rounded-lg border border-fifow-border bg-white p-4 shadow-card sm:p-6 lg:min-h-[400px] xl:min-h-[440px]">
              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-7">
                <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                <Badge variant="success">{product.condition}</Badge>
                {product.negotiable ? <Badge variant="primary">Négociable</Badge> : null}
                {product.boosted ? <Badge variant="boost">Annonce boostée</Badge> : null}
              </div>
              <h1 className="mt-3 break-words text-lg font-black leading-tight text-fifow-dark sm:mt-4 sm:text-xl lg:text-[2rem]">{product.title}</h1>
              <p className="mt-1.5 break-words text-xl font-black leading-tight text-fifow-primary sm:mt-2 sm:text-2xl lg:text-3xl">{formatGNF(product.price)}</p>
              <ListingAvailability product={product} />
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {product.location}</p>
                </div>
                <div className="mt-4 lg:mt-0 lg:h-full lg:self-stretch">
                  <SellerPreviewCard seller={product.seller} featured />
                </div>
              </div>
              <div className="mt-4 lg:mt-8"><ProductActions product={product} /></div>
            </section>
            <section className="hidden rounded-lg border border-fifow-border bg-white p-5">
              <h2 className="text-lg font-black text-fifow-dark">Description</h2>
              <p className={`mt-2 whitespace-pre-line text-sm font-medium leading-6 text-fifow-secondary ${descriptionOpen ? '' : 'line-clamp-5'}`}>{product.description}</p>
              {product.description?.length > 300 ? <button type="button" onClick={() => setDescriptionOpen((current) => !current)} className="mt-2 text-sm font-extrabold text-fifow-primary">{descriptionOpen ? 'Réduire' : 'Voir la description complète'}</button> : null}
            </section>
          </aside>
        </div>
        <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
          <section className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-fifow-mint p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-fifow-green" />
            <div><h2 className="font-extrabold text-fifow-dark">{product.listingMode === 'DONATION' ? 'Don encadré par Fi Fow' : 'Paiement sécurisé'}</h2><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{product.listingMode === 'DONATION' ? 'Aucun paiement demandé. Gardez les échanges dans Fi Fow et convenez de la remise avec le vendeur.' : 'Gardez les échanges dans Fi Fow et confirmez la réception seulement après vérification.'}</p></div>
          </section>
          <section className="rounded-lg border border-fifow-border bg-white p-5">
            <h2 className="text-lg font-black text-fifow-dark">Description</h2>
            <p className={`mt-2 whitespace-pre-line text-sm font-medium leading-6 text-fifow-secondary ${descriptionOpen ? '' : 'line-clamp-5'}`}>{product.description}</p>
            {product.description?.length > 300 ? <button type="button" onClick={() => setDescriptionOpen((current) => !current)} className="mt-2 text-sm font-extrabold text-fifow-primary">{descriptionOpen ? 'Réduire' : 'Voir la description complète'}</button> : null}
          </section>
        </div>
        <section className="!hidden mt-7 flex items-start gap-3 rounded-lg border border-emerald-100 bg-fifow-mint p-4 lg:max-w-[720px]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-fifow-green" />
          <div><h2 className="font-extrabold text-fifow-dark">{product.listingMode === 'DONATION' ? 'Don encadré par Fi Fow' : 'Paiement sécurisé'}</h2><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{product.listingMode === 'DONATION' ? 'Aucun paiement n’est demandé. Gardez les échanges dans Fi Fow et convenez de la remise avec le vendeur.' : 'Gardez les échanges dans Fi Fow et confirmez la réception seulement après vérification.'}</p></div>
        </section>
        {suggestions.length ? <section className="mt-10"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="section-title">Produits similaires</h2><Link to={`/products?category=${product.category.slug}`} className="text-sm font-extrabold text-fifow-primary">Voir tout</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{suggestions.map((item) => <ProductCard key={item.id} product={item} />)}</div></section> : null}
      </div>
    </MainLayout>
  )
}

function ListingAvailability({ product }) {
  const Icon = product.listingMode === 'DONATION'
    ? Gift
    : product.listingMode === 'LOT'
    ? Layers3
    : product.listingMode === 'STOCK'
      ? Boxes
      : PackageCheck

  return (
    <div className="mt-4 flex w-full items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 lg:max-w-[360px]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-fifow-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-fifow-dark">{listingAvailabilityLabel(product)}</p>
        <p className="mt-0.5 text-xs font-semibold text-fifow-secondary">{listingAvailabilityDescription(product)}</p>
      </div>
    </div>
  )
}

function DetailLoader() {
  return <MainLayout><AppHeader /><div className="marketplace-container grid animate-pulse gap-6 py-7 lg:grid-cols-2"><div className="aspect-[4/3] rounded-lg bg-slate-100" /><div className="h-[520px] rounded-lg bg-slate-100" /></div></MainLayout>
}

function DetailError({ onRetry }) {
  return <MainLayout><AppHeader /><div className="marketplace-container grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-2xl font-black text-fifow-dark">Annonce introuvable</h1><p className="mt-2 font-semibold text-fifow-secondary">Elle a peut-être été retirée ou vendue.</p><div className="mt-5 flex justify-center gap-3"><Button as={Link} to="/products" variant="secondary">Retour au catalogue</Button><Button onClick={onRetry}>Réessayer</Button></div></div></div></MainLayout>
}
