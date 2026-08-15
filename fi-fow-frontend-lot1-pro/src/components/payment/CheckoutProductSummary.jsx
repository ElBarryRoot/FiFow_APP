import { ShieldCheck, Store } from 'lucide-react'
import { orderProduct } from '../../lib/commerce.js'
import { formatGNF } from '../../lib/formatters.js'
import Card from '../ui/Card.jsx'

export default function CheckoutProductSummary({ order, compact = false }) {
  const product = orderProduct(order)

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      {order.items?.length > 1 ? <div><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-fifow-dark">{order.items.length} articles</h2><p className="text-lg font-black text-fifow-primary">{formatGNF(order.itemAmount)}</p></div><div className="mt-3 divide-y divide-fifow-border">{order.items.map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><img src={item.product.image} alt="" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-black text-fifow-dark">{item.product.title}</p><p className="mt-1 text-xs font-bold text-fifow-secondary">{item.quantity} × {formatGNF(item.unitPrice)}</p></div><p className="text-sm font-black text-fifow-dark">{formatGNF(item.lineTotal)}</p></div>)}</div><p className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><Store className="h-4 w-4 shrink-0 text-fifow-primary" /> Vendeur : {order.sellerName || 'Vendeur Fi Fow'}</p></div> : <div className="flex gap-4">
        <img
          src={product.image}
          alt={product.title}
          width="112"
          height="112"
          decoding="async"
          className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28"
        />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-lg font-black text-fifow-dark sm:text-xl">{product.title}</h2>
          <p className="mt-2 text-lg font-black text-fifow-primary">{formatGNF(order.itemAmount)}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><Store className="h-4 w-4 shrink-0 text-fifow-primary" /> Vendeur : {order.sellerName || 'Vendeur Fi Fow'}</p>
        </div>
      </div>}

      {!compact ? (
        <div className="mt-5 border-t border-dashed border-fifow-border pt-5">
          <p className="text-xs font-black uppercase text-fifow-muted">Montant de la commande</p>
          <div className="mt-3 space-y-3 text-sm font-semibold text-fifow-secondary">
            <AmountRow label={order.items?.length > 1 ? `Articles (${order.items.length})` : 'Prix de l’article'} value={order.itemAmount} />
            <div className="flex items-start justify-between gap-4">
              <span className="flex min-w-0 items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fifow-green" />
                <span>
                  <span className="block font-bold text-fifow-dark">Protection de votre achat</span>
                  <span className="mt-0.5 block text-xs font-medium leading-5">Paiement sécurisé, suivi de la commande et assistance en cas de problème.</span>
                </span>
              </span>
              <span className="whitespace-nowrap font-bold text-fifow-dark">{formatGNF(order.buyerProtectionFee)}</span>
            </div>
            <AmountRow label="Livraison" value={order.deliveryFee} zeroLabel="Offerte" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-dashed border-fifow-border pt-5">
            <span className="text-lg font-black text-fifow-dark">Total sécurisé</span>
            <span className="text-2xl font-black text-fifow-primary">{formatGNF(order.totalAmount)}</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function AmountRow({ label, value, zeroLabel }) {
  const amount = Number(value || 0)
  return <div className="flex justify-between gap-4"><span>{label}</span><span className="whitespace-nowrap font-bold text-fifow-dark">{amount === 0 && zeroLabel ? zeroLabel : formatGNF(amount)}</span></div>
}
