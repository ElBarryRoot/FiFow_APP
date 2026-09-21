import { useInfiniteQuery } from '@tanstack/react-query'
import { Rocket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { boostsApi } from '../../api/boosts.js'
import { queryKeys } from '../../api/queryKeys.js'
import BoostPerformanceCard from '../../components/boost/BoostPerformanceCard.jsx'
import BoostTabs from '../../components/boost/BoostTabs.jsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import Button from '../../components/ui/Button.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

const tabDefinitions = [
  { id: 'active', label: 'Actifs', statuses: ['ACTIVE'] },
  { id: 'pending', label: 'En attente', statuses: ['PENDING_PAYMENT'] },
  { id: 'history', label: 'Historique', statuses: ['EXPIRED', 'CANCELLED', 'REFUNDED', 'REJECTED'] },
]

export default function MyBoosts() {
  const [activeTab, setActiveTab] = useState('active')
  const boostsQuery = useInfiniteQuery({
    queryKey: queryKeys.myBoosts({}),
    queryFn: ({ pageParam }) => boostsApi.mine({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const boosts = useMemo(() => boostsQuery.data?.pages.flatMap((page) => page.items) || [], [boostsQuery.data])
  const tabs = tabDefinitions.map((tab) => ({ ...tab, count: boosts.filter((boost) => tab.statuses.includes(boost.status)).length }))
  const selectedTab = tabDefinitions.find((tab) => tab.id === activeTab) || tabDefinitions[0]
  const visibleBoosts = boosts.filter((boost) => selectedTab.statuses.includes(boost.status))

  return (
    <UserPageShell title="Mes boosts" eyebrow="Visibilité des annonces" subtitle="Suivez les activations, échéances et résultats réellement disponibles." backTo="/profile/listings" backLabel="Retour aux annonces" actions={<Button as={Link} to="/boost/plans" size="sm" icon={Rocket}>Nouveau boost</Button>}>
      <BoostTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="mt-6">
        {boostsQuery.isLoading ? <LoadingBlock label="Chargement des boosts" rows={3} /> : null}
        {boostsQuery.isError ? <ErrorBlock title="Boosts indisponibles" message="Votre historique ne peut pas être synchronisé." onRetry={boostsQuery.refetch} /> : null}
        {!boostsQuery.isLoading && !boostsQuery.isError && !visibleBoosts.length ? <EmptyBlock title={activeTab === 'active' ? 'Aucun boost actif' : activeTab === 'pending' ? 'Aucun paiement en attente' : 'Aucun boost terminé'} message={activeTab === 'active' ? 'Choisissez une annonce disponible et un plan pour commencer.' : 'Les boosts correspondants apparaîtront ici.'} action={activeTab === 'active' ? <Button as={Link} to="/boost/plans" icon={Rocket}>Choisir un plan</Button> : null} /> : null}
        {visibleBoosts.length ? <div className="grid gap-4 xl:grid-cols-2">{visibleBoosts.map((boost) => <BoostPerformanceCard key={boost.id} boost={boost} />)}</div> : null}
        {boostsQuery.hasNextPage ? <div className="mt-6 text-center"><Button type="button" variant="secondary" loading={boostsQuery.isFetchingNextPage} onClick={() => boostsQuery.fetchNextPage()}>Charger plus</Button></div> : null}
      </div>
    </UserPageShell>
  )
}
