import { CalendarDays, CheckCircle2, Copy, Hash, ReceiptText, Tag, WalletCards } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

const rows = [
  { key: 'amount', label: 'Montant payé', icon: Tag },
  { key: 'method', label: 'Méthode de paiement', icon: WalletCards },
  { key: 'paidAt', label: 'Date et heure', icon: CalendarDays },
  { key: 'transactionReference', label: 'Référence transaction', icon: Hash },
]

export default function PaymentReceiptCard({ receipt }) {
  return (
    <div className="space-y-5">
      <div className="mx-auto flex w-full max-w-xl items-center gap-4 rounded-3xl border border-fifow-border bg-white p-4 shadow-card">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-fifow-lavender text-fifow-primary">
          <ReceiptText className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-fifow-secondary">Référence de paiement</p>
          <p className="truncate text-xl font-black text-fifow-dark">{receipt.reference}</p>
        </div>
        <Copy className="h-6 w-6 text-fifow-primary" />
      </div>

      <Card className="mx-auto max-w-2xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-fifow-green">
              <WalletCards className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-bold text-fifow-secondary">Paiement pour</p>
              <h3 className="text-xl font-black text-fifow-dark">{receipt.label}</h3>
            </div>
          </div>
          <Badge variant="success" icon={CheckCircle2}>Payé</Badge>
        </div>
        <div className="my-5 h-px bg-fifow-border" />
        <div className="space-y-4">
          {rows.map((row) => {
            const Icon = row.icon
            const value = row.key === 'amount' ? formatGNF(receipt.amount) : receipt[row.key]
            return (
              <div key={row.key} className="grid grid-cols-[auto_1fr] items-center gap-3 sm:grid-cols-[auto_1fr_auto]">
                <Icon className="h-5 w-5 text-fifow-primary" />
                <span className="font-semibold text-fifow-secondary">{row.label}</span>
                <span className={row.key === 'amount' ? 'text-lg font-black text-fifow-green' : 'font-bold text-fifow-dark'}>{value}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
