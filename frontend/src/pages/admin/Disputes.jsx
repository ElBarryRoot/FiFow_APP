import { useInfiniteQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { adminApi } from '../../api/admin.js'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'
import { queryKeys } from '../../api/queryKeys.js'

const statuses = [
  { value: 'OPEN', label: 'Nouveaux' },
  { value: 'UNDER_REVIEW', label: 'En examen' },
  { value: 'WAITING_FOR_USER', label: 'En attente du client' },
  { value: 'RESOLVED', label: 'Résolus' },
  { value: 'REJECTED', label: 'Rejetés' },
]

export default function AdminDisputes() {
  const [status, setStatus] = useState('')
  const query = useInfiniteQuery({ queryKey: queryKeys.admin.disputes({ status }), queryFn: ({ pageParam }) => adminApi.disputes.list({ status, cursor: pageParam, limit: 30 }), initialPageParam: undefined, getNextPageParam: (page) => page.nextCursor || undefined, refetchInterval: 30_000, refetchOnReconnect: true })
  const rows = flattenAdminPages(query.data)
  const columns = [
    { key: 'reference', label: 'Dossier', render: (row) => <div><p className="font-mono text-xs font-black text-fifow-dark">{row.reference}</p><p className="mt-1 text-xs font-semibold text-fifow-muted">{formatAdminDate(row.createdAt)}</p></div> },
    { key: 'order', label: 'Commande', render: (row) => <div><p className="font-bold text-fifow-dark">{row.order?.reference}</p><p className="text-xs text-fifow-muted">{row.order?.product?.title || 'Produit'}</p></div> },
    { key: 'participants', label: 'Participants', render: (row) => <div><p className="font-bold text-fifow-dark">{row.order?.buyer?.fullName || 'Acheteur'}</p><p className="text-xs text-fifow-muted">avec {row.order?.seller?.fullName || 'Vendeur'}</p></div> },
    { key: 'amount', label: 'Montant', render: (row) => <span className="font-black text-fifow-dark">{formatAdminMoney(row.order?.totalAmount)}</span> },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ]
  return <AdminPage eyebrow="Confiance transactionnelle" title="Litiges" description="Examinez les problèmes de commande avant de décider d’un remboursement ou d’un versement vendeur." actions={<span className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-fifow-red"><AlertTriangle className="h-4 w-4" /> Dossiers financiers sensibles</span>}>
    <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} rowLink={(row) => `/admin/disputes/${row.id}`} mobileTitle={(row) => row.reference} mobileSubtitle={(row) => `${row.order?.product?.title || 'Commande'} · ${formatAdminMoney(row.order?.totalAmount)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun litige" description="La file de vérification est à jour." /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
  </AdminPage>
}
