import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { queryKeys } from '../../api/queryKeys.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminFormDialog from '../../components/admin/AdminFormDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLiveStatus from '../../components/admin/AdminLiveStatus.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const statuses = [
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED',
].map((value) => ({ value, label: adminStatusLabel(value) }))

export default function AdminPayments() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [refund, setRefund] = useState(null)
  const [partial, setPartial] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [sandboxResolution, setSandboxResolution] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: queryKeys.admin.payments({ search: debouncedSearch, status }),
    queryFn: ({ pageParam }) => adminApi.payments.list({
      search: debouncedSearch,
      status,
      cursor: pageParam,
      limit: 30,
    }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
    refetchOnReconnect: true,
  })
  const rows = flattenAdminPages(query.data)
  const validAmount = !partial || isRefundAmountValid(amount, refund?.amount)
  const canManageFinance = canAdmin(auth.user, 'manageFinance')
  const refundMutation = useMutation({
    mutationFn: () => adminApi.payments.refund(refund.id, {
      reason: reason.trim(),
      ...(partial ? { amount } : {}),
    }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.paymentsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.ordersRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.payoutsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      showToast('Remboursement demande au fournisseur.')
      closeRefund()
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })
  const sandboxResolutionMutation = useMutation({
    mutationFn: (failureReason) => adminApi.payments.confirmSandboxRefund(sandboxResolution.payment.id, {
      outcome: sandboxResolution.outcome,
      ...(failureReason ? { failureReason } : {}),
    }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.paymentsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.ordersRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.payoutsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      showToast(sandboxResolution.outcome === 'SUCCEEDED' ? 'Remboursement de test confirmé.' : 'Échec de test enregistré.')
      setSandboxResolution(null)
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })

  const columns = useMemo(() => [
    {
      key: 'reference',
      label: 'Paiement',
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-extrabold text-fifow-dark">{row.internalReference}</p>
          <p className="mt-1 text-xs text-fifow-muted">{row.provider || 'Fournisseur'} - {paymentTypeLabel(row.type)}</p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Payeur',
      render: (row) => (
        <div>
          <p className="font-bold text-fifow-dark">{row.user?.fullName || 'Utilisateur'}</p>
          {row.user?.email ? <p className="text-xs text-fifow-muted">{row.user.email}</p> : null}
        </div>
      ),
    },
    { key: 'order', label: 'Commande', render: (row) => row.order?.reference || 'Aucune commande' },
    { key: 'amount', label: 'Montant', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.amount)}</span> },
    {
      key: 'nextStep',
      label: 'Etape suivante',
      render: (row) => <span className="max-w-52 text-sm font-semibold text-fifow-secondary">{paymentGuidance(row)}</span>,
    },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])

  function openRefund(row) {
    setRefund(row)
    setPartial(false)
    setAmount('')
    setReason('')
  }

  function closeRefund() {
    if (refundMutation.isPending) return
    setRefund(null)
    setPartial(false)
    setAmount('')
    setReason('')
  }

  function submitRefund(event) {
    event.preventDefault()
    if (reason.trim().length >= 5 && validAmount) refundMutation.mutate()
  }

  return (
    <AdminPage
      eyebrow="Flux financiers"
      title="Paiements"
      description="Controlez les paiements et demandez un remboursement seulement apres verification de la commande."
      actions={<AdminLiveStatus />}
    >
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Reference paiement ou commande"
        status={status}
        onStatusChange={setStatus}
        statusOptions={statuses}
      />
      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? (
        <AdminTable
          columns={columns}
          rows={rows}
          mobileTitle={(row) => row.internalReference}
          mobileSubtitle={(row) => `${row.user?.fullName || 'Utilisateur'} - ${formatAdminMoney(row.amount)}`}
          mobileMeta={(row) => <AdminStatusBadge status={row.status} />}
          actions={canManageFinance ? (row) => (
            <div className="flex justify-end gap-2">
              {canRefund(row) ? <Button type="button" size="sm" variant="secondary" icon={RotateCcw} onClick={() => openRefund(row)}>Rembourser</Button> : null}
              {canResolveSandboxRefund(row) ? <>
                <Button type="button" size="sm" variant="secondary" icon={CheckCircle2} onClick={() => setSandboxResolution({ payment: row, outcome: 'SUCCEEDED' })}>Valider test</Button>
                <Button type="button" size="sm" variant="danger" icon={XCircle} onClick={() => setSandboxResolution({ payment: row, outcome: 'FAILED' })}>Échec test</Button>
              </> : null}
            </div>
          ) : undefined}
        />
      ) : null}
      {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun paiement" /> : null}
      <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />

      <AdminFormDialog
        open={Boolean(refund)}
        title="Demander un remboursement"
        description={`${refund?.internalReference || ''} - ${formatAdminMoney(refund?.amount)}`}
        confirmLabel="Demander le remboursement"
        tone="danger"
        loading={refundMutation.isPending}
        disabled={reason.trim().length < 5 || !validAmount}
        onClose={closeRefund}
        onSubmit={submitRefund}
      >
        <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
          Le reversement vendeur reste bloque jusqu a la confirmation du fournisseur.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-fifow-border p-3">
          <input
            type="checkbox"
            checked={partial}
            onChange={(event) => {
              setPartial(event.target.checked)
              setAmount('')
            }}
            className="h-4 w-4 accent-fifow-primary"
          />
          <span>
            <strong className="block text-sm text-fifow-dark">Remboursement partiel</strong>
            <span className="text-xs font-semibold text-fifow-secondary">Desactive : remboursement du montant total.</span>
          </span>
        </label>
        {partial ? (
          <label className="mt-4 block">
            <span className="text-sm font-extrabold text-fifow-dark">Montant en GNF</span>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, '').slice(0, 15))}
              inputMode="numeric"
              className="mt-2 h-12"
              aria-invalid={Boolean(amount && !validAmount)}
            />
            {amount && !validAmount ? <span className="mt-1 block text-xs font-bold text-fifow-red">Entrez un montant compris entre 100 GNF et le paiement initial.</span> : null}
          </label>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-extrabold text-fifow-dark">Motif detaille</span>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            className="mt-2 min-h-28"
            placeholder="Expliquez la raison du remboursement."
          />
        </label>
      </AdminFormDialog>
      <AdminConfirmDialog
        open={Boolean(sandboxResolution)}
        title={sandboxResolution?.outcome === 'SUCCEEDED' ? 'Valider le remboursement de test' : 'Simuler un échec de remboursement'}
        description={sandboxResolution?.outcome === 'SUCCEEDED'
          ? 'Cette confirmation simule la réponse du fournisseur et finalise le remboursement.'
          : 'Cette simulation conserve le paiement initial comme payé afin qu il puisse être vérifié.'}
        confirmLabel={sandboxResolution?.outcome === 'SUCCEEDED' ? 'Confirmer le test' : 'Enregistrer l échec'}
        tone={sandboxResolution?.outcome === 'FAILED' ? 'danger' : 'primary'}
        requireReason={sandboxResolution?.outcome === 'FAILED'}
        reasonLabel="Motif de l échec simulé"
        loading={sandboxResolutionMutation.isPending}
        onClose={() => setSandboxResolution(null)}
        onConfirm={(failureReason) => sandboxResolutionMutation.mutate(failureReason)}
      />
    </AdminPage>
  )
}

