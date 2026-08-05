import { ShieldCheck, Store } from 'lucide-react'
import { orderProduct } from '../../lib/commerce.js'
import { formatGNF } from '../../lib/formatters.js'
import Card from '../ui/Card.jsx'

export default function CheckoutProductSummary({ order, compact = false }) {
  const product = orderProduct(order)

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="flex gap-4">
        <img src={product.image} alt={product.title} className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-lg font-black text-fifow-dark sm:text-xl">{product.title}</h2>
          <p className="mt-2 text-lg font-black text-fifow-primary">{formatGNF(order.itemAmount)}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><Store className="h-4 w-4 text-fifow-primary" /> Vendeur : {order.sellerName || 'Vendeur Fi Fow'}</p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-5 border-t border-dashed border-fifow-border pt-5">
          <div className="space-y-3 text-sm font-semibold text-fifow-secondary">
            <AmountRow label="Produit" value={order.itemAmount} />
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fifow-green" />
                <span><span className="block font-bold text-fifow-dark">Protection acheteur</span><span className="mt-0.5 block text-xs font-medium leading-5">Paiement suivi et assistance en cas de problème</span></span>
              </span>
              <span className="whitespace-nowrap font-bold text-fifow-dark">{formatGNF(order.buyerProtectionFee)}</span>
            </div>
            <AmountRow label="Livraison" value={order.deliveryFee} />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-dashed border-fifow-border pt-5">
            <span className="text-lg font-black text-fifow-dark">Total à payer</span>
            <span className="text-2xl font-black text-fifow-primary">{formatGNF(order.totalAmount)}</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function AmountRow({ label, value }) {
  return <div className="flex justify-between gap-4"><span>{label}</span><span className="font-bold text-fifow-dark">{formatGNF(Number(value || 0))}</span></div>
}
