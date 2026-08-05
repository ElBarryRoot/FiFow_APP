import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const statuses = ['BLOCKED', 'SCHEDULED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'].map((value) => ({ value, label: adminStatusLabel(value) }))

export default function AdminPayouts() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const query = useInfiniteQuery({ queryKey: ['admin', 'payouts', { status }], queryFn: ({ pageParam }) => adminApi.payouts.list({ status, cursor: pageParam, limit: 30 }), initialPageParam: undefined, getNextPageParam: (page) => page.nextCursor || undefined })
  const rows = flattenAdminPages(query.data)
  const canManage = canAdmin(auth.user, 'manageFinance')
  const mutation = useMutation({ mutationFn: () => adminApi.payouts.process(selected.id), onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }); showToast('Reversement transmis au fournisseur.'); setSelected(null) }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const columns = useMemo(() => [
    { key: 'reference', label: 'Reversement', render: (row) => <div><p className="font-mono text-xs font-extrabold text-fifow-dark">{row.internalReference}</p><p className="text-xs text-fifow-muted">{row.provider}</p></div> },
    { key: 'seller', label: 'Vendeur', render: (row) => <div><p className="font-bold text-fifow-dark">{row.seller?.fullName || 'Vendeur'}</p><p className="text-xs text-fifow-muted">{row.seller?.phone || row.seller?.email}</p></div> },
    { key: 'order', label: 'Commande', render: (row) => row.order?.reference || '—' },
    { key: 'amount', label: 'Montant', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.amount)}</span> },
    { key: 'availableAt', label: 'Disponible', render: (row) => formatAdminDate(row.availableAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <AdminPage eyebrow="Fonds vendeurs" title="Reversements" description="Vérifiez l’éligibilité, la commande et les coordonnées avant chaque transmission au fournisseur.">
    <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.internalReference} mobileSubtitle={(row) => `${row.seller?.fullName || 'Vendeur'} · ${formatAdminMoney(row.amount)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={canManage ? (row) => canProcess(row) ? <Button type="button" size="sm" icon={Send} onClick={() => setSelected(row)}>Traiter</Button> : null : undefined} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun reversement" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminConfirmDialog open={Boolean(selected)} title="Transmettre ce reversement" description={`${selected?.seller?.fullName || 'Vendeur'} recevra ${formatAdminMoney(selected?.amount)} via ${selected?.provider || 'le fournisseur configuré'}.`} confirmLabel="Transmettre" tone="primary" loading={mutation.isPending} onClose={() => setSelected(null)} onConfirm={() => mutation.mutate()} />
  </AdminPage>
}

function canProcess(row) { return row.status === 'SCHEDULED' && Boolean(row.availableAt) && new Date(row.availableAt) <= new Date() }
