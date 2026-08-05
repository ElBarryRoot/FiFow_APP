import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminFormDialog from '../../components/admin/AdminFormDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
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

const statuses = ['CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'].map((value) => ({ value, label: adminStatusLabel(value) }))

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
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'payments', { search: debouncedSearch, status }],
    queryFn: ({ pageParam }) => adminApi.payments.list({ search: debouncedSearch, status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const validAmount = !partial || isRefundAmountValid(amount, refund?.amount)
  const refundMutation = useMutation({
    mutationFn: () => adminApi.payments.refund(refund.id, { reason: reason.trim(), ...(partial ? { amount } : {}) }),
    onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] }); queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); showToast('Remboursement demandé au fournisseur.'); closeRefund() },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const columns = useMemo(() => [
    { key: 'reference', label: 'Paiement', render: (row) => <div><p className="font-mono text-xs font-extrabold text-fifow-dark">{row.internalReference}</p><p className="mt-1 text-xs text-fifow-muted">{row.provider} · {row.type}</p></div> },
    { key: 'user', label: 'Payeur', render: (row) => <div><p className="font-bold text-fifow-dark">{row.user?.fullName || 'Utilisateur'}</p><p className="text-xs text-fifow-muted">{row.user?.email}</p></div> },
    { key: 'order', label: 'Commande', render: (row) => row.order?.reference || '—' },
    { key: 'amount', label: 'Montant', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.amount)}</span> },
    { key: 'createdAt', label: 'Créé', render: (row) => formatAdminDate(row.createdAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])

  function openRefund(row) { setRefund(row); setPartial(false); setAmount(''); setReason('') }
  function closeRefund() { if (refundMutation.isPending) return; setRefund(null); setPartial(false); setAmount(''); setReason('') }
  function submitRefund(event) { event.preventDefault(); if (reason.trim().length >= 5 && validAmount) refundMutation.mutate() }

  return <AdminPage eyebrow="Flux financiers" title="Paiements" description="Contrôlez les paiements et déclenchez un remboursement uniquement après vérification de la commande.">
    <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Référence paiement ou commande" status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.internalReference} mobileSubtitle={(row) => `${row.user?.fullName || 'Utilisateur'} · ${formatAdminMoney(row.amount)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={canAdmin(auth.user, 'manageFinance') ? (row) => row.status === 'SUCCEEDED' && row.order ? <Button type="button" size="sm" variant="secondary" icon={RotateCcw} onClick={() => openRefund(row)}>Rembourser</Button> : null : undefined} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun paiement" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminFormDialog open={Boolean(refund)} title="Demander un remboursement" description={`${refund?.internalReference || ''} · ${formatAdminMoney(refund?.amount)}`} confirmLabel="Demander le remboursement" tone="danger" loading={refundMutation.isPending} disabled={reason.trim().length < 5 || !validAmount} onClose={closeRefund} onSubmit={submitRefund}>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-fifow-border p-3"><input type="checkbox" checked={partial} onChange={(event) => { setPartial(event.target.checked); setAmount('') }} className="h-4 w-4 accent-fifow-primary" /><span><strong className="block text-sm text-fifow-dark">Remboursement partiel</strong><span className="text-xs font-semibold text-fifow-secondary">Désactivé : remboursement du montant total.</span></span></label>
      {partial ? <label className="mt-4 block"><span className="text-sm font-extrabold text-fifow-dark">Montant en GNF</span><Input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric" className="mt-2 h-12" aria-invalid={amount && !validAmount} />{amount && !validAmount ? <span className="mt-1 block text-xs font-bold text-fifow-red">Entrez un montant compris entre 100 GNF et le paiement initial.</span> : null}</label> : null}
      <label className="mt-4 block"><span className="text-sm font-extrabold text-fifow-dark">Motif détaillé</span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} className="mt-2 min-h-28" placeholder="Expliquez la raison du remboursement." /></label>
    </AdminFormDialog>
  </AdminPage>
}

function isRefundAmountValid(value, maximum) { if (!/^\d{3,15}$/.test(value || '')) return false; try { return BigInt(value) > 0n && BigInt(value) <= BigInt(maximum || 0) } catch { return false } }
