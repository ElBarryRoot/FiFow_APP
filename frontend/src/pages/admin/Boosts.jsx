import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, Pencil, Plus, XCircle } from 'lucide-react'
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
import Select from '../../components/ui/Select.jsx'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const boostStatuses = ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED']
  .map((value) => ({ value, label: adminStatusLabel(value) }))

const emptyPlan = {
  name: '',
  slug: '',
  durationHours: '24',
  price: '',
  placement: 'HOME_FEED',
}

export default function AdminBoosts() {
  const auth = useAuth()
  const [view, setView] = useState('campaigns')
  const canManageFinance = canAdmin(auth.user, 'manageFinance')
  const canManagePlans = canAdmin(auth.user, 'manageBoostPlans')

  return (
    <AdminPage
      eyebrow="Visibilite sponsorisee"
      title="Boosts"
      description="Suivez les campagnes actives et gerez les formules proposees aux vendeurs."
      actions={<BoostViewTabs view={view} onChange={setView} />}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-fifow-secondary">
          {view === 'campaigns'
            ? 'Chaque campagne indique clairement son etape suivante.'
            : 'Les changements de formule s appliquent aux nouveaux achats.'}
        </p>
        <AdminLiveStatus />
      </div>
      {view === 'campaigns'
        ? <BoostCampaigns canManage={canManageFinance} />
        : <BoostPlans canManage={canManagePlans} />}
    </AdminPage>
  )
}

function BoostViewTabs({ view, onChange }) {
  return (
    <div role="tablist" aria-label="Vue des boosts" className="inline-flex rounded-lg border border-fifow-border bg-white p-1">
      <button
        type="button"
        role="tab"
        aria-selected={view === 'campaigns'}
        onClick={() => onChange('campaigns')}
        className={`rounded-md px-4 py-2 text-sm font-extrabold transition-colors ${view === 'campaigns' ? 'bg-fifow-primary text-white' : 'text-fifow-secondary hover:bg-slate-100'}`}
      >
        Campagnes
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'plans'}
        onClick={() => onChange('plans')}
        className={`rounded-md px-4 py-2 text-sm font-extrabold transition-colors ${view === 'plans' ? 'bg-fifow-primary text-white' : 'text-fifow-secondary hover:bg-slate-100'}`}
      >
        Formules
      </button>
    </div>
  )
}

function BoostCampaigns({ canManage }) {
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const query = useInfiniteQuery({
    queryKey: queryKeys.admin.boosts({ status }),
    queryFn: ({ pageParam }) => adminApi.boosts.list({ status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
    refetchOnReconnect: true,
  })
  const rows = flattenAdminPages(query.data)
  const cancelMutation = useMutation({
    mutationFn: (reason) => adminApi.boosts.cancel(selected.id, reason),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.boostsRoot })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      showToast('Boost annule. La campagne ne sera plus mise en avant.')
      setSelected(null)
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })

  const columns = useMemo(() => [
    {
      key: 'product',
      label: 'Annonce',
      render: (row) => (
        <div>
          <p className="font-extrabold text-fifow-dark">{row.product?.title || 'Annonce indisponible'}</p>
          <p className="text-xs text-fifow-muted">{row.seller?.fullName || 'Vendeur'}</p>
        </div>
      ),
    },
    { key: 'plan', label: 'Formule', render: (row) => row.plan?.name || 'Formule indisponible' },
    { key: 'amount', label: 'Montant', render: (row) => formatAdminMoney(row.plan?.price || row.payment?.amount) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: 'nextStep',
      label: 'Etape suivante',
      render: (row) => <span className="max-w-56 text-sm font-semibold text-fifow-secondary">{campaignGuidance(row)}</span>,
    },
    { key: 'endsAt', label: 'Fin', render: (row) => formatAdminDate(row.endsAt) },
  ], [])

  return (
    <>
      <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={boostStatuses} />
      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? (
        <AdminTable
          columns={columns}
          rows={rows}
          mobileTitle={(row) => row.product?.title || 'Boost'}
          mobileSubtitle={(row) => `${row.plan?.name || 'Formule'} - ${campaignGuidance(row)}`}
          mobileMeta={(row) => <AdminStatusBadge status={row.status} />}
          actions={canManage ? (row) => (
            canCancelCampaign(row)
              ? <Button type="button" size="sm" variant="danger" icon={XCircle} onClick={() => setSelected(row)}>Annuler</Button>
              : null
          ) : undefined}
        />
      ) : null}
      {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune campagne boost" /> : null}
      <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
      <AdminConfirmDialog
        open={Boolean(selected)}
        title="Annuler cette campagne"
        description="L annonce ne sera plus mise en avant. Si le paiement est confirme, Fi Fow preparera une demande de remboursement a verifier."
        confirmLabel="Annuler la campagne"
        requireReason
        reasonLabel="Motif de l annulation"
        loading={cancelMutation.isPending}
        onClose={() => setSelected(null)}
        onConfirm={(reason) => cancelMutation.mutate(reason)}
      />
    </>
  )
}

