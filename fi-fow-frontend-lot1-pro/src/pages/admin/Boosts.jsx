import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, Pencil, Plus, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import { canAdmin } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminFormDialog from '../../components/admin/AdminFormDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
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

const boostStatuses = ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED'].map((value) => ({ value, label: adminStatusLabel(value) }))
const emptyPlan = { name: '', slug: '', durationHours: '24', price: '', placement: 'HOME_FEED' }

export default function AdminBoosts() {
  const auth = useAuth()
  const [view, setView] = useState('boosts')
  const canManageFinance = canAdmin(auth.user, 'manageFinance')
  return <AdminPage eyebrow="Visibilité sponsorisée" title="Boosts" description="Suivez les campagnes actives et gérez les formules disponibles pour les vendeurs." actions={<div className="inline-flex rounded-lg border border-fifow-border bg-white p-1"><button type="button" onClick={() => setView('boosts')} className={`rounded-md px-4 py-2 text-sm font-extrabold ${view === 'boosts' ? 'bg-fifow-primary text-white' : 'text-fifow-secondary'}`}>Campagnes</button><button type="button" onClick={() => setView('plans')} className={`rounded-md px-4 py-2 text-sm font-extrabold ${view === 'plans' ? 'bg-fifow-primary text-white' : 'text-fifow-secondary'}`}>Formules</button></div>}>
    {view === 'boosts' ? <BoostCampaigns canManage={canManageFinance} /> : <BoostPlans canManage={canAdmin(auth.user, 'manageBoostPlans')} />}
  </AdminPage>
}

