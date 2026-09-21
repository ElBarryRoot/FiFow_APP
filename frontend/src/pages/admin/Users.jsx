import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BadgeX,
  Ban,
  Boxes,
  CheckCircle2,
  MoreHorizontal,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function AdminUsers() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [managedUser, setManagedUser] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())

  const query = useInfiniteQuery({
    queryKey: ['admin', 'users', { search: debouncedSearch, status }],
    queryFn: ({ pageParam }) => adminApi.users.list({
      search: debouncedSearch,
      status,
      cursor: pageParam,
      limit: 30,
    }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })

  const rows = flattenAdminPages(query.data)

  const moderationMutation = useMutation({
    mutationFn: ({ row, action, reason }) => adminApi.moderation.apply({
      targetType: 'USER',
      targetId: row.id,
      action,
      reason,
    }),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      showToast('Statut du compte mis à jour.')
      setConfirmation(null)
    },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })

  const stockMutation = useMutation({
    mutationFn: ({ row, enabled }) => adminApi.users.setStockCapability(row.id, enabled),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      showToast('Autorisation de stock mise à jour.')
      setManagedUser(null)
    },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })

  const columns = useMemo(() => [
    {
      key: 'identity',
      label: 'Utilisateur',
      className: 'w-[34%]',
      cellClassName: 'min-w-[270px]',
      render: (row) => <UserIdentity user={row} />,
    },
    {
      key: 'account',
      label: 'Compte',
      className: 'w-[18%]',
      cellClassName: 'min-w-[160px]',
      render: (row) => (
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-fifow-secondary">{roleLabel(row.role)}</p>
          <AdminStatusBadge status={row.status} className="hidden md:inline-flex" />
        </div>
      ),
    },
    {
      key: 'selling',
      label: 'Vente',
      className: 'w-[20%]',
      cellClassName: 'min-w-[170px]',
      render: (row) => <SellingAccess user={row} />,
    },
    {
      key: 'lastLoginAt',
      label: 'Dernière activité',
      className: 'w-[18%]',
      cellClassName: 'min-w-[165px] whitespace-nowrap',
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-fifow-secondary">
            {row.lastLoginAt ? formatAdminDate(row.lastLoginAt) : 'Jamais connecté'}
          </p>
          <p className="mt-0.5 text-xs font-medium text-fifow-muted">Dernière connexion</p>
        </div>
      ),
    },
  ], [])

  function requestAction(row, action) {
    setManagedUser(null)
    setConfirmation({ row, action })
  }

  return (
    <AdminPage
      eyebrow="Comptes et accès"
      title="Utilisateurs"
      description="Recherchez un compte, vérifiez ses accès et appliquez une action si nécessaire."
    >
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nom, email ou téléphone"
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
          mobileTitle={(row) => row.fullName}
          mobileSubtitle={(row) => [row.email, row.phone].filter(Boolean).join(' · ')}
          mobileMeta={(row) => <AdminStatusBadge status={row.status} />}
          actions={(row) => (
            <UserActions
              row={row}
              currentUser={auth.user}
              onManage={setManagedUser}
              onRestore={() => requestAction(row, 'RESTORE_USER')}
            />
          )}
        />
      ) : null}

      {!query.isLoading && !query.isError && !rows.length ? (
        <AdminEmpty title="Aucun utilisateur" />
      ) : null}

      <AdminLoadMore
        hasNextPage={query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={query.fetchNextPage}
      />

      <UserManagementDialog
        user={managedUser}
        currentUser={auth.user}
        stockBusy={stockMutation.isPending}
        onClose={() => setManagedUser(null)}
        onStock={(enabled) => stockMutation.mutate({ row: managedUser, enabled })}
        onAction={(action) => requestAction(managedUser, action)}
      />

      <AdminConfirmDialog
        open={Boolean(confirmation)}
        title={actionTitle(confirmation?.action)}
        description="Cette décision sera enregistrée dans le journal d’audit et peut déconnecter immédiatement le compte."
        confirmLabel="Confirmer l’action"
        requireReason
        loading={moderationMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={(reason) => moderationMutation.mutate({ ...confirmation, reason })}
      />
    </AdminPage>
  )
}

function UserIdentity({ user }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fifow-lavender text-sm font-black text-fifow-primary">
        {initials(user.fullName)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-extrabold text-fifow-dark">{user.fullName}</p>
        <p className="truncate text-xs font-medium text-fifow-muted">{user.email}</p>
        {user.phone ? <p className="mt-0.5 text-xs font-bold text-fifow-secondary">{user.phone}</p> : null}
      </div>
    </div>
  )
}

function SellingAccess({ user }) {
  const sellerStatus = user.sellerVerificationStatus || 'NOT_REQUESTED'
  const hasSellerRequest = sellerStatus !== 'NOT_REQUESTED'

  return (
    <div className="space-y-1.5">
      {hasSellerRequest ? (
        <AdminStatusBadge status={sellerStatus} />
      ) : (
        <p className="text-sm font-bold text-fifow-secondary">Compte particulier</p>
      )}
      {user.canManageStock ? (
        <p className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Stock autorisé
        </p>
      ) : hasSellerRequest ? (
        <p className="text-xs font-medium text-fifow-muted">Sans gestion de stock</p>
      ) : null}
    </div>
  )
}

