import { ChevronDown } from 'lucide-react'
import Card from '../ui/Card.jsx'

export default function MobileMoneyPhoneInput({ value, onChange, error }) {
  return (
    <Card className="p-5 sm:p-6">
      <label className="text-lg font-black text-fifow-dark">Numéro de téléphone</label>
      <div className="mt-3 flex h-14 items-center rounded-lg border border-fifow-border bg-white px-4 shadow-sm focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100">
        <span className="mr-3 text-2xl">🇬🇳</span>
        <span className="flex items-center gap-1 border-r border-fifow-border pr-4 text-lg font-black text-fifow-dark">
          +224 <ChevronDown className="h-4 w-4 text-fifow-muted" />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="620 12 34 56"
          inputMode="tel"
          className="min-w-0 flex-1 border-0 bg-transparent px-4 text-lg font-semibold text-fifow-dark outline-none placeholder:text-fifow-muted"
        />
      </div>
      {error ? <p className="mt-2 text-sm font-bold text-fifow-red">{error}</p> : null}
      <p className="mt-3 text-sm font-semibold text-fifow-secondary">Saisissez le numéro lié à votre compte Mobile Money.</p>
    </Card>
  )
}
