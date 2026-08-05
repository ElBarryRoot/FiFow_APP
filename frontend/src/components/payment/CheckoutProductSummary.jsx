import { ShieldCheck, Store } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { getCheckoutTotal } from '../../data/payments.js'

export default function CheckoutProductSummary({ order, compact = false }) {
  const total = getCheckoutTotal(order)

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="flex gap-4">
        <img src={order.product.image} alt={order.product.title} className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em] text-fifow-dark sm:text-xl">{order.product.title}</h2>
              <p className="mt-1 text-sm font-semibold text-fifow-secondary">{order.product.meta}</p>
            </div>
            <p className="whitespace-nowrap text-lg font-black text-fifow-dark">{formatGNF(order.subtotal)}</p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary">
            <Store className="h-4 w-4 text-fifow-primary" /> Vendeur : {order.product.seller}
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-5 border-t border-dashed border-fifow-border pt-5">
          <div className="space-y-2 text-sm font-semibold text-fifow-secondary">
            <div className="flex justify-between"><span>Sous-total</span><span className="text-fifow-dark">{formatGNF(order.subtotal)}</span></div>
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fifow-green" />
                <span>
                  <span className="block font-bold text-fifow-dark">Protection acheteur</span>
                  <span className="mt-0.5 block text-xs font-medium leading-5 text-fifow-secondary">Paiement suivi et assistance en cas de problème</span>
                </span>
              </span>
              <span className="whitespace-nowrap font-bold text-fifow-dark">{formatGNF(order.serviceFee)}</span>
            </div>
            <div className="flex justify-between"><span>Livraison</span><span className="text-fifow-dark">{formatGNF(order.deliveryFee)}</span></div>
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-dashed border-fifow-border pt-5">
            <span className="text-xl font-black text-fifow-dark">Total à payer</span>
            <span className="text-2xl font-black tracking-[-0.04em] text-fifow-primary">{formatGNF(total)}</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