function UserActions({ row, currentUser, onManage, onRestore }) {
  const canAct = canAdmin(currentUser, 'manageUsers')
    && row.id !== currentUser.id
    && (roleRank[currentUser.role] || 0) > (roleRank[row.role] || 0)

  if (!canAct) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-fifow-muted">
        <ShieldCheck className="h-4 w-4" /> Protégé
      </span>
    )
  }

  if (row.status !== 'ACTIVE') {
    return (
      <Button type="button" size="sm" variant="secondary" icon={RotateCcw} onClick={onRestore}>
        Restaurer
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      icon={MoreHorizontal}
      aria-label={`Gérer le compte de ${row.fullName}`}
      onClick={() => onManage(row)}
    >
      Gérer
    </Button>
  )
}

function UserManagementDialog({ user, currentUser, stockBusy, onClose, onStock, onAction }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const stockBusyRef = useRef(stockBusy)
  onCloseRef.current = onClose
  stockBusyRef.current = stockBusy

  useEffect(() => {
    if (!user) return undefined
    const previousFocus = document.activeElement
    closeButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !stockBusyRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [user])

  if (!user) return null

  const canManageStockRights = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !stockBusy && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[calc(100vh-1rem)] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fifow-lavender text-sm font-black text-fifow-primary">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wide text-fifow-primary">Gestion du compte</p>
            <h2 id={titleId} className="truncate text-lg font-black text-fifow-dark">{user.fullName}</h2>
            <p className="truncate text-sm font-medium text-fifow-muted">{user.email}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fermer"
            disabled={stockBusy}
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-fifow-secondary transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
          <UserFact label="Rôle" value={roleLabel(user.role)} />
          <UserFact label="Téléphone" value={user.phone || 'Non renseigné'} />
        </div>

        <div className="mt-5 space-y-2">
          {canManageStockRights ? (
            <ActionChoice
              icon={Boxes}
              title={user.canManageStock ? 'Retirer l’accès au stock' : 'Autoriser la gestion de stock'}
              description={user.canManageStock
                ? 'Le vendeur ne pourra plus publier plusieurs exemplaires.'
                : 'Permet de publier et gérer des articles en stock.'}
              loading={stockBusy}
              onClick={() => onStock(!user.canManageStock)}
            />
          ) : null}

          {user.sellerVerificationStatus === 'APPROVED' ? (
            <ActionChoice
              icon={BadgeX}
              title="Retirer le badge vendeur"
              description="Le profil ne sera plus présenté comme vendeur vérifié."
              disabled={stockBusy}
              onClick={() => onAction('REMOVE_VERIFIED_BADGE')}
            />
          ) : null}

          <ActionChoice
            icon={ShieldAlert}
            title="Suspendre temporairement"
            description="Bloque l’accès au compte jusqu’à sa restauration."
            disabled={stockBusy}
            onClick={() => onAction('SUSPEND_USER')}
          />

          <div className="pt-2">
            <ActionChoice
              icon={Ban}
              title="Bannir définitivement"
              description="Réservé aux infractions graves ou répétées."
              tone="danger"
              disabled={stockBusy}
              onClick={() => onAction('BAN_USER')}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function ActionChoice({ icon: Icon, title, description, tone = 'default', loading = false, disabled = false, onClick }) {
  const danger = tone === 'danger'

  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${
        danger
          ? 'border-red-200 bg-red-50/60 hover:bg-red-50'
          : 'border-fifow-border hover:border-violet-200 hover:bg-fifow-lavender/40'
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${danger ? 'bg-red-100 text-red-700' : 'bg-fifow-lavender text-fifow-primary'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-extrabold ${danger ? 'text-red-800' : 'text-fifow-dark'}`}>
          {loading ? 'Mise à jour…' : title}
        </span>
        <span className={`mt-0.5 block text-xs font-medium leading-5 ${danger ? 'text-red-700' : 'text-fifow-muted'}`}>
          {description}
        </span>
      </span>
    </button>
  )
}

function UserFact({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-fifow-muted">{label}</p>
      <p className="mt-0.5 truncate font-extrabold text-fifow-secondary">{value}</p>
    </div>
  )
}

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function actionTitle(action) {
  return ({
    SUSPEND_USER: 'Suspendre ce compte',
    BAN_USER: 'Bannir ce compte',
    RESTORE_USER: 'Restaurer ce compte',
    REMOVE_VERIFIED_BADGE: 'Retirer le badge vendeur',
  })[action] || 'Confirmer cette action'
}

function roleLabel(role) {
  return ({
    USER: 'Utilisateur',
    MODERATOR: 'Modérateur',
    ADMIN: 'Administrateur',
    SUPER_ADMIN: 'Super administrateur',
  })[role] || role
}