function BoostPlans({ canManage }) {
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null)
  const [archive, setArchive] = useState(null)
  const query = useInfiniteQuery({
    queryKey: queryKeys.admin.boostPlans({ status }),
    queryFn: ({ pageParam }) => adminApi.boostPlans.list({ status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnReconnect: true,
  })
  const rows = flattenAdminPages(query.data)
  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        durationHours: Number(form.durationHours),
        price: form.price,
        placement: form.placement,
      }
      return form.id ? adminApi.boostPlans.update(form.id, input) : adminApi.boostPlans.create(input)
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.boostPlansRoot })
      showToast(form.id ? 'Formule mise a jour.' : 'Formule creee.')
      setForm(null)
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })
  const archiveMutation = useMutation({
    mutationFn: () => adminApi.boostPlans.archive(archive.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.boostPlansRoot })
      showToast('Formule archivee. Les campagnes en cours ne changent pas.')
      setArchive(null)
    },
    onError(error) {
      showToast(errorMessage(error), { type: 'error' })
    },
  })

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Formule',
      render: (row) => (
        <div>
          <p className="font-extrabold text-fifow-dark">{row.name}</p>
          <p className="text-xs text-fifow-muted">{placementLabel(row.placement)}</p>
        </div>
      ),
    },
    { key: 'durationHours', label: 'Duree', render: (row) => durationLabel(row.durationHours) },
    { key: 'price', label: 'Prix', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.price)}</span> },
    {
      key: 'status',
      label: 'Disponibilite',
      render: (row) => <AdminStatusBadge status={row.isActive && !row.archivedAt ? 'ACTIVE' : 'ARCHIVED'} />,
    },
  ], [])

  function submit(event) {
    event.preventDefault()
    if (validPlan(form)) saveMutation.mutate()
  }

  return (
    <>
      <AdminListToolbar
        status={status}
        onStatusChange={setStatus}
        statusOptions={[
          { value: 'active', label: 'Actives' },
          { value: 'archived', label: 'Archivees' },
        ]}
      >
        {canManage ? <Button type="button" size="sm" icon={Plus} onClick={() => setForm({ ...emptyPlan })}>Nouvelle formule</Button> : null}
      </AdminListToolbar>
      {query.isLoading ? <AdminLoading /> : null}
      {query.isError ? <AdminError onRetry={query.refetch} /> : null}
      {rows.length ? (
        <AdminTable
          columns={columns}
          rows={rows}
          mobileTitle={(row) => row.name}
          mobileSubtitle={(row) => `${durationLabel(row.durationHours)} - ${formatAdminMoney(row.price)}`}
          mobileMeta={(row) => <AdminStatusBadge status={row.isActive && !row.archivedAt ? 'ACTIVE' : 'ARCHIVED'} />}
          actions={canManage ? (row) => (
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="secondary" icon={Pencil} onClick={() => setForm(planForm(row))}>Modifier</Button>
              {!row.archivedAt ? <Button type="button" size="sm" variant="danger" icon={Archive} onClick={() => setArchive(row)}>Archiver</Button> : null}
            </div>
          ) : undefined}
        />
      ) : null}
      {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune formule boost" /> : null}
      <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />

      <AdminFormDialog
        open={Boolean(form)}
        title={form?.id ? 'Modifier la formule' : 'Creer une formule'}
        description="La duree et le prix affiches seront utilises lors du prochain achat."
        confirmLabel={form?.id ? 'Enregistrer' : 'Creer'}
        loading={saveMutation.isPending}
        disabled={!validPlan(form)}
        onClose={() => setForm(null)}
        onSubmit={submit}
      >
        {form ? <PlanForm form={form} onChange={setForm} /> : null}
      </AdminFormDialog>
      <AdminConfirmDialog
        open={Boolean(archive)}
        title="Archiver cette formule"
        description="Elle ne sera plus proposee pour les nouveaux boosts. Les campagnes existantes restent actives."
        confirmLabel="Archiver"
        requireReason={false}
        loading={archiveMutation.isPending}
        onClose={() => setArchive(null)}
        onConfirm={() => archiveMutation.mutate()}
      />
    </>
  )
}

