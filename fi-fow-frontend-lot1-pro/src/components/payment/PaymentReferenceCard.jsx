import { Check, Copy, FileText, Wallet } from 'lucide-react'
import { useState } from 'react'
import { formatGNF } from '../../lib/formatters.js'
import Card from '../ui/Card.jsx'

export default function PaymentReferenceCard({ reference, amount }) {
  const [copied, setCopied] = useState(false)

  async function copyReference() {
    if (!reference) return
    await navigator.clipboard.writeText(reference)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary"><FileText className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-bold text-fifow-secondary">Référence de paiement</p><p className="truncate text-lg font-black text-fifow-dark">{reference || 'En cours de création'}</p></div>
        {reference ? <button type="button" onClick={copyReference} className="grid h-10 w-10 place-items-center rounded-lg text-fifow-primary hover:bg-fifow-lavender" aria-label="Copier la référence">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button> : null}
      </div>
      <div className="my-5 h-px bg-fifow-border" />
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-50 text-fifow-green"><Wallet className="h-6 w-6" /></span>
        <div className="flex-1"><p className="text-sm font-bold text-fifow-secondary">Montant</p><p className="text-xl font-black text-fifow-dark">{formatGNF(Number(amount || 0))}</p></div>
      </div>
    </Card>
  )
}
