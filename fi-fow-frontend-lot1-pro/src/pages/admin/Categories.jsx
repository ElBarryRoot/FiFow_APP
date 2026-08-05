import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Pencil, Plus } from 'lucide-react'
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
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const emptyCategory = { name: '', slug: '', parentId: '', description: '', isSensitive: false, requiresAdminValidation: false, sortOrder: '0' }
const statuses = [{ value: 'active', label: 'Actives' }, { value: 'archived', label: 'Archivées' }]

export default function AdminCategories() {
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [form, setForm] = useState(null)
  const [archive, setArchive] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'categories', { search: debouncedSearch, status }],
    queryFn: ({ pageParam }) => adminApi.categories.list({ search: debouncedSearch, status, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const parentQuery = useQuery({
    queryKey: ['admin', 'categories', 'parents'],
    queryFn: () => adminApi.categories.list({ status: 'active', limit: 100 }),
  })
  const parents = (parentQuery.data?.items || []).filter((row) => !row.parentId && !row.archivedAt)
  const canManage = canAdmin(auth.user, 'manageCatalogue')
  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        name: form.name.trim(), slug: form.slug.trim(), parentId: form.parentId || null,
        description: form.id ? form.description.trim() : form.description.trim() || undefined, isSensitive: form.isSensitive,
        requiresAdminValidation: form.requiresAdminValidation, sortOrder: Number(form.sortOrder),
      }
      return form.id ? adminApi.categories.update(form.id, input) : adminApi.categories.create(input)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast(form.id ? 'Catégorie mise à jour.' : 'Catégorie créée.')
      setForm(null)
    },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const archiveMutation = useMutation({
    mutationFn: () => adminApi.categories.archive(archive.id),
    onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }); queryClient.invalidateQueries({ queryKey: ['categories'] }); showToast('Catégorie archivée.'); setArchive(null) },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const columns = useMemo(() => [
    { key: 'name', label: 'Catégorie', render: (row) => <div><p className="font-extrabold text-fifow-dark">{row.name}</p><p className="font-mono text-xs text-fifow-muted">{row.slug}</p></div> },
    { key: 'parent', label: 'Parent', render: (row) => row.parent?.name || 'Catégorie principale' },
    { key: 'products', label: 'Annonces', render: (row) => (row._count?.products || 0) + (row._count?.subcategoryItems || 0) },
    { key: 'children', label: 'Sous-catégories', render: (row) => row._count?.children || 0 },
    { key: 'rules', label: 'Contrôle', render: (row) => <Rules row={row} /> },
    { key: 'sortOrder', label: 'Ordre', render: (row) => row.sortOrder },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.isActive && !row.archivedAt ? 'ACTIVE' : 'ARCHIVED'} /> },
  ], [])

  function openEdit(row) { setForm({ ...row, parentId: row.parentId || '', description: row.description || '', sortOrder: String(row.sortOrder ?? 0) }) }
  function changeName(value) { setForm((current) => ({ ...current, name: value, ...(!current.id ? { slug: slugify(value) } : {}) })) }
  function submit(event) { event.preventDefault(); if (validCategory(form)) saveMutation.mutate() }

  return <AdminPage eyebrow="Structure du catalogue" title="Catégories" description="Organisez les rayons et appliquez les contrôles adaptés aux produits sensibles." actions={canManage ? <Button type="button" size="sm" icon={Plus} onClick={() => setForm({ ...emptyCategory })}>Nouvelle catégorie</Button> : null}>
    <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Nom ou slug" status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}
    {query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.name} mobileSubtitle={(row) => row.parent?.name || 'Catégorie principale'} mobileMeta={(row) => <AdminStatusBadge status={row.isActive && !row.archivedAt ? 'ACTIVE' : 'ARCHIVED'} />} actions={canManage ? (row) => <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(row)}>Modifier</Button>{!row.archivedAt ? <Button type="button" size="sm" variant="danger" icon={Archive} onClick={() => setArchive(row)}>Archiver</Button> : null}</div> : undefined} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune catégorie" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminFormDialog open={Boolean(form)} title={form?.id ? 'Modifier la catégorie' : 'Créer une catégorie'} description="Les règles choisies s’appliquent aux nouvelles annonces de ce rayon." confirmLabel={form?.id ? 'Enregistrer' : 'Créer'} loading={saveMutation.isPending} disabled={!validCategory(form)} onClose={() => setForm(null)} onSubmit={submit}>
      {form ? <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom"><Input value={form.name} onChange={(event) => changeName(event.target.value)} maxLength={80} className="mt-2 h-12" /></Field>
        <Field label="Slug"><Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} maxLength={100} className="mt-2 h-12" /></Field>
        <Field label="Catégorie parente"><Select value={form.parentId} disabled={parentQuery.isLoading || parentQuery.isError} onChange={(event) => setForm({ ...form, parentId: event.target.value })} className="mt-2 h-12"><option value="">{parentQuery.isError ? 'Parents indisponibles' : 'Aucune'}</option>{parents.filter((parent) => parent.id !== form.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</Select></Field>
        <Field label="Ordre d’affichage"><Input value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/\D/g, '').slice(0, 5) })} inputMode="numeric" className="mt-2 h-12" /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={500} className="mt-2 min-h-24" /></Field>
        <CheckField checked={form.isSensitive} onChange={(checked) => setForm({ ...form, isSensitive: checked })} title="Catégorie sensible" description="Renforce la vigilance de modération." />
        <CheckField checked={form.requiresAdminValidation} onChange={(checked) => setForm({ ...form, requiresAdminValidation: checked })} title="Validation obligatoire" description="Publication après contrôle manuel." />
      </div> : null}
    </AdminFormDialog>
    <AdminConfirmDialog open={Boolean(archive)} title="Archiver cette catégorie" description="L’archivage est refusé si des annonces actives utilisent encore cette catégorie." confirmLabel="Archiver" loading={archiveMutation.isPending} onClose={() => setArchive(null)} onConfirm={() => archiveMutation.mutate()} />
  </AdminPage>
}

function Rules({ row }) { return <div className="flex flex-wrap gap-1">{row.isSensitive ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Sensible</span> : null}{row.requiresAdminValidation ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Validation</span> : null}{!row.isSensitive && !row.requiresAdminValidation ? 'Standard' : null}</div> }
function Field({ label, className = '', children }) { return <label className={className}><span className="text-sm font-extrabold text-fifow-dark">{label}</span>{children}</label> }
function CheckField({ checked, onChange, title, description }) { return <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-fifow-border p-3"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-fifow-primary" /><span><strong className="block text-sm text-fifow-dark">{title}</strong><span className="text-xs font-semibold text-fifow-secondary">{description}</span></span></label> }
function slugify(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) }
function validCategory(value) { return Boolean(value && value.name.trim().length >= 2 && /^[a-z0-9-]{2,100}$/.test(value.slug) && Number(value.sortOrder) >= 0 && Number(value.sortOrder) <= 10000) }
