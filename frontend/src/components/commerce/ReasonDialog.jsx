import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'
import Textarea from '../ui/Textarea.jsx'

export default function ReasonDialog({ open, title, description, confirmLabel, danger = false, loading = false, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setReason('')
    setError('')
    const previousFocus = document.activeElement
    window.setTimeout(() => dialogRef.current?.querySelector('textarea')?.focus(), 0)
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus?.()
    }
  }, [loading, onClose, open])

  if (!open) return null

  function submit(event) {
    event.preventDefault()
    const normalized = reason.trim()
    if (normalized.length < 3) {
      setError('Expliquez la raison en au moins 3 caractères.')
      return
    }
    onConfirm(normalized)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="reason-dialog-title" onSubmit={submit} className="w-full rounded-t-lg bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="reason-dialog-title" className="text-xl font-black text-fifow-dark">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Fermer" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-fifow-secondary hover:bg-slate-200 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className="mt-5 block text-sm font-extrabold text-fifow-dark" htmlFor="reason-dialog-input">Motif</label>
        <Textarea id="reason-dialog-input" value={reason} maxLength={1000} onChange={(event) => { setReason(event.target.value); setError('') }} className="mt-2 min-h-28" placeholder="Décrivez précisément la situation…" aria-invalid={Boolean(error)} aria-describedby={error ? 'reason-dialog-error' : undefined} />
        <div className="mt-1 flex items-start justify-between gap-3 text-xs font-bold">
          <span id="reason-dialog-error" className="text-fifow-red">{error}</span>
          <span className="ml-auto text-fifow-muted">{reason.length}/1000</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Retour</Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} loading={loading}>{confirmLabel}</Button>
        </div>
      </form>
    </div>
  )
}
