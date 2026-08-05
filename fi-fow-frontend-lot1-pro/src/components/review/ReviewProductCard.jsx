import { formatGNF } from '../../lib/formatters.js'
import Card from '../ui/Card.jsx'

export default function ReviewProductCard({ product }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <img src={product.image} alt={product.title} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1"><h3 className="line-clamp-2 font-black text-fifow-dark">{product.title}</h3><p className="mt-1 font-black text-fifow-primary">{formatGNF(product.price)}</p>{product.orderedAt ? <p className="mt-1 text-xs font-semibold text-fifow-secondary">Commandé le {product.orderedAt}</p> : null}</div>
      </div>
    </Card>
  )
}
