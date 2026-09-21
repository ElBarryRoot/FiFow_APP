import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import Button from '../ui/Button.jsx'

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function AdminFormDialog({
  open,
  title,
  description,
  confirmLabel = 'Enregistrer',
  loading = false,
  disabled = false,
  tone = 'primary',
  children,
  onClose,
  onSubmit,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const loadingRef = useRef(loading)
  onCloseRef.current = onClose
  loadingRef.current = loading

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    dialog?.querySelector(focusableSelector)?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape' && !loadingRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onSubmit={onSubmit}
        className="max-h-[min(760px,calc(100vh-2rem))] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-black text-fifow-dark">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{description}</p> : null}
          </div>
          <button type="button" aria-label="Fermer" disabled={loading} onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-fifow-secondary hover:bg-slate-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={loading} onClick={onClose}>Annuler</Button>
          <Button type="submit" variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} disabled={disabled}>{confirmLabel}</Button>
        </div>
      </form>
    </div>
  )
}
