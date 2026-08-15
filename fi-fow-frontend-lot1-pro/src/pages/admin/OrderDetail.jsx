import { useQuery } from '@tanstack/react-query'
import { Banknote, CheckCircle2, MapPin, Package, UserRound } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { adminApi } from '../../api/admin.js'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge.jsx'
import { AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import Card from '../../components/ui/Card.jsx'
import { formatAdminDate, formatAdminMoney, shortId } from '../../lib/adminFormatters.js'
import { handoverLabel, productTitle } from './Orders.jsx'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const query = useQuery({ queryKey: ['admin', 'orders', id], queryFn: () => adminApi.orders.detail(id) })
  const order = query.data
  if (query.isLoading) return <AdminLoading rows={8} />
  if (query.isError || !order) return <AdminError message="Cette commande ne peut pas être chargée." onRetry={query.refetch} />
  const history = order.statusHistory || order.history || []
  return <AdminPage backTo="/admin/orders" eyebrow={`Commande · ${shortId(order.id)}`} title={order.reference || 'Commande'} description={`${productTitle(order)} · créée le ${formatAdminDate(order.createdAt)}`} actions={<AdminStatusBadge status={order.status} />}>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-lg font-black text-fifow-dark"><Package className="h-5 w-5 text-fifow-primary" />Transaction</h3>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label={order.items?.length > 1 ? 'Articles' : 'Produit'} value={productTitle(order)} />
            <Detail label="Mode de remise" value={handoverLabel(order.handoverMode)} />
            <Detail label="Montant article" value={formatAdminMoney(order.itemAmount)} />
            <Detail label="Protection acheteur" value={formatAdminMoney(order.buyerProtectionFee)} />
            <Detail label="Livraison" value={formatAdminMoney(order.deliveryFee)} />
            <Detail label="Total payé" value={formatAdminMoney(order.totalAmount)} strong />
          </dl>
          {order.items?.length > 1 ? <div className="mt-5 divide-y divide-fifow-border rounded-lg border border-fifow-border px-4">{order.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-black text-fifow-dark">{item.product?.title || item.productSnapshot?.title}</p><p className="mt-0.5 text-xs font-bold text-fifow-secondary">Quantité {item.quantity}</p></div><p className="whitespace-nowrap text-sm font-black text-fifow-dark">{formatAdminMoney(item.lineTotal)}</p></div>)}</div> : null}
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-lg font-black text-fifow-dark"><UserRound className="h-5 w-5 text-fifow-primary" />Participants</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><Party title="Acheteur" value={order.buyer || order.buyerSnapshot} /><Party title="Vendeur" value={order.seller || order.sellerSnapshot} /></div>
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-lg font-black text-fifow-dark"><CheckCircle2 className="h-5 w-5 text-fifow-primary" />Historique</h3>
          {history.length ? <ol className="mt-5 border-l-2 border-violet-100 pl-5">{history.map((event, index) => <li key={event.id || `${event.toStatus}-${index}`} className="relative pb-5 last:pb-0"><span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-fifow-primary" /><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-extrabold text-fifow-dark">{statusLabel(event.toStatus || event.status)}</p><p className="mt-1 text-xs font-semibold text-fifow-secondary">{event.reason || actorLabel(event.actorType)}</p></div><time className="text-xs font-bold text-fifow-muted">{formatAdminDate(event.createdAt)}</time></div></li>)}</ol> : <p className="mt-4 text-sm font-semibold text-fifow-secondary">Aucun événement enregistré.</p>}
        </Card>
      </div>
      <aside className="space-y-5 xl:sticky xl:top-24">
        <Card className="p-5"><h3 className="flex items-center gap-2 font-black text-fifow-dark"><Banknote className="h-5 w-5 text-fifow-primary" />Paiements</h3>{order.payments?.length ? <div className="mt-4 space-y-3">{order.payments.map((payment) => <div key={payment.id} className="rounded-lg border border-fifow-border p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-bold text-fifow-secondary">{payment.internalReference || shortId(payment.id)}</span><AdminStatusBadge status={payment.status} /></div><p className="mt-2 font-black text-fifow-dark">{formatAdminMoney(payment.amount)}</p></div>)}</div> : <p className="mt-3 text-sm font-semibold text-fifow-secondary">Aucun paiement.</p>}</Card>
        <Card className="p-5"><h3 className="flex items-center gap-2 font-black text-fifow-dark"><MapPin className="h-5 w-5 text-fifow-primary" />Remise</h3><dl className="mt-4 space-y-3"><Detail label="Statut livraison" value={statusLabel(order.delivery?.status)} /><Detail label="Lieu" value={order.delivery?.pickupLocation || addressText(order.delivery?.addressSnapshot)} /><Detail label="Suivi" value={order.delivery?.trackingReference} /></dl></Card>
        {order.disputeReason ? <Card className="border-red-100 bg-red-50 p-5"><h3 className="font-black text-red-800">Motif du litige</h3><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-red-800">{order.disputeReason}</p></Card> : null}
      </aside>
    </div>
  </AdminPage>
}

function Detail({ label, value, strong }) { return <div><dt className="text-xs font-black uppercase text-fifow-muted">{label}</dt><dd className={`mt-1 break-words ${strong ? 'text-lg font-black text-fifow-primary' : 'text-sm font-bold text-fifow-dark'}`}>{value || '—'}</dd></div> }
function Party({ title, value = {} }) { return <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-black uppercase text-fifow-primary">{title}</p><p className="mt-2 font-extrabold text-fifow-dark">{value?.fullName || value?.name || 'Utilisateur'}</p><p className="mt-1 text-sm font-semibold text-fifow-secondary">{value?.email || value?.phone || 'Coordonnées non disponibles'}</p></div> }
function statusLabel(value) { return value ? adminStatusLabel(value) : '—' }
function actorLabel(value) { return value ? `Action : ${value.replaceAll('_', ' ')}` : 'Mise à jour système' }
function addressText(value) { if (!value) return '—'; if (typeof value === 'string') return value; return [value.address, value.quartier, value.commune].filter(Boolean).join(', ') || '—' }
