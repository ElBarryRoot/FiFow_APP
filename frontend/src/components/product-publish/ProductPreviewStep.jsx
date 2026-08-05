import { ArrowLeft, CheckCircle2, MapPin, Send, Star } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { currentUser } from '../../data/user.js'

function normalizedDraft(draft) {
  return {
    ...draft,
    title: draft.title || 'iPhone 13 Pro Max 256Go',
    description:
      draft.description ||
      'iPhone 13 Pro Max 256Go en très bon état, toujours protégé avec coque et verre trempé. Aucune rayure, batterie à 89%. Tout fonctionne parfaitement. Boîte et accessoires d’origine inclus.',
    price: draft.price || '7500000',
  }
}

export default function ProductPreviewStep({ draft, onBack, onPublish }) {
  const product = normalizedDraft(draft)
  const photos = product.photos.length > 0 ? product.photos : ['/assets/phone.png']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-[-0.05em] text-fifow-dark">Aperçu de votre annonce</h2>
        <p className="mt-2 text-base font-medium text-fifow-secondary">Vérifiez les informations avant de publier votre annonce.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr]">
        <img src={photos[0]} alt={product.title} className="h-72 w-full rounded-[1.35rem] object-cover shadow-card sm:h-full" />
        <div className="grid grid-cols-2 gap-3">
          {photos.slice(1, 5).map((photo, index) => (
            <img key={index} src={photo} alt="Aperçu produit" className="h-32 w-full rounded-[1.15rem] object-cover shadow-card sm:h-full" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-3xl font-black tracking-[-0.05em] text-fifow-dark">{product.title}</h3>
        <p className="text-3xl font-black text-fifow-primary">{formatGNF(Number(product.price))}</p>
        <p className="flex items-center gap-2 text-base font-semibold text-fifow-secondary"><MapPin className="h-5 w-5" /> {product.commune}, Conakry</p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success">{product.condition}</Badge>
          {product.negotiable ? <Badge variant="primary">Négociable</Badge> : null}
        </div>
        <p className="max-w-3xl text-base font-medium leading-7 text-fifow-secondary">{product.description}</p>
      </div>

      <div className="flex items-center justify-between rounded-[1.35rem] border border-fifow-border bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt={currentUser.name} className="h-14 w-14 rounded-full object-cover" />
          <div>
            <p className="font-black text-fifow-dark">Mamadou Diallo</p>
            <p className="text-sm font-bold text-fifow-primary">Vendeur vérifié</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-fifow-secondary"><Star className="h-4 w-4 fill-fifow-yellow text-fifow-yellow" /> 4.8 (132 avis)</p>
          </div>
        </div>
        <span className="text-2xl text-fifow-secondary">›</span>
      </div>

      <div className="rounded-[1.35rem] border border-fifow-border bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-fifow-primary text-white shadow-float">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <h3 className="text-xl font-black text-fifow-dark">Tout est prêt !</h3>
            <p className="text-sm font-medium text-fifow-secondary">Vérifiez que toutes les informations sont complètes.</p>
            <div className="mt-4 grid gap-2 text-sm font-bold text-fifow-secondary sm:grid-cols-2">
              {['Titre de l’annonce', 'Photos', 'Prix', 'Localisation'].map((item) => (
                <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-fifow-green" /> {item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.35fr_0.65fr]">
        <Button type="button" variant="secondary" size="lg" icon={ArrowLeft} onClick={onBack}>Retour</Button>
        <Button type="button" size="lg" icon={Send} onClick={onPublish}>Publier l’annonce</Button>
      </div>
    </div>
  )
}
