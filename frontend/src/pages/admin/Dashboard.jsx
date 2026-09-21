import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, ClipboardList, Flag, PackageSearch, Users, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/admin.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { canAdmin } from '../../auth/adminAccess.js'
import AdminMetric from '../../components/admin/AdminMetric.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import Button from '../../components/ui/Button.jsx'
import { formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'

export default function AdminDashboard() {
  const auth = useAuth()
  const canViewFinance = canAdmin(auth.user, 'manageFinance')
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.dashboard,
    refetchInterval: 60_000,
  })
  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', 'dashboard'],
    queryFn: () => adminApi.reports.list({ status: 'OPEN', limit: 5 }),
  })
  const data = dashboardQuery.data

  return (
    <AdminPage
      eyebrow="Vue opérationnelle"
      title="Tableau de bord"
      description="Les files prioritaires et les montants proviennent directement de l’activité FiFow."
      actions={<Button as={Link} to="/admin/reports" size="sm" variant="secondary" icon={Flag}>Ouvrir la modération</Button>}
    >
      {dashboardQuery.isLoading ? <AdminLoading rows={4} /> : null}
      {dashboardQuery.isError ? <AdminError onRetry={dashboardQuery.refetch} /> : null}
      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AdminMetric label="Utilisateurs actifs" value={data.users || 0} icon={Users} tone="blue" to="/admin/users" />
            <AdminMetric label="Annonces suivies" value={data.products || 0} icon={PackageSearch} to="/admin/products" />
            <AdminMetric label="Signalements ouverts" value={data.openReports || 0} icon={Flag} tone={data.openReports ? 'red' : 'green'} to="/admin/reports" />
            <AdminMetric label="Litiges à traiter" value={data.openDisputes || 0} icon={ClipboardList} tone={data.openDisputes ? 'red' : 'green'} to="/admin/disputes" />
            <AdminMetric label="Commandes en cours" value={data.pendingOrders || 0} icon={ClipboardList} tone="orange" to="/admin/orders" />
            {canViewFinance ? <AdminMetric label="Paiements réussis" value={data.successfulPayments || 0} helper={formatAdminMoney(data.paymentVolume)} icon={WalletCards} tone="green" to="/admin/payments" /> : null}
            <AdminMetric label="Vérifications à traiter" value={data.pendingVerifications || 0} icon={BadgeCheck} tone="orange" to="/admin/verifications" />
          </div>

          <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-lg border border-fifow-border bg-white">
              <div className="flex items-center justify-between border-b border-fifow-border px-4 py-3">
                <div>
                  <h3 className="font-black text-fifow-dark">Signalements prioritaires</h3>
                  <p className="text-xs font-semibold text-fifow-secondary">Les plus anciens dossiers ouverts apparaissent en premier.</p>
                </div>
                <Link to="/admin/reports" className="text-sm font-extrabold text-fifow-primary">Voir la file</Link>
              </div>
              {reportsQuery.isLoading ? <AdminLoading rows={4} /> : null}
              {reportsQuery.isError ? <AdminError onRetry={reportsQuery.refetch} /> : null}
              {reportsQuery.data?.items?.length ? (
                <div className="divide-y divide-fifow-border">
                  {reportsQuery.data.items.map((report) => (
                    <Link key={report.id} to={`/admin/reports/${report.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-fifow-red"><Flag className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-fifow-dark">{report.targetType} · {report.reason}</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-fifow-secondary">{report.reporter?.fullName || 'Utilisateur'} · {formatAdminDate(report.createdAt)}</p>
                      </div>
                      <AdminStatusBadge status={report.status} />
                    </Link>
                  ))}
                </div>
              ) : null}
              {!reportsQuery.isLoading && !reportsQuery.isError && !reportsQuery.data?.items?.length ? <AdminEmpty title="File à jour" description="Aucun signalement ouvert ne demande une action immédiate." /> : null}
            </section>

            <aside className="rounded-lg border border-red-100 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-fifow-red"><ClipboardList className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-black text-fifow-dark">Litiges à traiter</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Un litige suspend le versement au vendeur jusqu’à la vérification du dossier.</p>
                  <Button as={Link} to="/admin/disputes" size="sm" variant="danger" className="mt-4">Ouvrir les litiges</Button>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </AdminPage>
  )
}
