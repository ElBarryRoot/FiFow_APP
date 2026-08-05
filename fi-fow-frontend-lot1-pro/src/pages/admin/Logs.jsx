import { useInfiniteQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import AdminFormDialog from '../../components/admin/AdminFormDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate, shortId } from '../../lib/adminFormatters.js'

const targetTypes = ['USER', 'PRODUCT', 'REPORT', 'REVIEW', 'CONVERSATION', 'ORDER', 'PAYMENT', 'PAYOUT', 'CATEGORY', 'SETTING', 'BOOST', 'BOOST_PLAN', 'SUPPORT_TICKET']

export default function AdminLogs() {
  const [search, setSearch] = useState('')
  const [targetType, setTargetType] = useState('')
  const [selected, setSelected] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'logs', { search: debouncedSearch, targetType }],
    queryFn: ({ pageParam }) => adminApi.logs.list({ search: debouncedSearch, targetType, cursor: pageParam, limit: 40 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const columns = useMemo(() => [
    { key: 'createdAt', label: 'Date', render: (row) => formatAdminDate(row.createdAt) },
    { key: 'actor', label: 'Administrateur', render: (row) => <div><p className="font-bold text-fifow-dark">{row.actor?.fullName || 'Système'}</p><p className="text-xs text-fifow-muted">{row.actor?.email}</p></div> },
    { key: 'action', label: 'Action', render: (row) => <span className="font-mono text-xs font-extrabold text-fifow-primary">{row.action}</span> },
    { key: 'target', label: 'Cible', render: (row) => <div><p className="font-bold text-fifow-dark">{row.targetType}</p><p className="font-mono text-xs text-fifow-muted">{shortId(row.targetId || row.targetRef)}</p></div> },
    { key: 'requestId', label: 'Requête', render: (row) => <span className="font-mono text-xs">{shortId(row.requestId)}</span> },
    { key: 'ipAddress', label: 'Adresse IP', render: (row) => row.ipAddress || '—' },
  ], [])
  return <AdminPage eyebrow="Traçabilité" title="Journal d’audit" description="Retrouvez chaque décision sensible avec son acteur, sa cible et son contexte technique.">
    <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Action, acteur, requête ou cible">
      <Select value={targetType} onChange={(event) => setTargetType(event.target.value)} className="h-11 sm:w-56"><option value="">Toutes les cibles</option>{targetTypes.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
      {targetType ? <button type="button" onClick={() => setTargetType('')} className="h-11 px-3 text-sm font-extrabold text-fifow-primary">Réinitialiser la cible</button> : null}
    </AdminListToolbar>
    {query.isLoading ? <AdminLoading /> : null}
    {query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.action} mobileSubtitle={(row) => `${row.actor?.fullName || 'Système'} · ${formatAdminDate(row.createdAt)}`} actions={(row) => <Button type="button" size="sm" variant="secondary" icon={Eye} onClick={() => setSelected(row)}>Détails</Button>} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune entrée d’audit" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminFormDialog open={Boolean(selected)} title="Détail de l’action" description={`${selected?.action || ''} · ${formatAdminDate(selected?.createdAt)}`} confirmLabel="Fermer" onClose={() => setSelected(null)} onSubmit={(event) => { event.preventDefault(); setSelected(null) }}>
      <dl className="grid gap-4 sm:grid-cols-2"><Detail label="Acteur" value={selected?.actor?.fullName} /><Detail label="Email" value={selected?.actor?.email} /><Detail label="Cible" value={`${selected?.targetType || '—'} · ${selected?.targetId || selected?.targetRef || '—'}`} /><Detail label="Request ID" value={selected?.requestId} /><Detail label="Adresse IP" value={selected?.ipAddress} /><Detail label="Navigateur" value={selected?.userAgent} /></dl>
      {selected?.note ? <section className="mt-4"><h3 className="text-xs font-black uppercase text-fifow-muted">Note</h3><p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm font-semibold text-fifow-secondary">{selected.note}</p></section> : null}
      <JsonBlock title="Avant" value={selected?.before} /><JsonBlock title="Après" value={selected?.after} />
    </AdminFormDialog>
  </AdminPage>
}

function Detail({ label, value }) { return <div><dt className="text-xs font-black uppercase text-fifow-muted">{label}</dt><dd className="mt-1 break-all text-sm font-bold text-fifow-dark">{value || '—'}</dd></div> }
function JsonBlock({ title, value }) { if (value === undefined || value === null) return null; return <section className="mt-4"><h3 className="text-xs font-black uppercase text-fifow-muted">{title}</h3><pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">{JSON.stringify(value, null, 2)}</pre></section> }
