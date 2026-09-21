import { useInfiniteQuery } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import { flattenAdminPages, formatAdminDate, shortId } from '../../lib/adminFormatters.js'

const statuses = [
  { value: 'OPEN', label: 'Ouverts' },
  { value: 'UNDER_REVIEW', label: 'En traitement' },
  { value: 'RESOLVED', label: 'Résolus' },
  { value: 'REJECTED', label: 'Rejetés' },
]

export default function AdminReports() {
  const [status, setStatus] = useState('')
  const reportsQuery = useInfiniteQuery({
    queryKey: ['admin', 'reports', { status }],
    queryFn: ({ pageParam }) => adminApi.reports.list({ status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const reports = flattenAdminPages(reportsQuery.data)
  const columns = useMemo(() => [
    {
      key: 'target',
      label: 'Cible',
      render: (report) => <div><p className="font-extrabold text-fifow-dark">{targetLabel(report.targetType)}</p><p className="mt-0.5 font-mono text-xs text-fifow-muted">{shortId(report.targetId)}</p></div>,
    },
    { key: 'reason', label: 'Motif', render: (report) => reasonLabel(report.reason) },
    { key: 'priority', label: 'Priorité', render: (report) => <Priority value={report.priority} /> },
    { key: 'reporter', label: 'Auteur', render: (report) => <div><p className="font-bold text-fifow-dark">{report.reporter?.fullName || 'Inconnu'}</p><p className="text-xs text-fifow-muted">{report.reporter?.email}</p></div> },
    { key: 'createdAt', label: 'Reçu', render: (report) => formatAdminDate(report.createdAt) },
    { key: 'status', label: 'Statut', render: (report) => <AdminStatusBadge status={report.status} /> },
  ], [])

  return (
    <AdminPage eyebrow="Confiance et sécurité" title="Signalements" description="Traitez les dossiers selon leur priorité, leurs preuves et leur ancienneté.">
      <AdminListToolbar status={status} onStatusChange={setStatus} statusOptions={statuses} />
      {reportsQuery.isLoading ? <AdminLoading /> : null}
      {reportsQuery.isError ? <AdminError onRetry={reportsQuery.refetch} /> : null}
      {reports.length ? (
        <AdminTable
          columns={columns}
          rows={reports}
          rowLink={(report) => `/admin/reports/${report.id}`}
          mobileTitle={(report) => `${targetLabel(report.targetType)} · ${reasonLabel(report.reason)}`}
          mobileSubtitle={(report) => `${report.reporter?.fullName || 'Inconnu'} · ${formatAdminDate(report.createdAt)}`}
          mobileMeta={(report) => <AdminStatusBadge status={report.status} />}
        />
      ) : null}
      {!reportsQuery.isLoading && !reportsQuery.isError && !reports.length ? <AdminEmpty title="Aucun signalement" /> : null}
      <AdminLoadMore hasNextPage={reportsQuery.hasNextPage} loading={reportsQuery.isFetchingNextPage} onClick={reportsQuery.fetchNextPage} />
    </AdminPage>
  )
}

function Priority({ value }) {
  const classes = value === 'CRITICAL' ? 'bg-red-50 text-red-700' : value === 'HIGH' ? 'bg-orange-50 text-orange-700' : value === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${classes}`}>{value || 'MEDIUM'}</span>
}

function targetLabel(value) {
  return ({ PRODUCT: 'Annonce', USER: 'Utilisateur', MESSAGE: 'Message', REVIEW: 'Avis', PAYMENT: 'Paiement', CONVERSATION: 'Conversation', ORDER: 'Commande' })[value] || value
}

function reasonLabel(value) {
  return ({ SCAM: 'Arnaque', FAKE_PRODUCT: 'Produit factice', FORBIDDEN_PRODUCT: 'Produit interdit', BAD_BEHAVIOR: 'Comportement', OFFENSIVE_CONTENT: 'Contenu offensant', MISLEADING_PRICE: 'Prix trompeur', STOLEN_IMAGE: 'Image volée', UNREACHABLE_SELLER: 'Vendeur injoignable', PAYMENT_ISSUE: 'Paiement', DELIVERY_ISSUE: 'Livraison', OTHER: 'Autre' })[value] || value
}

export { reasonLabel, targetLabel }

