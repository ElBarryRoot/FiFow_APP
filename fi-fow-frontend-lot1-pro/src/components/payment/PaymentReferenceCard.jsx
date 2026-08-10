import { Check, Copy, FileText, Wallet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatGNF } from '../../lib/formatters.js'
import Card from '../ui/Card.jsx'

export default function PaymentReferenceCard({ reference, amount }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const resetTimer = useRef(null)

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
  }, [])

  async function copyReference() {
    if (!reference) return
    setCopyError('')
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reference)
      } else {
        copyWithFallback(reference)
      }
      setCopied(true)
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setCopyError('La référence ne peut pas être copiée automatiquement. Sélectionnez-la pour la copier.')
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary"><FileText className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-fifow-secondary">R&eacute;f&eacute;rence de paiement</p>
          <p className="truncate text-lg font-black text-fifow-dark" title={reference || undefined}>{reference || 'En cours de création'}</p>
        </div>
        {reference ? <button type="button" onClick={copyReference} className="grid h-10 w-10 place-items-center rounded-lg text-fifow-primary hover:bg-fifow-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifow-primary" aria-label="Copier la référence de paiement" title="Copier la référence">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button> : null}
      </div>
      {copyError ? <p className="mt-3 text-sm font-semibold text-fifow-secondary" role="status">{copyError}</p> : null}
      <div className="my-5 h-px bg-fifow-border" />
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-50 text-fifow-green"><Wallet className="h-6 w-6" /></span>
        <div className="flex-1"><p className="text-sm font-bold text-fifow-secondary">Montant</p><p className="text-xl font-black text-fifow-dark">{formatGNF(Number(amount || 0))}</p></div>
      </div>
    </Card>
  )
}

function copyWithFallback(value) {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') throw new Error('Copy is unavailable')
  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('Copy failed')
}