function PlanForm({ form, onChange }) {
  const update = (values) => onChange({ ...form, ...values })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom">
        <Input value={form.name} onChange={(event) => update({ name: event.target.value })} maxLength={80} className="mt-2 h-12" />
      </Field>
      <Field label="Identifiant de formule">
        <Input
          value={form.slug}
          onChange={(event) => update({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
          maxLength={100}
          className="mt-2 h-12"
        />
      </Field>
      <Field label="Duree en heures">
        <Input
          value={form.durationHours}
          onChange={(event) => update({ durationHours: event.target.value.replace(/\D/g, '').slice(0, 4) })}
          inputMode="numeric"
          className="mt-2 h-12"
        />
      </Field>
      <Field label="Prix en GNF">
        <Input
          value={form.price}
          onChange={(event) => update({ price: event.target.value.replace(/\D/g, '').slice(0, 15) })}
          inputMode="numeric"
          className="mt-2 h-12"
        />
      </Field>
      <Field label="Emplacement" className="sm:col-span-2">
        <Select value={form.placement} onChange={(event) => update({ placement: event.target.value })} className="mt-2 h-12">
          <option value="HOME_FEED">Accueil</option>
          <option value="SEARCH_RESULTS">Resultats de recherche</option>
          <option value="CATEGORY_PAGE">Page categorie</option>
          <option value="SIMILAR_PRODUCTS">Produits similaires</option>
        </Select>
      </Field>
    </div>
  )
}

function Field({ label, className = '', children }) {
  return (
    <label className={className}>
      <span className="text-sm font-extrabold text-fifow-dark">{label}</span>
      {children}
    </label>
  )
}

function campaignGuidance(row) {
  if (row.status === 'PENDING_PAYMENT') return 'Attente du paiement du vendeur'
  if (row.status === 'ACTIVE') return row.endsAt ? `Visible jusqu au ${formatAdminDate(row.endsAt)}` : 'Annonce actuellement mise en avant'
  if (row.status === 'EXPIRED') return 'Campagne terminee'
  if (row.status === 'CANCELLED') return 'Campagne arretee'
  if (row.status === 'REJECTED') return 'Paiement non confirme'
  return 'Verification en cours'
}

function canCancelCampaign(row) {
  return ['PENDING_PAYMENT', 'ACTIVE'].includes(row.status)
}

function durationLabel(hours) {
  const value = Number(hours || 0)
  if (value % 24 === 0) {
    const days = value / 24
    return `${days} jour${days > 1 ? 's' : ''}`
  }
  return `${value} h`
}

function placementLabel(value) {
  return {
    HOME_FEED: 'Accueil',
    SEARCH_RESULTS: 'Resultats de recherche',
    CATEGORY_PAGE: 'Page categorie',
    SIMILAR_PRODUCTS: 'Produits similaires',
  }[value] || 'Emplacement non defini'
}

function planForm(plan) {
  return {
    ...plan,
    durationHours: String(plan.durationHours || ''),
    price: String(plan.price || ''),
  }
}

function validPlan(value) {
  return Boolean(
    value
    && value.name.trim().length >= 2
    && /^[a-z0-9-]{2,100}$/.test(value.slug)
    && Number(value.durationHours) >= 1
    && Number(value.durationHours) <= 8760
    && /^\d{3,15}$/.test(value.price),
  )
}

export { campaignGuidance, durationLabel, placementLabel, validPlan }
