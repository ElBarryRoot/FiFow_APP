import { Smartphone } from 'lucide-react'
import Card from '../ui/Card.jsx'

export default function MobileMoneyPhoneInput({ value, onChange, error }) {
  return (
    <Card className="p-5 sm:p-6">
      <label htmlFor="payment-phone" className="text-base font-black text-fifow-dark">Numéro Mobile Money</label>
      <div className="mt-3 flex h-14 items-center rounded-lg border border-fifow-border bg-white px-4 focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100">
        <Smartphone className="h-5 w-5 shrink-0 text-fifow-primary" />
        <input id="payment-phone" value={value} onChange={(event) => onChange(event.target.value)} placeholder="+224 620 12 34 56" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(error)} aria-describedby={error ? 'payment-phone-error' : 'payment-phone-help'} className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base font-semibold text-fifow-dark outline-none placeholder:text-fifow-muted" />
      </div>
      {error ? <p id="payment-phone-error" className="mt-2 text-sm font-bold text-fifow-red" role="alert">{error}</p> : null}
      <p id="payment-phone-help" className="mt-3 text-sm font-semibold text-fifow-secondary">Utilisez le numéro associé à votre compte de paiement.</p>
    </Card>
  )
}
