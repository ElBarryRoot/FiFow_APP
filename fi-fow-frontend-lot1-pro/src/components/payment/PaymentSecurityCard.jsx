import { Check, ShieldCheck } from 'lucide-react'
import Card from '../ui/Card.jsx'

const protectionItems = [
  'Transaction suivie dans Fi Fow',
  'Assistance en cas de litige',
  'Données de paiement protégées',
]

export default function PaymentSecurityCard({ title = 'Protection acheteur Fi Fow', children }) {
  return (
    <Card className="border-emerald-100 bg-fifow-mint p-5">
      <div className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-fifow-green">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-extrabold text-fifow-dark">{title}</h3>
          {children ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{children}</p>
          ) : (
            <>
              <p className="mt-1 text-sm font-medium leading-6 text-fifow-secondary">
                La protection couvre le suivi du paiement et l’accompagnement pendant la transaction.
              </p>
              <ul className="mt-3 space-y-2">
                {protectionItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-bold text-fifow-secondary">
                    <Check className="h-3.5 w-3.5 text-fifow-green" /> {item}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
