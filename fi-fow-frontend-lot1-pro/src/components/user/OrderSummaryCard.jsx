import { ArrowRight, CalendarDays, CreditCard, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { formatDateTime, handoverLabels, orderStatus } from '../../lib/commerce.js'
import { formatGNF } from '../../lib/formatters.js'

export default function OrderSummaryCard({ order }) {
  const status = orderStatus(order.status)
  const isBuyer = order.role === 'buyer'
  const counterpart = isBuyer ? order.sellerName : order.buyerName
  const counterpartLabel = isBuyer ? 'Vendeur' : 'Acheteur'

  return (
    <Card className="overflow-hidden p-4 transition hover:border-violet-200 hover:shadow-soft">
      <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center">
        <Link to={`/orders/${order.id}`} className="block overflow-hidden rounded-lg bg-slate-100">
          <img src={order.product?.image || order.image} alt={order.product?.title || order.productTitle} className="aspect-[4/3] h-full w-full object-cover sm:aspect-square" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.tone}>{status.shortLabel}</Badge>
            <span className="text-xs font-black uppercase text-fifow-muted">{isBuyer ? 'Achat' : 'Vente'}</span>
          </div>
          <h2 className="mt-2 truncate text-lg font-black text-fifow-dark">{order.product?.title || order.productTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-fifow-secondary">{counterpartLabel} : {counterpart}</p>
          <p className="mt-1 text-lg font-black text-fifow-primary">{formatGNF(order.totalAmount)}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-fifow-muted">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDateTime(order.createdAt)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {handoverLabels[order.handoverMode] || order.handoverMode}</span>
          </div>
        </div>
        <div className="grid gap-2 sm:min-w-36">
          {isBuyer && order.status === 'AWAITING_PAYMENT' ? <Button as={Link} to={`/checkout/${order.id}`} size="sm" icon={CreditCard}>Payer</Button> : null}
          {isBuyer && order.status === 'COMPLETED' && order.canReview !== false ? <Button as={Link} to={`/orders/${order.id}/review`} size="sm" icon={Star}>Laisser un avis</Button> : null}
          <Button as={Link} to={`/orders/${order.id}`} variant="secondary" size="sm" icon={ArrowRight}>Détails</Button>
        </div>
      </div>
    </Card>
  )
}
