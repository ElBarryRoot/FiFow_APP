import { CheckCircle2, MapPin, MessageCircle, ReceiptText, ShieldCheck, Star } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { orderTimeline, orders } from '../../data/clientPortal.js'
import { formatGNF } from '../../lib/formatters.js'

export default function OrderDetail() {
  const { id } = useParams()
  const order = orders.find((item) => item.id === id)
  if (!order) return <Navigate to="/orders" replace />
  return (
    <UserPageShell title="Détail commande" eyebrow="Suivi achat" subtitle={`Référence ${order.reference}`} backTo="/orders" backLabel="Retour aux commandes">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-fifow-primary via-violet-500 to-fifow-green p-5 text-white">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">Commande Fi Fow</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{order.status}</h2>
            <p className="mt-1 font-semibold text-white/80">{order.reference}</p>
          </div>
          <div className="p-5">
          <div className="flex gap-4">
            <img src={order.image} alt={order.product} className="h-36 w-36 rounded-3xl object-cover" />
            <div>
              <Badge variant="success">{order.status}</Badge>
              <h2 className="mt-3 text-2xl font-black text-fifow-dark">{order.product}</h2>
              <p className="mt-1 font-semibold text-fifow-secondary">Vendeur : {order.seller}</p>
              <p className="mt-2 text-2xl font-black text-fifow-primary">{formatGNF(order.amount)}</p>
            </div>
          </div>
          <div className="mt-8 space-y-5">
            {orderTimeline.map((step) => (
              <div key={step.label} className="flex gap-4">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fifow-green text-white ring-4 ring-emerald-100"><CheckCircle2 className="h-5 w-5" /></span>
                <div>
                  <p className="font-black text-fifow-dark">{step.label}</p>
                  <p className="text-sm font-semibold text-fifow-secondary">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </Card>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-fifow-dark"><MapPin className="h-5 w-5 text-fifow-primary" /> Livraison</h2>
            <p className="mt-2 font-semibold leading-6 text-fifow-secondary">{order.delivery}</p>
          </Card>
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-fifow-dark"><ReceiptText className="h-5 w-5 text-fifow-primary" /> Résumé</h2>
            <div className="mt-4 space-y-2 text-sm font-semibold text-fifow-secondary">
              <div className="flex justify-between"><span>Produit</span><span className="font-black text-fifow-dark">{order.product}</span></div>
              <div className="flex justify-between"><span>Montant</span><span className="font-black text-fifow-primary">{formatGNF(order.amount)}</span></div>
              <div className="flex justify-between"><span>Date</span><span className="font-black text-fifow-dark">{order.date}</span></div>
            </div>
          </Card>
          <HumanTrustPanel title="Protection achat" text="Les références, statuts et conversations facilitent le support en cas de désaccord." items={['Référence conservée', 'Paiement tracé', 'Vendeur identifiable']} />
          <Button as={Link} to="/messages/conv-2" className="w-full" icon={MessageCircle}>Contacter le vendeur</Button>
          <Button as={Link} to={`/orders/${order.id}/review`} variant="secondary" className="w-full" icon={Star}>Laisser un avis</Button>
        </aside>
      </div>
    </UserPageShell>
  )
}