function BoostCampaigns({ canManage }) {
  const showToast = useToast(); const queryClient = useQueryClient(); const [status, setStatus] = useState(''); const [selected, setSelected] = useState(null)
  const query = useInfiniteQuery({ queryKey: ['admin', 'boosts', { status }], queryFn: ({ pageParam }) => adminApi.boosts.list({ status, cursor: pageParam, limit: 30 }), initialPageParam: undefined, getNextPageParam: (page) => page.nextCursor || undefined })
  const rows = flattenAdminPages(query.data)
  const mutation = useMutation({ mutationFn: (reason) => adminApi.boosts.cancel(selected.id, reason), onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'boosts'] }); showToast('Boost annulé.'); setSelected(null) }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const columns = useMemo(() => [
    { key: 'product', label: 'Annonce', render: (row) => <div><p className="font-extrabold text-fifow-dark">{row.product?.title || 'Annonce'}</p><p className="text-xs text-fifow-muted">{row.seller?.fullName || 'Vendeur'}</p></div> },
    { key: 'plan', label: 'Formule', render: (row) => row.plan?.name || '—' },
    { key: 'amount', label: 'Prix', render: (row) => formatAdminMoney(row.plan?.price || row.payment?.amount) },
    { key: 'startsAt', label: 'Début', render: (row) => formatAdminDate(row.startsAt) },
    { key: 'endsAt', label: 'Fin', render: (row) => formatAdminDate(row.endsAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <><AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={boostStatuses} />{query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}{rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.product?.title || 'Boost'} mobileSubtitle={(row) => `${row.plan?.name || 'Formule'} · ${row.seller?.fullName || 'Vendeur'}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={canManage ? (row) => ['PENDING_PAYMENT', 'ACTIVE'].includes(row.status) ? <Button type="button" size="sm" variant="danger" icon={XCircle} onClick={() => setSelected(row)}>Annuler</Button> : null : undefined} /> : null}{!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun boost" /> : null}<AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} /><AdminConfirmDialog open={Boolean(selected)} title="Annuler ce boost" description="Un paiement confirmé déclenchera une demande de remboursement." confirmLabel="Annuler le boost" requireReason loading={mutation.isPending} onClose={() => setSelected(null)} onConfirm={(reason) => mutation.mutate(reason)} /></>
}

function BoostPlans({ canManage }) {
  const showToast = useToast(); const queryClient = useQueryClient(); const [status, setStatus] = useState(''); const [form, setForm] = useState(null); const [archive, setArchive] = useState(null)
  const query = useInfiniteQuery({ queryKey: ['admin', 'boost-plans', { status }], queryFn: ({ pageParam }) => adminApi.boostPlans.list({ status, cursor: pageParam, limit: 30 }), initialPageParam: undefined, getNextPageParam: (page) => page.nextCursor || undefined })
  const rows = flattenAdminPages(query.data)
  const saveMutation = useMutation({ mutationFn: () => { const input = { name: form.name.trim(), slug: form.slug.trim(), durationHours: Number(form.durationHours), price: form.price, placement: form.placement }; return form.id ? adminApi.boostPlans.update(form.id, input) : adminApi.boostPlans.create(input) }, onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'boost-plans'] }); showToast(form.id ? 'Formule mise à jour.' : 'Formule créée.'); setForm(null) }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const archiveMutation = useMutation({ mutationFn: () => adminApi.boostPlans.archive(archive.id), onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'boost-plans'] }); showToast('Formule archivée.'); setArchive(null) }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const columns = useMemo(() => [
    { key: 'name', label: 'Formule', render: (row) => <div><p className="font-extrabold text-fifow-dark">{row.name}</p><p className="font-mono text-xs text-fifow-muted">{row.slug}</p></div> },
    { key: 'durationHours', label: 'Durée', render: (row) => durationLabel(row.durationHours) },
    { key: 'placement', label: 'Emplacement', render: (row) => placementLabel(row.placement) },
    { key: 'price', label: 'Prix', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.price)}</span> },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.isActive && !row.archivedAt ? 'ACTIVE' : 'ARCHIVED'} /> },
  ], [])
  function submit(event) { event.preventDefault(); if (validPlan(form)) saveMutation.mutate() }
  return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={[{ value: 'active', label: 'Actives' }, { value: 'archived', label: 'Archivées' }]} />{canManage ? <Button type="button" size="sm" icon={Plus} onClick={() => setForm({ ...emptyPlan })}>Nouvelle formule</Button> : null}</div>{query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}{rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.name} mobileSubtitle={(row) => `${durationLabel(row.durationHours)} · ${formatAdminMoney(row.price)}`} mobileMeta={(row) => <AdminStatusBadge status={row.isActive && !row.archivedAt ? 'ACTIVE' : 'ARCHIVED'} />} actions={canManage ? (row) => <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="secondary" icon={Pencil} onClick={() => setForm({ ...row, durationHours: String(row.durationHours), price: String(row.price) })}>Modifier</Button>{!row.archivedAt ? <Button type="button" size="sm" variant="danger" icon={Archive} onClick={() => setArchive(row)}>Archiver</Button> : null}</div> : undefined} /> : null}{!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune formule" /> : null}<AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminFormDialog open={Boolean(form)} title={form?.id ? 'Modifier la formule' : 'Créer une formule'} description="La durée et le prix affichés seront utilisés lors du prochain achat." confirmLabel={form?.id ? 'Enregistrer' : 'Créer'} loading={saveMutation.isPending} disabled={!validPlan(form)} onClose={() => setForm(null)} onSubmit={submit}>{form ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Nom"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={80} className="mt-2 h-12" /></Field><Field label="Slug"><Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} maxLength={100} className="mt-2 h-12" /></Field><Field label="Durée en heures"><Input value={form.durationHours} onChange={(event) => setForm({ ...form, durationHours: event.target.value.replace(/\D/g, '').slice(0, 4) })} inputMode="numeric" className="mt-2 h-12" /></Field><Field label="Prix en GNF"><Input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value.replace(/\D/g, '').slice(0, 15) })} inputMode="numeric" className="mt-2 h-12" /></Field><Field label="Emplacement" className="sm:col-span-2"><Select value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })} className="mt-2 h-12"><option value="HOME_FEED">Accueil</option><option value="SEARCH_RESULTS">Résultats de recherche</option><option value="CATEGORY_PAGE">Page catégorie</option><option value="SIMILAR_PRODUCTS">Produits similaires</option></Select></Field></div> : null}</AdminFormDialog>
    <AdminConfirmDialog open={Boolean(archive)} title="Archiver cette formule" description="Elle ne sera plus proposée pour de nouveaux boosts. Les campagnes existantes restent inchangées." confirmLabel="Archiver" requireReason={false} loading={archiveMutation.isPending} onClose={() => setArchive(null)} onConfirm={() => archiveMutation.mutate()} />
  </>
}

function Field({ label, className = '', children }) { return <label className={className}><span className="text-sm font-extrabold text-fifow-dark">{label}</span>{children}</label> }
function durationLabel(hours) { const value = Number(hours || 0); return value % 24 === 0 ? `${value / 24} jour${value > 24 ? 's' : ''}` : `${value} h` }
function placementLabel(value) { return ({ HOME_FEED: 'Accueil', SEARCH_RESULTS: 'Résultats de recherche', CATEGORY_PAGE: 'Page catégorie', SIMILAR_PRODUCTS: 'Produits similaires' })[value] || value || '—' }
function validPlan(value) { return Boolean(value && value.name.trim().length >= 2 && /^[a-z0-9-]{2,100}$/.test(value.slug) && Number(value.durationHours) >= 1 && Number(value.durationHours) <= 8760 && /^\d{3,15}$/.test(value.price)) }
