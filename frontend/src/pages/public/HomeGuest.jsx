import { useQuery } from '@tanstack/react-query'
import { MessageCircleMore, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import CategoryPills from '../../components/marketplace/CategoryPills.jsx'
import { GuestHero } from '../../components/marketplace/HeroBanner.jsx'
import ProductSection from '../../components/marketplace/ProductSection.jsx'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'

export default function HomeGuest() {
  const boosted = useQuery({
    queryKey: queryKeys.products({ home: 'boosted' }),
    queryFn: () => catalogueApi.list({ boosted: true, limit: 6, sort: 'recent' }),
  })
  const recent = useQuery({
    queryKey: queryKeys.products({ home: 'recent' }),
    queryFn: () => catalogueApi.list({ limit: 12, sort: 'recent' }),
  })

  return (
    <MainLayout>
      <AppHeader />
      <div className="desktop-container">
        <CategoryPills />
        <GuestHero />
        <TrustHighlights />
        {boosted.isError || recent.isError ? <FeedError onRetry={() => { boosted.refetch(); recent.refetch() }} /> : null}
        {boosted.isLoading || boosted.data?.items?.length ? <ProductSection title="Annonces boostées" products={boosted.data?.items} loading={boosted.isLoading} horizontal /> : null}
        <ProductSection title="Produits récents" products={recent.data?.items} loading={recent.isLoading} />
      </div>
    </MainLayout>
  )
}

function FeedError({ onRetry }) {
  return <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm font-bold text-red-800 shadow-soft"><span>Le catalogue ne peut pas être chargé.</span><button type="button" onClick={onRetry} className="text-fifow-primary hover:underline">Réessayer</button></div>
}

function TrustHighlights() {
  const items = [
    { icon: ShieldCheck, title: 'Achetez en confiance', text: 'Échangez et suivez vos achats dans Fi Fow.', to: '/products' },
    { icon: MessageCircleMore, title: 'Discutez simplement', text: 'Posez vos questions au vendeur avant de décider.', to: '/products' },
    { icon: Sparkles, title: 'Des trouvailles près de vous', text: 'Découvrez les annonces les plus récentes.', to: '/products?sort=recent' },
  ]

  return (
    <section aria-label="Les avantages Fi Fow" className="my-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
      {items.map(({ icon: Icon, title, text, to }) => (
        <Link key={title} to={to} className="bento-card group flex min-h-28 items-start gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifow-primary focus-visible:ring-offset-2">
          <span className="soft-surface grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-fifow-primary"><Icon className="h-5 w-5" /></span>
          <span><span className="block text-sm font-black text-fifow-dark">{title}</span><span className="mt-1 block text-xs font-semibold leading-5 text-fifow-secondary">{text}</span></span>
        </Link>
      ))}
    </section>
  )
}
