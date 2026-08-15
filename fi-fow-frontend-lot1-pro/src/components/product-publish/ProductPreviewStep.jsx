import { ArrowLeft, CheckCircle2, MapPin, Send, Star } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { toUserView } from '../../api/adapters.js'
import { productConditions } from '../../data/publishOptions.js'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function ProductPreviewStep({ draft, onBack, onPublish, submitting = false }) {
  const auth = useAuth()
  const user = toUserView(auth.user)
  const condition = productConditions.find((item) => item.value === draft.condition)?.label || draft.condition
  return (
    <div className="space-y-6">
      <div><h2 className="text-3xl font-black text-fifow-dark">Aperçu de votre annonce</h2><p className="mt-2 text-base font-medium text-fifow-secondary">Vérifiez les informations avant l’envoi.</p></div>
      <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr]"><img src={draft.photos[0]?.preview} alt={draft.title} className="h-72 w-full rounded-lg object-cover shadow-card sm:h-full" /><div className="grid grid-cols-2 gap-3">{draft.photos.slice(1, 5).map((photo) => <img key={photo.id} src={photo.preview} alt="Aperçu produit" className="h-32 w-full rounded-lg object-cover shadow-card sm:h-full" />)}</div></div>
      <div className="space-y-3"><h3 className="text-3xl font-black text-fifow-dark">{draft.title}</h3><p className="text-3xl font-black text-fifow-primary">{formatGNF(Number(draft.price))}</p><p className="flex items-center gap-2 text-base font-semibold text-fifow-secondary"><MapPin className="h-5 w-5" /> {draft.quartier}, {draft.commune}</p><div className="flex flex-wrap gap-3"><Badge variant="success">{condition}</Badge>{draft.negotiable ? <Badge variant="primary">Négociable</Badge> : null}<Badge variant="neutral">{draft.listingMode === 'STOCK' ? `${draft.stockQuantity} en stock` : draft.listingMode === 'LOT' ? 'Lot unique' : 'Article unique'}</Badge></div><p className="max-w-3xl whitespace-pre-line text-base font-medium leading-7 text-fifow-secondary">{draft.description}</p></div>
      <div className="flex items-center justify-between rounded-lg border border-fifow-border bg-white p-4 shadow-card"><div className="flex items-center gap-3"><img src={user.avatar} alt={user.fullName} className="h-14 w-14 rounded-full object-cover" /><div><p className="font-black text-fifow-dark">{user.fullName}</p><p className="text-sm font-bold text-fifow-primary">{auth.user.emailVerified ? 'Email vérifié' : 'Email à vérifier'}</p><p className="flex items-center gap-1 text-sm font-semibold text-fifow-secondary"><Star className="h-4 w-4 fill-fifow-yellow text-fifow-yellow" /> {user.rating.toFixed(1)} ({auth.user.totalReviews} avis)</p></div></div></div>
      <div className="rounded-lg border border-fifow-border bg-white p-4 shadow-card sm:p-5"><div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-fifow-primary text-white"><CheckCircle2 className="h-7 w-7" /></span><div><h3 className="text-xl font-black text-fifow-dark">Tout est prêt</h3><p className="text-sm font-medium text-fifow-secondary">La publication peut être mise en ligne immédiatement ou passer en modération selon sa catégorie.</p></div></div></div>
      <div className="grid gap-3 sm:grid-cols-[0.35fr_0.65fr]"><Button type="button" variant="secondary" size="lg" icon={ArrowLeft} onClick={onBack} disabled={submitting}>Retour</Button><Button type="button" size="lg" icon={Send} onClick={onPublish} loading={submitting}>Publier l’annonce</Button></div>
    </div>
  )
}
