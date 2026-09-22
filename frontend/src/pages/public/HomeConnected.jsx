import { useQuery } from '@tanstack/react-query'
import { Heart, MapPin, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import CategoryPills from '../../components/marketplace/CategoryPills.jsx'
import { ConnectedHero } from '../../components/marketplace/HeroBanner.jsx'
import ProductSection from '../../components/marketplace/ProductSection.jsx'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'

export default function HomeConnected() {
  const boosted = useQuery({
    queryKey: queryKeys.products({ home: 'boosted' }),
    queryFn: () => catalogueApi.list({ boosted: true, limit: 6, sort: 'recent' }),
  })
  const recent = useQuery({
    queryKey: queryKeys.products({ home: 'recent' }),
    queryFn: () => catalogueApi.list({ limit: 18, sort: 'recent' }),
  })
  const recentItems = recent.data?.items || []

  return (
    <MainLayout connected>
      <AppHeader connected />
      <div className="desktop-container">
        <CategoryPills connected />
        <ConnectedHero />
        <QuickActions />
        {boosted.isError || recent.isError ? <FeedError onRetry={() => { boosted.refetch(); recent.refetch() }} /> : null}
        {boosted.isLoading || boosted.data?.items?.length ? <ProductSection title="Annonces boostées" products={boosted.data?.items} loading={boosted.isLoading} horizontal /> : null}
        {recent.isLoading || recentItems.length ? <ProductSection title="À découvrir" products={recentItems.slice(0, 6)} loading={recent.isLoading} horizontal icon={Sparkles} /> : <ProductSection title="Produits récents" products={[]} />}
        {recentItems.length > 6 ? <ProductSection title="Produits récents" products={recentItems.slice(6)} /> : null}
      </div>
    </MainLayout>
  )
}

function QuickActions() {
  const actions = [
    { label: 'Près de vous', to: '/products?sort=recent', icon: MapPin, tone: 'bg-violet-50 text-fifow-primary' },
    { label: 'Mes favoris', to: '/favorites', icon: Heart, tone: 'bg-rose-50 text-rose-600' },
    { label: 'Publier', to: '/products/new', icon: Plus, tone: 'bg-fifow-primary text-white' },
  ]
  return <section className="my-5 grid grid-cols-3 gap-3 sm:max-w-xl"><span className="sr-only">Raccourcis</span>{actions.map(({ label, to, icon: Icon, tone }) => <Link key={label} to={to} className="bento-card group flex min-h-24 flex-col justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><span className="mt-3 text-xs font-extrabold text-fifow-dark sm:text-sm">{label}</span></Link>)}</section>
}

function FeedError({ onRetry }) {
  return <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-800"><span>Le catalogue ne peut pas être chargé.</span><button type="button" onClick={onRetry} className="text-fifow-primary hover:underline">Réessayer</button></div>
}
