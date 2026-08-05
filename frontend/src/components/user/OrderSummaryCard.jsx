import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, PackageCheck } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function OrderSummaryCard({ order }) {
  const variant = order.status === 'Livrée' ? 'success' : order.status === 'En cours' ? 'primary' : 'warning'

  return (
    <Card className="group overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr_auto] sm:items-center">
        <img src={order.image} alt={order.product} className="h-32 w-full rounded-3xl object-cover transition duration-500 group-hover:scale-[1.03] sm:h-32" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variant}>{order.status}</Badge>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-fifow-muted"><CalendarDays className="h-4 w-4" /> {order.date}</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-fifow-dark">{order.product}</h2>
          <p className="mt-1 text-sm font-semibold text-fifow-secondary">Vendeur : {order.seller}</p>
          <p className="mt-1 text-lg font-black text-fifow-primary">{formatGNF(order.amount)}</p>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-fifow-muted"><MapPin className="h-4 w-4 text-fifow-primary" /> {order.delivery}</p>
        </div>
        <div className="grid gap-2 sm:min-w-36">
          <Button as={Link} to={`/orders/${order.id}`} variant="secondary">Détails</Button>
          {order.status === 'Livrée' ? <Button as={Link} to={`/orders/${order.id}/review`} size="sm" icon={PackageCheck}>Avis</Button> : null}
        </div>
      </div>
    </Card>
  )
}
