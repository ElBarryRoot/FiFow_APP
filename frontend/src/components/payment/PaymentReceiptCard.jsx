import { CalendarDays, CheckCircle2, Hash, ReceiptText, Tag, WalletCards } from 'lucide-react'
import { formatGNF } from '../../lib/formatters.js'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'

const rows = [
  { key: 'amount', label: 'Montant payé', icon: Tag },
  { key: 'method', label: 'Fournisseur', icon: WalletCards },
  { key: 'paidAt', label: 'Date et heure', icon: CalendarDays },
  { key: 'transactionReference', label: 'Référence transaction', icon: Hash },
]

export default function PaymentReceiptCard({ receipt }) {
  return (
    <Card className="mx-auto max-w-2xl p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-50 text-fifow-green"><ReceiptText className="h-6 w-6" /></span>
          <div className="min-w-0"><p className="text-sm font-bold text-fifow-secondary">{receipt.label}</p><h2 className="truncate text-lg font-black text-fifow-dark">{receipt.reference}</h2></div>
        </div>
        <Badge variant="success" icon={CheckCircle2}>Confirmé</Badge>
      </div>
      <div className="my-5 h-px bg-fifow-border" />
      <dl className="space-y-4">
        {rows.map((row) => {
          const Icon = row.icon
          const value = row.key === 'amount' ? formatGNF(receipt.amount) : receipt[row.key]
          return <div key={row.key} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_1fr_auto]"><Icon className="h-5 w-5 text-fifow-primary" /><dt className="font-semibold text-fifow-secondary">{row.label}</dt><dd className={`break-all sm:text-right ${row.key === 'amount' ? 'text-lg font-black text-fifow-green' : 'font-bold text-fifow-dark'}`}>{value || 'Non communiqué'}</dd></div>
        })}
      </dl>
    </Card>
  )
}
