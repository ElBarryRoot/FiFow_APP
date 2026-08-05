import { useState } from 'react'
import { ArrowLeft, MapPin, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import ProductActions from '../../components/marketplace/ProductActions.jsx'
import ProductGallery from '../../components/marketplace/ProductGallery.jsx'
import ProductCard from '../../components/marketplace/ProductCard.jsx'
import SellerPreviewCard from '../../components/marketplace/SellerPreviewCard.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { products, similarProducts } from '../../data/products.js'
import { formatGNF } from '../../lib/formatters.js'

export default function ProductDetail() {
  const { id } = useParams()
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const product = [...products, ...similarProducts].find((item) => item.id === id)

  if (!product) return <Navigate to="/products" replace />

  const seller = product.seller ?? products[0].seller
  const suggestions = [...products, ...similarProducts].filter((item) => item.id !== product.id).slice(0, 4)
  const description = product.description ?? 'Ce produit est disponible à Conakry. Contactez le vendeur pour obtenir davantage de détails sur son état, ses accessoires et les modalités de remise.'

  return (
    <MainLayout connected>
      <AppHeader connected />
      <div className="marketplace-container py-5 lg:py-7">
        <nav className="mb-4 flex items-center gap-2 text-sm font-semibold text-fifow-secondary">
          <Link to="/products" className="inline-flex items-center gap-2 transition hover:text-fifow-primary"><ArrowLeft className="h-4 w-4" /> Annonces</Link>
          <span>/</span>
          <span className="truncate text-fifow-dark">{product.title}</span>
        </nav>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(370px,0.75fr)] xl:gap-7">
          <ProductGallery product={product} />

          <aside className="space-y-4 lg:sticky lg:top-[92px]">
            <section className="rounded-lg border border-fifow-border bg-white p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap gap-2">
                {product.condition ? <Badge variant="success">{product.condition}</Badge> : null}
                {product.negotiable ? <Badge variant="primary">Négociable</Badge> : null}
                {product.boosted ? <Badge variant="boost">Annonce boostée</Badge> : null}
              </div>
              <h1 className="mt-4 text-2xl font-black leading-tight text-fifow-dark sm:text-3xl">{product.title}</h1>
              <p className="mt-2 text-3xl font-black text-fifow-primary">{formatGNF(product.price)}</p>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary">
                <MapPin className="h-4 w-4 text-fifow-primary" /> {product.detailLocation ?? product.location}
              </p>
              <div className="mt-5"><SellerPreviewCard seller={seller} /></div>
              <div className="mt-4"><ProductActions product={product} /></div>
            </section>

            <section className="rounded-lg border border-fifow-border bg-white p-5">
              <h2 className="text-lg font-black text-fifow-dark">Description</h2>
              <p className={`mt-2 text-sm font-medium leading-6 text-fifow-secondary ${descriptionOpen ? '' : 'line-clamp-4'}`}>{description}</p>
              <button type="button" onClick={() => setDescriptionOpen((current) => !current)} className="mt-2 text-sm font-extrabold text-fifow-primary">
                {descriptionOpen ? 'Réduire' : 'Voir la description complète'}
              </button>
            </section>
          </aside>
        </div>

        <section className="mt-7 flex items-start gap-3 rounded-lg border border-emerald-100 bg-fifow-mint p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-fifow-green" />
          <div>
            <h2 className="font-extrabold text-fifow-dark">Achetez avec attention</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Vérifiez le produit avant la remise et conservez vos échanges dans Fi Fow.</p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="section-title">Produits similaires</h2>
            <Link to="/products" className="text-sm font-extrabold text-fifow-primary">Voir tout</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {suggestions.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
