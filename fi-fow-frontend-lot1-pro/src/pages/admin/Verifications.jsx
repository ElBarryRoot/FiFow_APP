import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminDocumentViewer from '../../components/admin/AdminDocumentViewer.jsx'
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
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvées' },
  { value: 'REJECTED', label: 'Refusées' },
  { value: 'REMOVED', label: 'Retirées' },
]

export default function AdminVerifications() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('PENDING')
  const [dialog, setDialog] = useState(null)
  const query = useInfiniteQuery({
    queryKey: ['admin', 'verifications', { status }],
    queryFn: ({ pageParam }) => adminApi.verifications.list({ status, cursor: pageParam, limit: 25 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const canReview = canAdmin(auth.user, 'reviewSellerVerification')
  const reviewMutation = useMutation({
    mutationFn: ({ type, item, reason }) => type === 'approve'
      ? adminApi.verifications.approve(item.id, reason)
      : adminApi.verifications.reject(item.id, reason),
    onSuccess(_, variables) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      showToast(variables.type === 'approve' ? 'Vendeur vérifié.' : 'Demande refusée.')
      setDialog(null)
    },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })

  const columns = useMemo(() => [
    { key: 'user', label: 'Vendeur', render: (row) => <div><p className="font-extrabold text-fifow-dark">{row.user?.fullName || 'Utilisateur'}</p><p className="text-xs text-fifow-muted">{row.user?.email}</p></div> },
    { key: 'documents', label: 'Justificatifs', render: (row) => <DocumentButtons row={row} /> },
    { key: 'note', label: 'Note', render: (row) => <p className="max-w-xs whitespace-pre-wrap text-sm">{row.note || '—'}</p> },
    { key: 'requestedAt', label: 'Demandée', render: (row) => formatAdminDate(row.requestedAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])

  return (
    <AdminPage eyebrow="Identité vendeur" title="Vérifications" description="Contrôlez les justificatifs privés avant d’accorder le badge vendeur FiFow.">
      <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.user?.fullName || 'Utilisateur'} mobileSubtitle={(row) => `${row.user?.email || ''} · ${formatAdminDate(row.requestedAt)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={canReview ? (row) => <VerificationActions row={row} onAction={setDialog} /> : undefined} /> : null}
      {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune vérification" description="La file de vérification ne contient aucun dossier pour ce statut." /> : null}
      <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
      <AdminConfirmDialog open={Boolean(dialog)} title={dialog?.type === 'approve' ? 'Approuver cette identité' : 'Refuser cette demande'} description={dialog?.type === 'approve' ? 'Le badge vendeur vérifié sera immédiatement visible.' : 'Le vendeur pourra soumettre de nouveaux justificatifs.'} confirmLabel={dialog?.type === 'approve' ? 'Approuver' : 'Refuser'} tone={dialog?.type === 'approve' ? 'primary' : 'danger'} requireReason={dialog?.type === 'reject'} reasonLabel="Motif du refus" loading={reviewMutation.isPending} onClose={() => setDialog(null)} onConfirm={(reason) => reviewMutation.mutate({ ...dialog, reason })} />
    </AdminPage>
  )
}

function DocumentButtons({ row }) {
  const count = row.documentCount ?? row.documents?.length ?? row.documentUrls?.length ?? 0
  if (!count) return <span className="text-xs font-bold text-fifow-muted">Aucun document</span>
  return <div className="flex max-w-sm flex-wrap gap-2">{Array.from({ length: count }, (_, index) => <AdminDocumentViewer key={index} verificationId={row.id} documentIndex={index} />)}</div>
}

function VerificationActions({ row, onAction }) {
  if (row.status !== 'PENDING') return null
  return <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="secondary" icon={X} onClick={() => onAction({ type: 'reject', item: row })}>Refuser</Button><Button type="button" size="sm" icon={Check} onClick={() => onAction({ type: 'approve', item: row })}>Approuver</Button></div>
}
