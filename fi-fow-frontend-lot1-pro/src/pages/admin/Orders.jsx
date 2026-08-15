import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'

const statuses = [
  'AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'RESERVED', 'PREPARING',
  'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED',
].map((value) => ({ value, label: adminStatusLabel(value) }))

export default function AdminOrders() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'orders', { search: debouncedSearch, status }],
    queryFn: ({ pageParam }) => adminApi.orders.list({ search: debouncedSearch, status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const columns = useMemo(() => [
    { key: 'reference', label: 'Commande', render: (row) => <div><p className="font-mono font-extrabold text-fifow-dark">{row.reference}</p><p className="text-xs text-fifow-muted">{productTitle(row)}</p></div> },
    { key: 'buyer', label: 'Acheteur', render: (row) => <Identity value={row.buyer} snapshot={row.buyerSnapshot} /> },
    { key: 'seller', label: 'Vendeur', render: (row) => <Identity value={row.seller} snapshot={row.sellerSnapshot} /> },
    { key: 'totalAmount', label: 'Total', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.totalAmount)}</span> },
    { key: 'handoverMode', label: 'Remise', render: (row) => handoverLabel(row.handoverMode) },
    { key: 'createdAt', label: 'Créée', render: (row) => formatAdminDate(row.createdAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <AdminPage eyebrow="Transactions marketplace" title="Commandes" description="Suivez le parcours complet d’une commande, du devis à la réception ou au litige.">
    <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Référence, acheteur ou vendeur" status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} rowLink={(row) => `/admin/orders/${row.id}`} mobileTitle={(row) => row.reference} mobileSubtitle={(row) => `${productTitle(row)} · ${formatAdminMoney(row.totalAmount)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune commande" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
  </AdminPage>
}

function Identity({ value, snapshot }) {
  const source = value || snapshot || {}
  return <div><p className="font-bold text-fifow-dark">{source.fullName || source.name || 'Utilisateur'}</p>{source.email ? <p className="text-xs text-fifow-muted">{source.email}</p> : null}</div>
}
function productTitle(row) { const count = row._count?.items || row.items?.length || 0; return count > 1 ? `${count} articles` : row.product?.title || row.productSnapshot?.title || 'Produit indisponible' }
function handoverLabel(value) { return ({ HAND_TO_HAND: 'Main propre', HOME_DELIVERY: 'Domicile', PICKUP_POINT: 'Point relais' })[value] || value || '—' }

export { handoverLabel, productTitle }
