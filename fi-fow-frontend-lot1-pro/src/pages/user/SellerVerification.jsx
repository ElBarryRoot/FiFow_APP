import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock3, FileCheck2, ImagePlus, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { sellerVerificationApi } from '../../api/sellerVerification.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { formatDateTime } from '../../lib/commerce.js'
import { useToast } from '../../lib/toast.jsx'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const maxFileSize = 5 * 1024 * 1024

export default function SellerVerification() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const [documents, setDocuments] = useState([])
  const documentsRef = useRef([])
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState('')
  const verificationQuery = useQuery({ queryKey: queryKeys.sellerVerification, queryFn: sellerVerificationApi.me })
  const verification = verificationQuery.data
  const canSubmit = !verification || ['REJECTED', 'REMOVED'].includes(verification.status)
  const requestMutation = useMutation({
    mutationFn: () => sellerVerificationApi.request({ documents: documents.map((item) => item.file), note }),
    onSuccess: async (result) => {
      documents.forEach((item) => URL.revokeObjectURL(item.preview))
      setDocuments([])
      setNote('')
      queryClient.setQueryData(queryKeys.sellerVerification, result)
      await auth.refreshUser().catch(() => undefined)
      showToast('Votre demande de vérification a été transmise.')
    },
    onError: (error) => showToast(errorMessage(error, 'Envoi des justificatifs impossible.'), { type: 'error' }),
  })

  useEffect(() => { documentsRef.current = documents }, [documents])
  useEffect(() => () => documentsRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), [])

  function addDocuments(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const next = []
    for (const file of files) {
      if (!acceptedTypes.has(file.type)) {
        setValidationError('Formats acceptés : JPG, PNG, WebP, HEIC ou HEIF.')
        continue
      }
      if (file.size > maxFileSize) {
        setValidationError('Chaque document doit peser au maximum 5 Mo.')
        continue
      }
      next.push({ id: `${file.name}-${file.lastModified}-${file.size}`, file, preview: URL.createObjectURL(file) })
    }
    setDocuments((current) => {
      const available = Math.max(0, 3 - current.length)
      const accepted = next.slice(0, available)
      next.slice(available).forEach((item) => URL.revokeObjectURL(item.preview))
      if (next.length > available) setValidationError('Vous pouvez envoyer au maximum 3 documents.')
      return [...current, ...accepted]
    })
  }

  function removeDocument(id) {
    setDocuments((current) => {
      const removed = current.find((item) => item.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return current.filter((item) => item.id !== id)
    })
    setValidationError('')
  }

  function submit(event) {
    event.preventDefault()
    if (documents.length < 1) {
      setValidationError('Ajoutez au moins un justificatif lisible.')
      return
    }
    requestMutation.mutate()
  }

  return (
    <UserPageShell title="Vérification vendeur" eyebrow="Confiance marketplace" subtitle="Transmettez vos justificatifs dans un espace protégé pour obtenir le statut vendeur vérifié." backTo="/settings" backLabel="Retour aux paramètres">
      {verificationQuery.isLoading ? <LoadingBlock label="Chargement de la vérification" rows={2} /> : null}
      {verificationQuery.isError ? <ErrorBlock title="Statut indisponible" message={errorMessage(verificationQuery.error)} onRetry={verificationQuery.refetch} /> : null}
      {!verificationQuery.isLoading && !verificationQuery.isError ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            {verification ? <VerificationStatus verification={verification} /> : null}
            {canSubmit ? (
              <form onSubmit={submit} className="space-y-5">
                <Card className="p-5 sm:p-6">
                  <h2 className="text-lg font-black text-fifow-dark">Justificatifs</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Ajoutez 1 à 3 photos nettes. Masquez les informations qui ne sont pas nécessaires à la vérification.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {documents.map((document) => <DocumentPreview key={document.id} document={document} onRemove={() => removeDocument(document.id)} />)}
                    {documents.length < 3 ? <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-violet-200 bg-fifow-lavender/40 text-center text-fifow-primary hover:border-fifow-primary"><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={addDocuments} className="sr-only" /><span><ImagePlus className="mx-auto h-7 w-7" /><span className="mt-2 block text-xs font-black">Ajouter</span></span></label> : null}
                  </div>
                  {validationError ? <p className="mt-3 text-sm font-bold text-fifow-red" role="alert">{validationError}</p> : null}
                </Card>
                <Card className="p-5 sm:p-6"><label htmlFor="verification-note" className="text-sm font-black text-fifow-dark">Note complémentaire <span className="font-semibold text-fifow-secondary">(optionnel)</span></label><Textarea id="verification-note" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-28" placeholder="Précisez un élément utile à l’équipe de vérification…" /><p className="mt-1 text-right text-xs font-bold text-fifow-muted">{note.length}/1000</p></Card>
                {requestMutation.isError ? <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-fifow-red">{errorMessage(requestMutation.error)}</p> : null}
                <Button type="submit" size="lg" icon={ShieldCheck} loading={requestMutation.isPending}>Envoyer pour vérification</Button>
              </form>
            ) : null}
          </section>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="border-emerald-100 bg-fifow-mint p-5"><FileCheck2 className="h-9 w-9 text-fifow-green" /><h2 className="mt-3 text-lg font-black text-fifow-dark">Documents protégés</h2><p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Les justificatifs servent uniquement au contrôle vendeur. Ils ne sont jamais affichés sur votre profil public.</p></Card>
            <Card className="p-5"><h2 className="font-black text-fifow-dark">Avant l’envoi</h2><ul className="mt-3 space-y-2 text-sm font-semibold text-fifow-secondary"><li>• Image entière et lisible</li><li>• Aucun mot de passe ou code bancaire</li><li>• Maximum 5 Mo par fichier</li><li>• Trois documents au maximum</li></ul></Card>
          </aside>
        </div>
      ) : null}
    </UserPageShell>
  )
}

function VerificationStatus({ verification }) {
  const approved = verification.status === 'APPROVED'
  const pending = verification.status === 'PENDING'
  const Icon = approved ? CheckCircle2 : pending ? Clock3 : ShieldCheck
  return <Card className={`p-5 ${approved ? 'border-emerald-200 bg-emerald-50' : pending ? 'border-amber-200 bg-amber-50' : 'border-red-100 bg-red-50'}`}><div className="flex items-start gap-4"><Icon className={`h-8 w-8 shrink-0 ${approved ? 'text-fifow-green' : pending ? 'text-amber-700' : 'text-fifow-red'}`} /><div><Badge variant={approved ? 'success' : pending ? 'warning' : 'danger'}>{verification.statusLabel}</Badge><h2 className="mt-3 text-xl font-black text-fifow-dark">{approved ? 'Votre profil vendeur est vérifié' : pending ? 'Votre demande est en cours d’examen' : 'Des éléments doivent être complétés'}</h2><p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Demande transmise le {formatDateTime(verification.requestedAt)} avec {verification.documentCount} document{verification.documentCount > 1 ? 's' : ''}.</p>{verification.rejectionReason ? <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm font-bold text-fifow-red">Motif : {verification.rejectionReason}</p> : null}</div></div></Card>
}

function DocumentPreview({ document, onRemove }) {
  return <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-fifow-border bg-slate-100"><img src={document.preview} alt="Justificatif sélectionné" className="h-full w-full object-cover" /><button type="button" onClick={onRemove} aria-label="Retirer le document" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg bg-white text-fifow-red shadow-card"><Trash2 className="h-4 w-4" /></button></div>
}
