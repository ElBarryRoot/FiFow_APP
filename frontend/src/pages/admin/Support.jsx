import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Select from '../../components/ui/Select.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate } from '../../lib/adminFormatters.js'

const statuses = [
  { value: 'OPEN', label: 'Ouverts' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'WAITING_FOR_USER', label: 'Réponse utilisateur' },
  { value: 'RESOLVED', label: 'Résolus' },
  { value: 'CLOSED', label: 'Fermés' },
]

export default function AdminSupport() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('OPEN')
  const [priority, setPriority] = useState('')
  const [assigned, setAssigned] = useState('all')
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'support', { search: debouncedSearch, status, priority, assigned }],
    queryFn: ({ pageParam }) => adminApi.support.list({ search: debouncedSearch, status, priority, assigned, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const columns = useMemo(() => [
    { key: 'reference', label: 'Ticket', render: (row) => <div><p className="font-mono text-xs font-extrabold text-fifow-primary">{row.reference}</p><p className="mt-1 max-w-sm font-extrabold text-fifow-dark">{row.subject}</p></div> },
    { key: 'requester', label: 'Demandeur', render: (row) => <div><p className="font-bold text-fifow-dark">{row.requester?.fullName || 'Utilisateur'}</p><p className="text-xs text-fifow-muted">{row.requester?.email}</p></div> },
    { key: 'topic', label: 'Sujet', render: (row) => row.topic },
    { key: 'priority', label: 'Priorité', render: (row) => <Priority value={row.priority} /> },
    { key: 'assignedTo', label: 'Assigné', render: (row) => row.assignedTo?.fullName || 'Non assigné' },
    { key: 'lastMessageAt', label: 'Dernier message', render: (row) => formatAdminDate(row.lastMessageAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <AdminPage eyebrow="Assistance" title="Support" description="Répondez aux demandes dans leur contexte et conservez un historique clair des échanges.">
    <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Référence, sujet ou utilisateur" status={status} onStatusChange={setStatus} statusOptions={statuses}>
      <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-11 sm:w-48"><option value="">Toutes priorités</option><option value="URGENT">Urgente</option><option value="HIGH">Haute</option><option value="MEDIUM">Moyenne</option><option value="LOW">Basse</option></Select>
      <Select value={assigned} onChange={(event) => setAssigned(event.target.value)} className="h-11 sm:w-48"><option value="all">Tous les tickets</option><option value="me">Mes tickets</option><option value="unassigned">Non assignés</option></Select>
      {priority || assigned !== 'all' ? <button type="button" onClick={() => { setPriority(''); setAssigned('all') }} className="h-11 px-3 text-sm font-extrabold text-fifow-primary">Effacer l’affectation</button> : null}
    </AdminListToolbar>
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} rowLink={(row) => `/admin/support/${row.id}`} mobileTitle={(row) => row.subject} mobileSubtitle={(row) => `${row.reference} · ${row.requester?.fullName || 'Utilisateur'}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucun ticket" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
  </AdminPage>
}

function Priority({ value }) { const tone = value === 'URGENT' ? 'bg-red-50 text-red-700' : value === 'HIGH' ? 'bg-orange-50 text-orange-700' : value === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'; return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${tone}`}>{value || 'MEDIUM'}</span> }

export { statuses as supportStatuses }
