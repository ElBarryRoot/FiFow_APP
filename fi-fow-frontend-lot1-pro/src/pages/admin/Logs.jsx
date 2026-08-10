import { useInfiniteQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminFormDialog from '../../components/admin/AdminFormDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLiveStatus from '../../components/admin/AdminLiveStatus.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate } from '../../lib/adminFormatters.js'

const targetTypes = [
  { value: 'USER', label: 'Utilisateurs' },
  { value: 'PRODUCT', label: 'Annonces' },
  { value: 'REPORT', label: 'Signalements' },
  { value: 'REVIEW', label: 'Avis' },
  { value: 'CONVERSATION', label: 'Conversations' },
  { value: 'ORDER', label: 'Commandes' },
  { value: 'PAYMENT', label: 'Paiements' },
  { value: 'PAYOUT', label: 'Reversements' },
  { value: 'CATEGORY', label: 'Categories' },
  { value: 'SETTING', label: 'Reglages' },
  { value: 'BOOST', label: 'Boosts' },
  { value: 'BOOST_PLAN', label: 'Formules boost' },
  { value: 'SUPPORT_TICKET', label: 'Support' },
]

const actionLabels = {
  REPORT_ASSIGNED: 'Signalement pris en charge',
  REPORT_RESOLVED: 'Signalement traite',
  WARNING: 'Avertissement envoye',
  HIDE_PRODUCT: 'Annonce masquee',
  ARCHIVE_PRODUCT: 'Annonce archivee',
  RESTORE_PRODUCT: 'Annonce restauree',
  SUSPEND_USER: 'Compte suspendu',
  BAN_USER: 'Compte banni',
  RESTORE_USER: 'Compte restaure',
  REMOVE_VERIFIED_BADGE: 'Badge vendeur retire',
  HIDE_REVIEW: 'Avis masque',
  RESTORE_REVIEW: 'Avis restaure',
  BLOCK_CONVERSATION: 'Conversation bloquee',
  UNBLOCK_CONVERSATION: 'Conversation debloquee',
  SELLER_VERIFICATION_APPROVED: 'Vendeur verifie',
  SELLER_VERIFICATION_REJECTED: 'Verification vendeur refusee',
  CATEGORY_CREATED: 'Categorie creee',
  CATEGORY_UPDATED: 'Categorie mise a jour',
  CATEGORY_ARCHIVED: 'Categorie archivee',
  SETTING_UPDATED: 'Reglage mis a jour',
  PAYOUT_PROCESSING: 'Reversement transmis',
  REFUND_REQUESTED: 'Remboursement demande',
  BOOST_PLAN_CREATED: 'Formule boost creee',
  BOOST_PLAN_UPDATED: 'Formule boost mise a jour',
  BOOST_PLAN_ARCHIVED: 'Formule boost archivee',
  BOOST_CANCELLED: 'Boost annule',
  SUPPORT_TICKET_ASSIGNED: 'Demande support attribuee',
  SUPPORT_TICKET_STATUS_UPDATED: 'Statut support mis a jour',
  SUPPORT_TICKET_MESSAGE_SENT: 'Reponse support envoyee',
}

const targetLabels = {
  USER: 'Utilisateur',
  PRODUCT: 'Annonce',
  REPORT: 'Signalement',
  REVIEW: 'Avis',
  CONVERSATION: 'Conversation',
  ORDER: 'Commande',
  PAYMENT: 'Paiement',
  PAYOUT: 'Reversement',
  CATEGORY: 'Categorie',
  SETTING: 'Reglage',
  BOOST: 'Boost',
  BOOST_PLAN: 'Formule boost',
  SUPPORT_TICKET: 'Demande support',
}

