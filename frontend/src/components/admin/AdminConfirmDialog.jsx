import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Textarea from '../ui/Textarea.jsx'

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  tone = 'danger',
  requireReason = false,
  reasonLabel = 'Motif',
  loading = false,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState('')
  const titleId = useId()
  const closeRef = useRef(null)
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const loadingRef = useRef(loading)
  onCloseRef.current = onClose
  loadingRef.current = loading

  useEffect(() => {
    if (!open) return undefined
    setReason('')
    const previousFocus = document.activeElement
    closeRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loadingRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus?.() }
  }, [open])

  if (!open) return null

  function submit(event) {
    event.preventDefault()
    if (requireReason && reason.trim().length < 3) return
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <form ref={dialogRef} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-xl font-black text-fifow-dark">{title}</h2>
            {description ? <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{description}</p> : null}
          </div>
          <button ref={closeRef} type="button" aria-label="Fermer" disabled={loading} onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-fifow-secondary hover:bg-slate-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {requireReason ? (
          <label className="mt-5 block">
            <span className="text-sm font-extrabold text-fifow-dark">{reasonLabel}</span>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} className="mt-2 min-h-28" placeholder="Décrivez précisément la raison de cette action." autoFocus />
            <span className="mt-1 block text-right text-xs font-bold text-fifow-muted">{reason.length}/1000</span>
          </label>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={loading} onClick={onClose}>Annuler</Button>
          <Button type="submit" variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} disabled={requireReason && reason.trim().length < 3}>{confirmLabel}</Button>
        </div>
      </form>
    </div>
  )
}
