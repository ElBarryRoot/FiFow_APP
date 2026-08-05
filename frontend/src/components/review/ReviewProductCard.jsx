import { ChevronRight } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function ReviewProductCard({ product }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <img src={product.image} alt={product.title} className="h-24 w-24 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-fifow-dark">{product.title}</h3>
          <p className="mt-1 font-black text-fifow-primary">{formatGNF(product.price)}</p>
          <p className="mt-1 text-sm font-semibold text-fifow-secondary">Commandé le {product.orderedAt}</p>
        </div>
        <ChevronRight className="h-7 w-7 text-fifow-secondary" />
      </div>
    </Card>
  )
}
