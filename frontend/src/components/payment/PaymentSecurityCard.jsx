import { Check, ShieldCheck } from 'lucide-react'
import Card from '../ui/Card.jsx'

const protectionItems = [
  'Montant validé côté serveur',
  'Suivi disponible depuis la commande',
  'Assistance en cas de problème',
]

export default function PaymentSecurityCard({ title = 'Transaction suivie par Fi Fow', children }) {
  return (
    <Card className="border-emerald-100 bg-fifow-mint p-5">
      <div className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-fifow-green">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="font-extrabold text-fifow-dark">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">
            {children || 'Le paiement est considéré comme confirmé uniquement après le retour sécurisé du partenaire de paiement.'}
          </p>
          <ul className="mt-3 space-y-2" aria-label="Protections de la transaction">
            {protectionItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs font-bold text-fifow-secondary">
                <Check className="h-3.5 w-3.5 shrink-0 text-fifow-green" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
