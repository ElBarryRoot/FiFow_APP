import { Copy, FileText, Wallet } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function PaymentReferenceCard({ reference, amount }) {
  return (
    <Card className="p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-fifow-lavender text-fifow-primary">
          <FileText className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-fifow-secondary">Référence de commande</p>
          <p className="truncate text-xl font-black text-fifow-dark">{reference}</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black text-fifow-primary hover:bg-fifow-lavender">
          <Copy className="h-4 w-4" /> Copier
        </button>
      </div>
      <div className="my-5 h-px bg-fifow-border" />
      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-fifow-green">
          <Wallet className="h-7 w-7" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-fifow-secondary">Montant</p>
          <p className="text-xl font-black text-fifow-dark">{formatGNF(amount)}</p>
        </div>
        <span className="text-2xl">🇬🇳</span>
      </div>
    </Card>
  )
}
