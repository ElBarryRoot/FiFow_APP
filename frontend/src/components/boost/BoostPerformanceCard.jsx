import { Bookmark, CalendarDays, CreditCard, Eye, Heart, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { boostStatus, formatDateTime } from '../../lib/commerce.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

export default function BoostPerformanceCard({ boost }) {
  const status = boostStatus(boost.status)
  const product = boost.product || {}
  const image = product.imageUrl || product.image || product.mainImage?.url || '/assets/empty-product.svg'
  const metrics = [
    boost.metrics?.productViews == null ? null : { label: 'Vues', value: boost.metrics.productViews, icon: Eye },
    boost.metrics?.productLikes == null ? null : { label: 'J’aime', value: boost.metrics.productLikes, icon: Heart },
    boost.metrics?.productFavorites == null ? null : { label: 'Favoris', value: boost.metrics.productFavorites, icon: Bookmark },
    boost.metrics?.productConversations == null ? null : { label: 'Messages', value: boost.metrics.productConversations, icon: MessageCircle },
  ].filter(Boolean)

  return (
    <Card className="p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Link to={`/products/${product.slug || product.id}`} className="overflow-hidden rounded-lg bg-slate-100"><img src={image} alt={product.title || 'Annonce boostée'} className="aspect-[4/3] h-full w-full object-cover sm:aspect-square" /></Link>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-fifow-dark">{product.title || 'Annonce Fi Fow'}</h2><p className="mt-1 text-sm font-semibold text-fifow-secondary">{boost.plan?.name || 'Plan de boost'}</p></div><Badge variant={status.tone}>{status.label}</Badge></div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <DateItem label="Début" value={boost.startsAt ? formatDateTime(boost.startsAt) : 'Après paiement'} />
            <DateItem label="Fin" value={boost.endsAt ? formatDateTime(boost.endsAt) : 'Non planifiée'} />
          </div>
          {metrics.length ? <><div className="mt-4 grid grid-cols-2 gap-3">{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div><p className="mt-2 text-xs font-semibold leading-5 text-fifow-muted">Totaux actuels de l’annonce, toutes sources confondues.</p></> : null}
          {boost.status === 'PENDING_PAYMENT' && boost.payment?.id ? <Button as={Link} to={`/payments/${boost.payment.id}/processing?boostId=${encodeURIComponent(boost.id)}`} size="sm" icon={CreditCard} className="mt-4">Suivre le paiement</Button> : null}
          {boost.cancelReason ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-fifow-red">{boost.cancelReason}</p> : null}
        </div>
      </div>
    </Card>
  )
}

function DateItem({ label, value }) {
  return <div className="flex gap-2 rounded-lg bg-slate-50 p-3"><CalendarDays className="h-5 w-5 shrink-0 text-fifow-primary" /><div><p className="text-xs font-bold text-fifow-muted">{label}</p><p className="mt-0.5 font-black text-fifow-dark">{value}</p></div></div>
}

function Metric({ label, value, icon: Icon }) {
  return <div className="rounded-lg border border-fifow-border p-3"><Icon className="h-5 w-5 text-fifow-primary" /><p className="mt-2 text-lg font-black text-fifow-dark">{Number(value || 0).toLocaleString('fr-FR')}</p><p className="text-xs font-bold text-fifow-muted">{label}</p></div>
}
