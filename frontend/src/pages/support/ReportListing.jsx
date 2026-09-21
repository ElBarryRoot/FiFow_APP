import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Flag, ShieldAlert } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { errorMessage } from '../../api/errors.js'
import { reportsApi } from '../../api/reports.js'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'

const reasons = [
  { value: 'SCAM', label: 'Tentative d’arnaque' },
  { value: 'FAKE_PRODUCT', label: 'Produit ou annonce factice' },
  { value: 'FORBIDDEN_PRODUCT', label: 'Produit interdit' },
  { value: 'MISLEADING_PRICE', label: 'Prix trompeur' },
  { value: 'STOLEN_IMAGE', label: 'Images copiées ou volées' },
  { value: 'UNREACHABLE_SELLER', label: 'Vendeur injoignable' },
  { value: 'BAD_BEHAVIOR', label: 'Comportement abusif' },
  { value: 'OFFENSIVE_CONTENT', label: 'Contenu offensant' },
  { value: 'OTHER', label: 'Autre problème' },
]

export default function ReportListing() {
  const { id } = useParams()
  const location = useLocation()
  const product = location.state?.product
  const [reason, setReason] = useState('SCAM')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({
    mutationFn: () => reportsApi.create({
      targetType: 'PRODUCT',
      targetId: id,
      reason,
      ...(description.trim() ? { description: description.trim() } : {}),
    }),
    onSuccess: () => setSubmitted(true),
  })
  const backTo = product?.slug ? `/products/${product.slug}` : '/products'

  return (
    <UserPageShell title="Signaler une annonce" eyebrow="Sécurité marketplace" subtitle="Votre identité reste confidentielle et le vendeur ne reçoit pas les détails du signalement." backTo={backTo} backLabel="Retour à l’annonce">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {submitted ? (
          <Card className="flex min-h-80 flex-col items-center justify-center p-7 text-center" role="status">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-fifow-green"><CheckCircle2 className="h-8 w-8" /></span>
            <h2 className="mt-5 text-2xl font-black text-fifow-dark">Signalement transmis</h2>
            <p className="mt-2 max-w-lg font-semibold leading-7 text-fifow-secondary">L’équipe Fi Fow va examiner l’annonce. Un contenu n’est retiré qu’après vérification, sauf déclenchement d’un seuil de sécurité critique.</p>
            <Button as={Link} to={backTo} className="mt-6">Revenir à l’annonce</Button>
          </Card>
        ) : (
          <Card as="form" className="space-y-5 p-5 sm:p-7" onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}>
            <HumanSectionHeader title={product?.title ? `Signaler « ${product.title} »` : 'Pourquoi cette annonce pose problème ?'} description="Choisissez le motif le plus précis et ajoutez uniquement des faits utiles à la modération." />
            {product?.image ? <img src={product.image} alt="" className="h-28 w-full rounded-lg bg-slate-100 object-cover sm:w-48" /> : null}
            <div>
              <label htmlFor="report-reason" className="mb-2 block text-sm font-black text-fifow-dark">Motif</label>
              <Select id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
                {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="report-description" className="text-sm font-black text-fifow-dark">Détails utiles <span className="font-semibold text-fifow-muted">(facultatif)</span></label>
                <span className="text-xs font-bold text-fifow-muted">{description.length}/1200</span>
              </div>
              <Textarea id="report-description" value={description} maxLength={1200} onChange={(event) => setDescription(event.target.value)} placeholder="Décrivez les faits observés, sans partager d’information bancaire ni de mot de passe." />
            </div>
            {mutation.isError ? <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-800">{errorMessage(mutation.error, 'Le signalement n’a pas pu être transmis.')}</p> : null}
            <Button type="submit" variant="danger" icon={Flag} loading={mutation.isPending}>Envoyer le signalement</Button>
          </Card>
        )}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="h-max border-red-100 bg-red-50 p-5">
            <ShieldAlert className="h-10 w-10 text-fifow-red" />
            <h2 className="mt-4 text-xl font-black text-fifow-dark">Signalement confidentiel</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Ne communiquez jamais de mot de passe, de code de validation ou de données bancaires dans ce formulaire.</p>
          </Card>
          <HumanTrustPanel title="Signaux suspects" items={['Prix trop bas sans explication', 'Paiement demandé hors Fi Fow', 'Photos copiées ou incohérentes', 'Refus de répondre aux questions simples']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
