import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, FileWarning, X } from 'lucide-react'
import { adminApi } from '../../api/admin.js'
import Button from '../ui/Button.jsx'
import { AdminError, AdminLoading } from './AdminState.jsx'

export default function AdminDocumentViewer({ verificationId, documentIndex, label, disabled = false }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const queryKey = ['admin', 'verifications', verificationId, 'documents', documentIndex]
  const closeRef = useRef(null)
  const documentQuery = useQuery({
    queryKey,
    queryFn: () => adminApi.verifications.document(verificationId, documentIndex),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
  const [objectUrl, setObjectUrl] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    closeRef.current?.focus()
    function closeOnEscape(event) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      previousFocus?.focus?.()
    }
  }, [open])

  function close() {
    setOpen(false)
    queryClient.removeQueries({ queryKey, exact: true })
  }

  useEffect(() => {
    if (!documentQuery.data) {
      setObjectUrl('')
      return undefined
    }
    const url = URL.createObjectURL(documentQuery.data)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [documentQuery.data])

  return (
    <>
      <Button type="button" size="sm" variant="secondary" icon={Eye} disabled={disabled} onClick={() => setOpen(true)}>
        {label || `Document ${documentIndex + 1}`}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950/95 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label={label || `Document ${documentIndex + 1}`}>
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 text-white">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-violet-200">Document privé</p>
              <h2 className="truncate text-lg font-black">{label || `Document ${documentIndex + 1}`}</h2>
            </div>
            <div className="flex shrink-0 gap-2">
              {objectUrl ? <a href={objectUrl} download={`verification-${verificationId}-${documentIndex + 1}`} aria-label="Télécharger le document" className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 hover:bg-white/20"><Download className="h-5 w-5" /></a> : null}
              <button ref={closeRef} type="button" aria-label="Fermer" onClick={close} className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="mx-auto mt-4 grid min-h-0 w-full max-w-6xl flex-1 place-items-center overflow-auto rounded-lg bg-white p-3">
            {documentQuery.isLoading ? <div className="w-full"><AdminLoading rows={4} /></div> : null}
            {documentQuery.isError ? <AdminError message="Le document privé ne peut pas être chargé." onRetry={documentQuery.refetch} /> : null}
            {objectUrl && documentQuery.data?.type === 'application/pdf' ? <iframe title={label || 'Document de vérification'} src={objectUrl} className="h-full min-h-[70vh] w-full" /> : null}
            {objectUrl && documentQuery.data?.type !== 'application/pdf' ? <img src={objectUrl} alt={label || 'Document de vérification'} className="max-h-full max-w-full object-contain" /> : null}
            {!documentQuery.isLoading && !documentQuery.isError && !objectUrl ? <div className="text-center"><FileWarning className="mx-auto h-10 w-10 text-fifow-muted" /><p className="mt-3 font-bold text-fifow-secondary">Document vide ou non reconnu.</p></div> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
