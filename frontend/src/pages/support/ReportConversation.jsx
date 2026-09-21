import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Flag, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { reportsApi } from '../../api/reports.js'
import { errorMessage } from '../../api/errors.js'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import Card from '../../components/ui/Card.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Button from '../../components/ui/Button.jsx'

const reasons = [
  ['SCAM', 'Tentative d’arnaque'],
  ['BAD_BEHAVIOR', 'Comportement abusif'],
  ['OFFENSIVE_CONTENT', 'Contenu offensant'],
  ['PAYMENT_ISSUE', 'Demande de paiement hors Fi Fow'],
  ['OTHER', 'Autre problème'],
]

export default function ReportConversation() {
  const { id } = useParams()
  const [reason, setReason] = useState('SCAM')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({
    mutationFn: () => reportsApi.create({ targetType: 'CONVERSATION', targetId: id, reason, ...(description.trim() ? { description: description.trim() } : {}) }),
    onSuccess: () => setSubmitted(true),
  })

  return <UserPageShell title="Signaler cette conversation" eyebrow="Sécurité Fi Fow" subtitle="Votre signalement reste confidentiel et permet à Fi Fow de vérifier les échanges." backTo={`/messages/${id}`} backLabel="Retour à la conversation">
    {submitted ? <Card className="flex min-h-72 flex-col items-center justify-center p-7 text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-fifow-green"><CheckCircle2 className="h-8 w-8" /></span><h2 className="mt-5 text-2xl font-black text-fifow-dark">Signalement transmis</h2><p className="mt-2 max-w-lg font-semibold leading-7 text-fifow-secondary">Fi Fow va examiner les échanges et prendra les mesures nécessaires si les faits sont confirmés.</p><Button as={Link} to={`/messages/${id}`} className="mt-6">Revenir à la conversation</Button></Card> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><Card as="form" className="space-y-5 p-5 sm:p-7" onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}><div><h2 className="text-xl font-black text-fifow-dark">Que s’est-il passé ?</h2><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Choisissez le motif le plus précis et décrivez uniquement les faits utiles.</p></div><label className="block text-sm font-black text-fifow-dark">Motif<Select className="mt-2" value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="block text-sm font-black text-fifow-dark">Détails <span className="font-semibold text-fifow-muted">(facultatif)</span><Textarea className="mt-2 min-h-32" value={description} maxLength={1200} onChange={(event) => setDescription(event.target.value)} placeholder="Décrivez les faits observés, sans mot de passe ni donnée bancaire." /><span className="mt-1 block text-right text-xs font-bold text-fifow-muted">{description.length}/1200</span></label>{mutation.isError ? <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-800">{errorMessage(mutation.error, 'Le signalement n’a pas pu être transmis.')}</p> : null}<Button type="submit" variant="danger" icon={Flag} loading={mutation.isPending}>Envoyer le signalement</Button></Card><Card className="h-max border-red-100 bg-red-50 p-5"><ShieldAlert className="h-10 w-10 text-fifow-red" /><h2 className="mt-4 text-xl font-black text-fifow-dark">Restez protégé</h2><p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Ne partagez jamais de code de validation, mot de passe ou information bancaire dans une conversation.</p></Card></div>}
  </UserPageShell>
}
