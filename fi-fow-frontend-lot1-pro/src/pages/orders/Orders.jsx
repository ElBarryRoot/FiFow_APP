import { useInfiniteQuery } from '@tanstack/react-query'
import { PackageCheck, ShoppingBag, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '../../api/orders.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import Button from '../../components/ui/Button.jsx'
import OrderSummaryCard from '../../components/user/OrderSummaryCard.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { cn } from '../../lib/utils.js'

const tabs = [
  { id: 'buyer', label: 'Mes achats', icon: ShoppingBag },
  { id: 'seller', label: 'Mes ventes', icon: Store },
  { id: 'all', label: 'Toutes', icon: PackageCheck },
]

export default function Orders() {
  const auth = useAuth()
  const [role, setRole] = useState('buyer')
  const ordersQuery = useInfiniteQuery({
    queryKey: queryKeys.orderList({ role }),
    queryFn: ({ pageParam }) => ordersApi.list({ role, cursor: pageParam, limit: 20, userId: auth.user.id }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const orders = useMemo(() => ordersQuery.data?.pages.flatMap((page) => page.items) || [], [ordersQuery.data])

  return (
    <UserPageShell title="Commandes" eyebrow="Achats et ventes" subtitle="Suivez chaque transaction depuis la confirmation jusqu’à la remise et à l’avis.">
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-lg border border-fifow-border bg-white p-1" role="tablist" aria-label="Type de commandes">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = role === tab.id
          return (
            <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => setRole(tab.id)} className={cn('flex h-11 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-sm font-black transition', active ? 'bg-fifow-primary text-white' : 'text-fifow-secondary hover:bg-slate-50 hover:text-fifow-dark')}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {ordersQuery.isLoading ? <LoadingBlock label="Chargement des commandes" rows={3} /> : null}
      {ordersQuery.isError ? <ErrorBlock title="Commandes indisponibles" message="La liste ne peut pas être synchronisée pour le moment." onRetry={ordersQuery.refetch} /> : null}
      {!ordersQuery.isLoading && !ordersQuery.isError && !orders.length ? (
        <EmptyBlock
          title={role === 'seller' ? 'Aucune vente pour le moment' : 'Aucune commande pour le moment'}
          message={role === 'seller' ? 'Les nouvelles commandes apparaîtront ici après confirmation d’un acheteur.' : 'Vos prochains achats seront suivis ici, étape par étape.'}
          action={role === 'seller' ? <Button as={Link} to="/profile/listings" variant="secondary">Voir mes annonces</Button> : <Button as={Link} to="/products">Explorer les annonces</Button>}
        />
      ) : null}
      {orders.length ? <div className="space-y-4">{orders.map((order) => <OrderSummaryCard key={order.id} order={order} />)}</div> : null}
      {ordersQuery.hasNextPage ? <div className="mt-6 text-center"><Button type="button" variant="secondary" loading={ordersQuery.isFetchingNextPage} onClick={() => ordersQuery.fetchNextPage()}>Charger plus de commandes</Button></div> : null}
    </UserPageShell>
  )
}
