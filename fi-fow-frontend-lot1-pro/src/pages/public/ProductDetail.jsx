import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, ShieldCheck } from 'lucide-react'
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
      <div className="marketplace-container py-5 lg:py-7">
        <nav className="mb-4 flex items-center gap-2 text-sm font-semibold text-fifow-secondary">
          <Link to="/products" className="inline-flex items-center gap-2 transition hover:text-fifow-primary"><ArrowLeft className="h-4 w-4" /> Annonces</Link>
          <span>/</span><span className="truncate text-fifow-dark">{product.title}</span>
        </nav>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)] xl:grid-cols-[minmax(0,720px)_minmax(380px,1fr)] xl:gap-7">
          <ProductGallery product={product} />
          <aside className="space-y-4 lg:sticky lg:top-[92px]">
            <section className="flex rounded-lg border border-fifow-border bg-white p-5 shadow-card sm:p-6 lg:h-[400px] lg:flex-col xl:h-[440px]">
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{product.condition}</Badge>
                <Badge variant="neutral">{product.listingMode === 'STOCK' ? `${product.availableQuantity} disponible${product.availableQuantity > 1 ? 's' : ''}` : product.listingMode === 'LOT' ? 'Lot unique' : 'Article unique'}</Badge>
                {product.negotiable ? <Badge variant="primary">Négociable</Badge> : null}
                {product.boosted ? <Badge variant="boost">Annonce boostée</Badge> : null}
              </div>
              <h1 className="mt-4 text-2xl font-black leading-tight text-fifow-dark sm:text-[2rem]">{product.title}</h1>
              <p className="mt-2 text-3xl font-black text-fifow-primary">{formatGNF(product.price)}</p>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {product.location}</p>
              <div className="mt-5"><SellerPreviewCard seller={product.seller} /></div>
              <div className="mt-4 lg:mt-auto"><ProductActions product={product} /></div>
            </section>
            <section className="rounded-lg border border-fifow-border bg-white p-5">
              <h2 className="text-lg font-black text-fifow-dark">Description</h2>
              <p className={`mt-2 whitespace-pre-line text-sm font-medium leading-6 text-fifow-secondary ${descriptionOpen ? '' : 'line-clamp-5'}`}>{product.description}</p>
              {product.description?.length > 300 ? <button type="button" onClick={() => setDescriptionOpen((current) => !current)} className="mt-2 text-sm font-extrabold text-fifow-primary">{descriptionOpen ? 'Réduire' : 'Voir la description complète'}</button> : null}
            </section>
          </aside>
        </div>
        <section className="mt-7 flex items-start gap-3 rounded-lg border border-emerald-100 bg-fifow-mint p-4 lg:max-w-[720px]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-fifow-green" />
          <div><h2 className="font-extrabold text-fifow-dark">Paiement sécurisé</h2><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Gardez les échanges dans Fi Fow et confirmez la réception seulement après vérification.</p></div>
        </section>
        {suggestions.length ? <section className="mt-10"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="section-title">Produits similaires</h2><Link to={`/products?category=${product.category.slug}`} className="text-sm font-extrabold text-fifow-primary">Voir tout</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{suggestions.map((item) => <ProductCard key={item.id} product={item} />)}</div></section> : null}
      </div>
    </MainLayout>
  )
}

function DetailLoader() {
  return <MainLayout><AppHeader /><div className="marketplace-container grid animate-pulse gap-6 py-7 lg:grid-cols-2"><div className="aspect-[4/3] rounded-lg bg-slate-100" /><div className="h-[520px] rounded-lg bg-slate-100" /></div></MainLayout>
}

function DetailError({ onRetry }) {
  return <MainLayout><AppHeader /><div className="marketplace-container grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-2xl font-black text-fifow-dark">Annonce introuvable</h1><p className="mt-2 font-semibold text-fifow-secondary">Elle a peut-être été retirée ou vendue.</p><div className="mt-5 flex justify-center gap-3"><Button as={Link} to="/products" variant="secondary">Retour au catalogue</Button><Button onClick={onRetry}>Réessayer</Button></div></div></div></MainLayout>
}
