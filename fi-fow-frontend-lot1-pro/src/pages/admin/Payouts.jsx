import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Send, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { queryKeys } from '../../api/queryKeys.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLiveStatus from '../../components/admin/AdminLiveStatus.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const statuses = ['BLOCKED', 'SCHEDULED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED']
  .map((value) => ({ value, label: adminStatusLabel(value) }))

export default function AdminPayouts() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [sandboxResolution, setSandboxResolution] = useState(null)
  const canManageFinance = canAdmin(auth.user, 'manageFinance')
  const query = useInfiniteQuery({
    queryKey: queryKeys.admin.payouts({ status }),
    queryFn: ({ pageParam }) => adminApi.payouts.list({ status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
    refetchOnReconnect: true,
  })
  const rows = flattenAdminPages(query.data)
  const processMutation = useMutation({
    mutationFn: () => adminApi.payouts.process(selected.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.payoutsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.ordersRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      showToast('Reversement transmis au fournisseur.')
      setSelected(null)
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })
  const sandboxResolutionMutation = useMutation({
    mutationFn: (reason) => adminApi.payouts.confirmSandbox(sandboxResolution.row.id, {
      outcome: sandboxResolution.outcome,
      ...(reason ? { failureReason: reason } : {}),
    }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.payoutsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.ordersRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      showToast(sandboxResolution.outcome === 'SUCCEEDED' ? 'Reversement de test confirmé.' : 'Échec de test enregistré.')
      setSandboxResolution(null)
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })

  const columns = useMemo(() => [
    {
      key: 'reference',
      label: 'Reversement',
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-extrabold text-fifow-dark">{row.internalReference}</p>
          <p className="text-xs text-fifow-muted">{row.provider || 'Fournisseur'}</p>
        </div>
      ),
    },
    {
      key: 'seller',
      label: 'Vendeur',
      render: (row) => (
        <div>
          <p className="font-bold text-fifow-dark">{row.seller?.fullName || 'Vendeur'}</p>
          <p className="text-xs text-fifow-muted">{row.seller?.phone || row.seller?.email || 'Coordonnee non renseignee'}</p>
        </div>
      ),
    },
    { key: 'order', label: 'Commande', render: (row) => row.order?.reference || 'Commande indisponible' },
    { key: 'amount', label: 'Montant', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.amount)}</span> },
    {
      key: 'nextStep',
      label: 'Etape suivante',
      render: (row) => <span className="max-w-56 text-sm font-semibold text-fifow-secondary">{payoutGuidance(row)}</span>,
    },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])

  return (
    <AdminPage
      eyebrow="Fonds vendeurs"
      title="Reversements"
      description="Verifiez la commande et l eligibilite avant chaque transmission au fournisseur."
      actions={<AdminLiveStatus />}
    >
      <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? (
        <AdminTable
          columns={columns}
          rows={rows}
          mobileTitle={(row) => row.internalReference}
          mobileSubtitle={(row) => `${row.seller?.fullName || 'Vendeur'} - ${payoutGuidance(row)}`}
          mobileMeta={(row) => <AdminStatusBadge status={row.status} />}
          actions={canManageFinance ? (row) => (
            <div className="flex justify-end gap-2">
              {canProcess(row) ? <Button type="button" size="sm" icon={Send} onClick={() => setSelected(row)}>Transmettre</Button> : null}
              {canResolveSandboxPayout(row) ? <>
                <Button type="button" size="sm" variant="secondary" icon={CheckCircle2} onClick={() => setSandboxResolution({ row, outcome: 'SUCCEEDED' })}>Valider test</Button>
                <Button type="button" size="sm" variant="danger" icon={XCircle} onClick={() => setSandboxResolution({ row, outcome: 'FAILED' })}>Échec test</Button>
              </> : null}
            </div>
          ) : undefined}
        />
      ) : null}
      {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun reversement" /> : null}
      <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
      <AdminConfirmDialog
        open={Boolean(selected)}
        title="Transmettre ce reversement"
        description={`${selected?.seller?.fullName || 'Le vendeur'} recevra ${formatAdminMoney(selected?.amount)} via ${selected?.provider || 'le fournisseur configure'}. Cette action sera enregistree dans l historique.`}
        confirmLabel="Transmettre"
        tone="primary"
        loading={processMutation.isPending}
        onClose={() => setSelected(null)}
        onConfirm={() => processMutation.mutate()}
      />
      <AdminConfirmDialog
        open={Boolean(sandboxResolution)}
        title={sandboxResolution?.outcome === 'SUCCEEDED' ? 'Valider le reversement de test' : 'Simuler un échec de reversement'}
        description={sandboxResolution?.outcome === 'SUCCEEDED'
          ? 'Cette confirmation simule la réponse du fournisseur et notifie le vendeur.'
          : 'Cette simulation laisse une trace d audit et place le reversement en échec.'}
        confirmLabel={sandboxResolution?.outcome === 'SUCCEEDED' ? 'Confirmer le test' : 'Enregistrer l échec'}
        tone={sandboxResolution?.outcome === 'FAILED' ? 'danger' : 'primary'}
        requireReason={sandboxResolution?.outcome === 'FAILED'}
        reasonLabel="Motif de l échec simulé"
        loading={sandboxResolutionMutation.isPending}
        onClose={() => setSandboxResolution(null)}
        onConfirm={(reason) => sandboxResolutionMutation.mutate(reason)}
      />
    </AdminPage>
  )
}

function canProcess(row) {
  return row.status === 'SCHEDULED'
    && Boolean(row.availableAt)
    && new Date(row.availableAt) <= new Date()
}

function canResolveSandboxPayout(row) {
  return import.meta.env.DEV && row.status === 'PROCESSING' && row.provider === 'MOCK'
}

function payoutGuidance(row) {
  if (row.status === 'BLOCKED') return 'Attente de resolution du litige ou du remboursement'
  if (row.status === 'SCHEDULED') {
    return canProcess(row)
      ? 'Pret a etre transmis au fournisseur'
      : `Disponible le ${formatAdminDate(row.availableAt)}`
  }
  if (row.status === 'PROCESSING') return 'Transmission au fournisseur en cours'
  if (row.status === 'SUCCEEDED') return 'Montant reverse au vendeur'
  if (row.status === 'FAILED') return 'Verification manuelle necessaire'
  if (row.status === 'CANCELLED') return 'Reversement annule'
  return 'Verification en cours'
}

export { canProcess, canResolveSandboxPayout, payoutGuidance }
