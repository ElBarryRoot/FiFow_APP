import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EyeOff, RotateCcw, Star } from 'lucide-react'
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
  { value: 'PUBLISHED', label: 'Publiés' },
  { value: 'PENDING_MODERATION', label: 'À vérifier' },
  { value: 'HIDDEN', label: 'Masqués' },
  { value: 'ARCHIVED', label: 'Archivés' },
]

export default function AdminReviews() {
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const query = useInfiniteQuery({
    queryKey: ['admin', 'reviews', { status }],
    queryFn: ({ pageParam }) => adminApi.reviews.list({ status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const mutation = useMutation({
    mutationFn: ({ row, action, reason }) => adminApi.moderation.apply({ targetType: 'REVIEW', targetId: row.id, action, reason }),
    onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }); queryClient.invalidateQueries({ queryKey: ['reviews'] }); showToast('Avis mis à jour.'); setDialog(null) },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const columns = useMemo(() => [
    { key: 'rating', label: 'Note', render: (row) => <span className="inline-flex items-center gap-1 font-black text-fifow-dark"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{row.rating}/5</span> },
    { key: 'comment', label: 'Commentaire', render: (row) => <p className="max-w-lg whitespace-pre-wrap leading-5">{row.comment}</p> },
    { key: 'author', label: 'Auteur', render: (row) => row.author?.fullName || 'Utilisateur' },
    { key: 'subject', label: 'Profil évalué', render: (row) => row.subject?.fullName || 'Utilisateur' },
    { key: 'reports', label: 'Signalements', render: (row) => row.reportCount || 0 },
    { key: 'createdAt', label: 'Publié', render: (row) => formatAdminDate(row.createdAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <AdminPage eyebrow="Réputation" title="Avis" description="Modérez les avis signalés sans masquer les retours légitimes des utilisateurs.">
    <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => `${row.rating}/5 · ${row.author?.fullName || 'Utilisateur'}`} mobileSubtitle={(row) => row.comment} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={(row) => row.status === 'HIDDEN' ? <Button type="button" size="sm" variant="secondary" icon={RotateCcw} onClick={() => setDialog({ row, action: 'RESTORE_REVIEW' })}>Restaurer</Button> : <Button type="button" size="sm" variant="danger" icon={EyeOff} onClick={() => setDialog({ row, action: 'HIDE_REVIEW' })}>Masquer</Button>} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun avis" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminConfirmDialog open={Boolean(dialog)} title={dialog?.action === 'HIDE_REVIEW' ? 'Masquer cet avis' : 'Restaurer cet avis'} description="Le statut public de l’avis sera mis à jour et la décision restera traçable." confirmLabel="Confirmer" requireReason loading={mutation.isPending} onClose={() => setDialog(null)} onConfirm={(reason) => mutation.mutate({ ...dialog, reason })} />
  </AdminPage>
}