export default function AdminLogs() {
  const auth = useAuth()
  const [search, setSearch] = useState('')
  const [targetType, setTargetType] = useState('')
  const [selected, setSelected] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: queryKeys.admin.logs({ search: debouncedSearch, targetType }),
    queryFn: ({ pageParam }) => adminApi.logs.list({
      search: debouncedSearch,
      targetType,
      cursor: pageParam,
      limit: 40,
    }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    refetchInterval: 90_000,
    refetchIntervalInBackground: false,
    refetchOnReconnect: true,
  })
  const rows = flattenAdminPages(query.data)
  const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN'

  const columns = useMemo(() => [
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => formatAdminDate(row.createdAt),
    },
    {
      key: 'action',
      label: 'Decision',
      render: (row) => <span className="font-extrabold text-fifow-dark">{actionLabel(row.action)}</span>,
    },
    {
      key: 'target',
      label: 'Element concerne',
      render: (row) => targetLabel(row.targetType),
    },
    {
      key: 'actor',
      label: 'Effectuee par',
      render: (row) => (
        <div>
          <p className="font-bold text-fifow-dark">{row.actor?.fullName || 'Systeme Fi Fow'}</p>
          {row.actor?.email ? <p className="text-xs text-fifow-muted">{row.actor.email}</p> : null}
        </div>
      ),
    },
    {
      key: 'note',
      label: 'Motif',
      render: (row) => <span className="line-clamp-2 max-w-72 text-sm">{row.note || 'Aucun motif ajoute'}</span>,
    },
  ], [])

  return (
    <AdminPage
      eyebrow="Suivi des decisions"
      title="Historique des actions"
      description="Retrouvez les decisions importantes, leur auteur et le motif associe."
      actions={<AdminLiveStatus />}
    >
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Personne, decision ou element"
        hasAdditionalFilters={Boolean(targetType)}
        onClearAdditionalFilters={() => setTargetType('')}
      >
        <Select value={targetType} onChange={(event) => setTargetType(event.target.value)} className="h-11 sm:w-56">
          <option value="">Tous les elements</option>
          {targetTypes.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
        </Select>
      </AdminListToolbar>

      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? (
        <AdminTable
          columns={columns}
          rows={rows}
          mobileTitle={(row) => actionLabel(row.action)}
          mobileSubtitle={(row) => `${targetLabel(row.targetType)} - ${formatAdminDate(row.createdAt)}`}
          actions={(row) => (
            <Button type="button" size="sm" variant="secondary" icon={Eye} onClick={() => setSelected(row)}>
              Voir
            </Button>
          )}
        />
      ) : null}
      {!query.isLoading && !query.isError && !rows.length ? (
        <AdminEmpty
          title={search || targetType ? 'Aucune action avec ces filtres' : 'Aucune action enregistree'}
          description={search || targetType ? 'Modifiez votre recherche ou le type d element.' : 'Les prochaines decisions apparaitront ici.'}
        />
      ) : null}
      <AdminLoadMore
        hasNextPage={query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={query.fetchNextPage}
      />

      <AdminFormDialog
        open={Boolean(selected)}
        title="Detail de la decision"
        description={`${actionLabel(selected?.action)} - ${formatAdminDate(selected?.createdAt)}`}
        confirmLabel="Fermer"
        onClose={() => setSelected(null)}
        onSubmit={(event) => {
          event.preventDefault()
          setSelected(null)
        }}
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Decision" value={actionLabel(selected?.action)} />
          <Detail label="Element concerne" value={targetLabel(selected?.targetType)} />
          <Detail label="Effectuee par" value={selected?.actor?.fullName || 'Systeme Fi Fow'} />
          <Detail label="Date" value={formatAdminDate(selected?.createdAt)} />
        </dl>

        {selected?.note ? (
          <section className="mt-5 rounded-lg border border-fifow-border bg-slate-50 p-4">
            <h3 className="text-sm font-extrabold text-fifow-dark">Motif de la decision</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-fifow-secondary">{selected.note}</p>
          </section>
        ) : null}

        {isSuperAdmin && selected?.diagnosticsAvailable ? <Diagnostics log={selected} /> : null}
      </AdminFormDialog>
    </AdminPage>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-fifow-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-fifow-dark">{value || 'Non renseigne'}</dd>
    </div>
  )
}

function Diagnostics({ log }) {
  return (
    <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-extrabold text-fifow-dark">Informations de diagnostic</summary>
      <p className="mt-2 text-xs font-semibold leading-5 text-fifow-secondary">
        Reserve aux super administrateurs pour analyser un incident precis.
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Detail label="Identifiant de requete" value={log.requestId} />
        <Detail label="Adresse IP" value={log.ipAddress} />
      </dl>
      {log.userAgent ? <DiagnosticBlock title="Navigateur" value={log.userAgent} /> : null}
      <DiagnosticBlock title="Avant" value={log.before} />
      <DiagnosticBlock title="Apres" value={log.after} />
    </details>
  )
}

function DiagnosticBlock({ title, value }) {
  if (value === undefined || value === null) return null
  return (
    <section className="mt-4">
      <h3 className="text-xs font-black uppercase text-fifow-muted">{title}</h3>
      <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  )
}

function actionLabel(action) {
  if (actionLabels[action]) return actionLabels[action]
  if (!action) return 'Decision administrative'
  return String(action)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .join(' ')
}

function targetLabel(targetType) {
  return targetLabels[targetType] || 'Element marketplace'
}

export { actionLabel, targetLabel }
