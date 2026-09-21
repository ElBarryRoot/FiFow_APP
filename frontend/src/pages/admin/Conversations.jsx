import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import { flattenAdminPages, formatAdminDate } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const statuses = [
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'BLOCKED', label: 'Bloquées' },
  { value: 'DISPUTED', label: 'En litige' },
  { value: 'ARCHIVED', label: 'Archivées' },
]

export default function AdminConversations() {
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const query = useInfiniteQuery({
    queryKey: ['admin', 'conversations', { status }],
    queryFn: ({ pageParam }) => adminApi.conversations.listReported({ status, cursor: pageParam, limit: 25 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const mutation = useMutation({
    mutationFn: ({ row, action, reason }) => adminApi.moderation.apply({ targetType: 'CONVERSATION', targetId: row.id, action, reason }),
    onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] }); showToast('Conversation mise à jour.'); setDialog(null) },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const columns = useMemo(() => [
    { key: 'product', label: 'Annonce', render: (row) => <div><p className="font-extrabold text-fifow-dark">{row.product?.title || 'Annonce indisponible'}</p><p className="text-xs text-fifow-muted">{row.product?.status}</p></div> },
    { key: 'participants', label: 'Participants', render: (row) => <div><p className="font-bold text-fifow-dark">{row.buyer?.fullName || 'Acheteur'}</p><p className="text-xs text-fifow-muted">avec {row.seller?.fullName || 'Vendeur'}</p></div> },
    { key: 'message', label: 'Dernier contenu signalé', render: (row) => <p className="max-w-md whitespace-pre-wrap leading-5">{reportedText(row)}</p> },
    { key: 'reports', label: 'Signalements', render: (row) => row.reportCount || 0 },
    { key: 'updatedAt', label: 'Activité', render: (row) => formatAdminDate(row.updatedAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <AdminPage eyebrow="Échanges signalés" title="Conversations" description="Consultez uniquement les échanges remontés et bloquez une conversation lorsque la sécurité l’exige.">
    <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.product?.title || 'Conversation signalée'} mobileSubtitle={(row) => `${row.buyer?.fullName || 'Acheteur'} · ${row.seller?.fullName || 'Vendeur'}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={(row) => row.status === 'BLOCKED' ? <Button type="button" size="sm" variant="secondary" icon={Unlock} onClick={() => setDialog({ row, action: 'UNBLOCK_CONVERSATION' })}>Débloquer</Button> : <Button type="button" size="sm" variant="danger" icon={Lock} onClick={() => setDialog({ row, action: 'BLOCK_CONVERSATION' })}>Bloquer</Button>} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune conversation signalée" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminConfirmDialog open={Boolean(dialog)} title={dialog?.action === 'BLOCK_CONVERSATION' ? 'Bloquer cette conversation' : 'Débloquer cette conversation'} description="Cette action affecte immédiatement les échanges entre les deux participants." confirmLabel="Confirmer" requireReason loading={mutation.isPending} onClose={() => setDialog(null)} onConfirm={(reason) => mutation.mutate({ ...dialog, reason })} />
  </AdminPage>
}

function reportedText(row) {
  const message = row.messages?.[0]
  if (!message) return 'Aucun aperçu disponible'
  return message.text || (message.mediaUrl ? 'Image signalée' : 'Message signalé')
}
