import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, ReceiptText, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage } from '../../api/errors.js'
import { ordersApi } from '../../api/orders.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import ReasonDialog from '../../components/commerce/ReasonDialog.jsx'
import OrderActions from '../../components/orders/OrderActions.jsx'
import OrderProgress from '../../components/orders/OrderProgress.jsx'
import OrderTimeline from '../../components/orders/OrderTimeline.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { handoverLabels, orderCounterpart, orderProduct, orderStatus, paymentStatus } from '../../lib/commerce.js'
import { formatGNF } from '../../lib/formatters.js'
import { useToast } from '../../lib/toast.jsx'

export default function OrderDetail() {
  const { id } = useParams()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const [reasonAction, setReasonAction] = useState(null)
  const orderQuery = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => ordersApi.detail(id, { userId: auth.user.id }),
    enabled: Boolean(id),
  })
  const actionMutation = useMutation({
    mutationFn: ({ action, reason }) => runOrderAction(action, id, auth.user.id, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.order(id), order)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      setReasonAction(null)
      showToast('La commande a été mise à jour.')
    },
    onError: (error) => showToast(errorMessage(error, 'Cette action ne peut pas être effectuée.'), { type: 'error' }),
  })

  if (orderQuery.isLoading) return <UserPageShell title="Commande" backTo="/orders" backLabel="Retour aux commandes"><LoadingBlock rows={3} /></UserPageShell>
  if (orderQuery.isError || !orderQuery.data) return <UserPageShell title="Commande" backTo="/orders" backLabel="Retour aux commandes"><ErrorBlock title="Commande introuvable" message={errorMessage(orderQuery.error, 'Cette commande est indisponible.')} onRetry={orderQuery.refetch} /></UserPageShell>

  const order = orderQuery.data
  const status = orderStatus(order.status)
  const product = orderProduct(order)
  const counterpart = orderCounterpart(order, auth.user.id)
  const latestPayment = order.payment || order.payments?.[0]
  const deliveryDetails = order.handoverDetails || order.delivery?.addressSnapshot || {}

  return (
    <UserPageShell title="Détail de la commande" eyebrow="Transaction Fi Fow" subtitle={`Référence ${order.reference}`} backTo="/orders" backLabel="Retour aux commandes">
      <section className="mb-6 rounded-lg border border-fifow-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant={status.tone}>{status.shortLabel}</Badge>
            <h2 className="mt-3 text-2xl font-black text-fifow-dark">{status.label}</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-fifow-secondary">{status.description}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-black uppercase text-fifow-muted">Total</p>
            <p className="mt-1 text-2xl font-black text-fifow-primary">{formatGNF(order.totalAmount)}</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-fifow-dark">{order.itemCount > 1 ? `${order.itemCount} articles` : 'Article commandé'}</h2><p className="mt-1 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><UserRound className="h-4 w-4 text-fifow-primary" /> Avec {counterpart.name}</p></div><p className="text-xl font-black text-fifow-primary">{formatGNF(order.itemAmount)}</p></div>
            <div className="mt-4 divide-y divide-fifow-border border-y border-fifow-border">{(order.items?.length ? order.items : [{ id: product.id, quantity: 1, lineTotal: order.itemAmount, product }]).map((item) => <div key={item.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-4"><Link to={`/products/${item.product.slug}`} className="overflow-hidden rounded-lg bg-slate-100"><img src={item.product.image} alt="" className="aspect-square h-full w-full object-cover" /></Link><div className="min-w-0"><p className="line-clamp-2 text-sm font-black text-fifow-dark">{item.product.title}</p><p className="mt-1 text-xs font-bold text-fifow-secondary">Quantité : {item.quantity}</p></div><p className="whitespace-nowrap text-sm font-black text-fifow-dark">{formatGNF(item.lineTotal)}</p></div>)}</div>
            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {handoverLabels[order.handoverMode] || order.handoverMode}</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <OrderProgress order={order} userId={auth.user.id} />
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-black text-fifow-dark">Historique</h2>
            <div className="mt-5"><OrderTimeline history={order.statusHistory} /></div>
          </Card>

          {Object.keys(deliveryDetails).length ? (
            <Card className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-black text-fifow-dark"><MapPin className="h-5 w-5 text-fifow-primary" /> Informations de remise</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(deliveryDetails).filter(([, value]) => value).map(([key, value]) => <DetailItem key={key} label={detailLabel(key)} value={String(value)} />)}
              </dl>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-fifow-dark"><ReceiptText className="h-5 w-5 text-fifow-primary" /> Récapitulatif</h2>
            <dl className="mt-4 space-y-3 text-sm font-semibold text-fifow-secondary">
              <AmountItem label={order.itemCount > 1 ? `Articles (${order.itemCount})` : 'Produit'} value={order.itemAmount} />
              <AmountItem label="Protection de la transaction" value={order.buyerProtectionFee} />
              <AmountItem label="Livraison" value={order.deliveryFee} />
              {Number(order.discountAmount || 0) ? <AmountItem label="Réduction" value={-order.discountAmount} /> : null}
              <div className="flex justify-between gap-3 border-t border-fifow-border pt-3 text-base"><dt className="font-black text-fifow-dark">Total</dt><dd className="font-black text-fifow-primary">{formatGNF(order.totalAmount)}</dd></div>
            </dl>
            {latestPayment ? <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-bold text-fifow-secondary">Paiement : <span className="text-fifow-dark">{paymentStatus(latestPayment.status).label}</span></div> : null}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-fifow-dark">Actions disponibles</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Les actions changent automatiquement selon votre rôle et le statut réel.</p>
            <div className="mt-4"><OrderActions order={order} userId={auth.user.id} pendingAction={actionMutation.variables?.action && actionMutation.isPending ? actionMutation.variables.action : null} onAction={(action) => actionMutation.mutate({ action })} onReasonAction={setReasonAction} /></div>
          </Card>

          <Card className="border-emerald-100 bg-fifow-mint p-4">
            <div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-fifow-green" /><p className="text-sm font-semibold leading-6 text-fifow-secondary">Gardez les échanges, références et confirmations dans Fi Fow pour bénéficier de l’assistance.</p></div>
          </Card>
        </aside>
      </div>

      <ReasonDialog open={Boolean(reasonAction)} title={reasonAction === 'cancel' ? 'Annuler cette commande ?' : 'Ouvrir un litige'} description={reasonAction === 'cancel' ? 'Cette action retire la commande avant paiement. Expliquez brièvement la raison.' : 'Décrivez précisément le problème. Le versement sera bloqué pendant l’examen.'} confirmLabel={reasonAction === 'cancel' ? 'Confirmer l’annulation' : 'Ouvrir le litige'} danger loading={actionMutation.isPending} onClose={() => setReasonAction(null)} onConfirm={(reason) => actionMutation.mutate({ action: reasonAction, reason })} />
    </UserPageShell>
  )
}

function runOrderAction(action, orderId, userId, reason) {
  const context = { userId }
  if (action === 'seller-confirm') return ordersApi.sellerConfirm(orderId, context)
  if (action === 'prepare') return ordersApi.prepare(orderId, context)
  if (action === 'ready') return ordersApi.ready(orderId, undefined, context)
  if (action === 'ship') return ordersApi.ship(orderId, undefined, context)
  if (action === 'receive') return ordersApi.receive(orderId, undefined, context)
  if (action === 'cancel') return ordersApi.cancel(orderId, reason, context)
  if (action === 'dispute') return ordersApi.dispute(orderId, reason, context)
  throw new Error('Action de commande inconnue.')
}

function AmountItem({ label, value }) {
  return <div className="flex justify-between gap-3"><dt>{label}</dt><dd className="font-black text-fifow-dark">{formatGNF(Number(value || 0))}</dd></div>
}

function DetailItem({ label, value }) {
  return <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs font-black uppercase text-fifow-muted">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-fifow-dark">{value}</dd></div>
}

function detailLabel(key) {
  return ({ recipientName: 'Destinataire', phone: 'Téléphone', commune: 'Commune', quartier: 'Quartier', addressLine: 'Adresse', instructions: 'Instructions', pickupLocation: 'Point de retrait', meetingLocation: 'Lieu de rencontre' })[key] || key
}
