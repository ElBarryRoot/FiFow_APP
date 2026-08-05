import { useQuery } from '@tanstack/react-query'
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
        {boosted.isError || recent.isError ? <FeedError onRetry={() => { boosted.refetch(); recent.refetch() }} /> : null}
        {boosted.isLoading || boosted.data?.items?.length ? <ProductSection title="Annonces boostées" products={boosted.data?.items} loading={boosted.isLoading} horizontal /> : null}
        <ProductSection title="Produits récents" products={recent.data?.items} loading={recent.isLoading} />
      </div>
    </MainLayout>
  )
}

function FeedError({ onRetry }) {
  return <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-800"><span>Le catalogue ne peut pas être chargé.</span><button type="button" onClick={onRetry} className="text-fifow-primary hover:underline">Réessayer</button></div>
}