function canRefund(payment) {
  return payment.status === 'SUCCEEDED' && Boolean(payment.order)
}

function canResolveSandboxRefund(payment) {
  return import.meta.env.DEV && payment.status === 'REFUND_PENDING' && payment.provider === 'MOCK'
}

function paymentGuidance(payment) {
  if (payment.status === 'CREATED') return 'Paiement en attente de demarrage'
  if (payment.status === 'PROCESSING') return 'Confirmation du fournisseur en cours'
  if (payment.status === 'SUCCEEDED') return payment.order ? 'Commande a suivre jusqu a la remise' : 'Paiement confirme'
  if (payment.status === 'REFUND_PENDING') return 'Attente de confirmation du remboursement'
  if (payment.status === 'REFUNDED') return 'Remboursement termine'
  if (payment.status === 'FAILED') return 'Verifier le motif de refus avec le fournisseur'
  if (payment.status === 'CANCELLED') return 'Paiement annule'
  return 'Verification en cours'
}

function paymentTypeLabel(type) {
  return {
    ORDER: 'Commande',
    BOOST: 'Boost',
    REFUND: 'Remboursement',
  }[type] || type || 'Transaction'
}

function isRefundAmountValid(value, maximum) {
  if (!/^\d{3,15}$/.test(value || '')) return false
  try {
    return BigInt(value) > 0n && BigInt(value) <= BigInt(maximum || 0)
  } catch {
    return false
  }
}

export { canRefund, canResolveSandboxRefund, isRefundAmountValid, paymentGuidance }
