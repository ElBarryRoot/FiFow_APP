import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban, BadgeX, Boxes, RotateCcw, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const statuses = [
  { value: 'ACTIVE', label: 'Actifs' },
  { value: 'SUSPENDED', label: 'Suspendus' },
  { value: 'BANNED', label: 'Bannis' },
  { value: 'ARCHIVED', label: 'Archivés' },
]
const roleRank = { USER: 0, MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 }

export default function AdminUsers() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'users', { search: debouncedSearch, status }],
    queryFn: ({ pageParam }) => adminApi.users.list({ search: debouncedSearch, status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const mutation = useMutation({
    mutationFn: ({ row, action, reason }) => adminApi.moderation.apply({ targetType: 'USER', targetId: row.id, action, reason }),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      showToast('Statut du compte mis à jour.')
      setDialog(null)
    },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const stockMutation = useMutation({
    mutationFn: ({ row, enabled }) => adminApi.users.setStockCapability(row.id, enabled),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      showToast('Autorisation de stock mise à jour.')
    },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const columns = useMemo(() => [
    { key: 'identity', label: 'Utilisateur', render: (row) => <div><p className="font-extrabold text-fifow-dark">{row.fullName}</p><p className="text-xs text-fifow-muted">{row.email}</p></div> },
    { key: 'phone', label: 'Téléphone', render: (row) => row.phone || '—' },
    { key: 'role', label: 'Rôle', render: (row) => roleLabel(row.role) },
    { key: 'verification', label: 'Vendeur', render: (row) => <AdminStatusBadge status={row.sellerVerificationStatus} /> },
    { key: 'stock', label: 'Stock', render: (row) => <span className={`text-xs font-black ${row.canManageStock ? 'text-emerald-700' : 'text-fifow-muted'}`}>{row.canManageStock ? 'Autorisé' : 'Non autorisé'}</span> },
    { key: 'lastLoginAt', label: 'Dernière connexion', render: (row) => formatAdminDate(row.lastLoginAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])

  return (
    <AdminPage eyebrow="Comptes et accès" title="Utilisateurs" description="Recherchez un compte et appliquez uniquement les mesures nécessaires et proportionnées.">
      <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Nom ou adresse email" status={status} onStatusChange={setStatus} statusOptions={statuses} />
      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.fullName} mobileSubtitle={(row) => `${row.email} · ${roleLabel(row.role)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={(row) => <UserActions row={row} currentUser={auth.user} onAction={setDialog} onStock={(enabled) => stockMutation.mutate({ row, enabled })} stockBusy={stockMutation.isPending && stockMutation.variables?.row.id === row.id} />} /> : null}
      {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun utilisateur" /> : null}
      <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
      <AdminConfirmDialog open={Boolean(dialog)} title={actionTitle(dialog?.action)} description="Cette décision sera enregistrée dans le journal d’audit et peut déconnecter immédiatement le compte." confirmLabel="Confirmer l’action" requireReason loading={mutation.isPending} onClose={() => setDialog(null)} onConfirm={(reason) => mutation.mutate({ ...dialog, reason })} />
    </AdminPage>
  )
}

function UserActions({ row, currentUser, onAction, onStock, stockBusy }) {
  const canAct = canAdmin(currentUser, 'manageUsers')
    && row.id !== currentUser.id
    && (roleRank[currentUser.role] || 0) > (roleRank[row.role] || 0)
  if (!canAct) return <span className="text-xs font-bold text-fifow-muted">Protégé</span>
  if (row.status !== 'ACTIVE') return <Button type="button" size="sm" variant="secondary" icon={RotateCcw} onClick={() => onAction({ row, action: 'RESTORE_USER' })}>Restaurer</Button>
  const canManageStockRights = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)
  return <div className="flex flex-wrap justify-end gap-2">{canManageStockRights ? <Button type="button" size="sm" variant="secondary" icon={Boxes} loading={stockBusy} onClick={() => onStock(!row.canManageStock)}>{row.canManageStock ? 'Retirer stock' : 'Autoriser stock'}</Button> : null}<Button type="button" size="sm" variant="secondary" icon={ShieldAlert} onClick={() => onAction({ row, action: 'SUSPEND_USER' })}>Suspendre</Button><Button type="button" size="sm" variant="danger" icon={Ban} onClick={() => onAction({ row, action: 'BAN_USER' })}>Bannir</Button>{row.sellerVerificationStatus === 'APPROVED' ? <Button type="button" size="sm" variant="secondary" icon={BadgeX} onClick={() => onAction({ row, action: 'REMOVE_VERIFIED_BADGE' })}>Retirer le badge</Button> : null}</div>
}

function actionTitle(action) {
  return ({ SUSPEND_USER: 'Suspendre ce compte', BAN_USER: 'Bannir ce compte', RESTORE_USER: 'Restaurer ce compte', REMOVE_VERIFIED_BADGE: 'Retirer le badge vendeur' })[action] || 'Confirmer cette action'
}

function roleLabel(role) {
  return ({ USER: 'Utilisateur', MODERATOR: 'Modérateur', ADMIN: 'Administrateur', SUPER_ADMIN: 'Super administrateur' })[role] || role
}
