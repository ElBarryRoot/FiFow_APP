import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import Button from '../ui/Button.jsx'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmer', danger = false, loading = false, onClose, onConfirm }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    cancelRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [loading, onClose, open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full rounded-t-lg bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 id="confirm-dialog-title" className="text-xl font-black text-fifow-dark">{title}</h2><p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">{description}</p></div><button ref={cancelRef} type="button" onClick={onClose} disabled={loading} aria-label="Fermer" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-fifow-secondary"><X className="h-5 w-5" /></button></div>
        <div className="mt-6 grid grid-cols-2 gap-3"><Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Retour</Button><Button type="button" variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div>
      </div>
    </div>
  )
}
