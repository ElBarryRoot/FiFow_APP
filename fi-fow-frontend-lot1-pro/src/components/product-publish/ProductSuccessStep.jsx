import { ArrowRight, Clock3, Home, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function ProductSuccessStep({ product }) {
  const available = product.status === 'AVAILABLE'
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <span className={`mt-8 grid h-24 w-24 place-items-center rounded-full ${available ? 'bg-emerald-50 text-fifow-green' : 'bg-amber-50 text-amber-700'}`}>{available ? <ArrowRight className="h-11 w-11" /> : <Clock3 className="h-11 w-11" />}</span>
      <h2 className="mt-6 text-4xl font-black text-fifow-dark sm:text-5xl">{available ? 'Annonce en ligne' : 'Annonce envoyée en vérification'}</h2>
      <p className="mt-3 max-w-xl text-base font-medium leading-7 text-fifow-secondary">{available ? 'Votre annonce est visible par les acheteurs.' : 'Fi Fow vérifiera cette catégorie avant de rendre l’annonce publique.'}</p>
      <div className="mt-8 flex w-full max-w-xl items-center gap-4 rounded-lg border border-fifow-border bg-white p-4 text-left shadow-card"><img src={product.image} alt={product.title} className="h-32 w-36 rounded-lg object-cover" /><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-xl font-black text-fifow-dark">{product.title}</h3><p className="mt-2 text-2xl font-black text-fifow-primary">{formatGNF(product.price)}</p><p className="mt-2 text-sm font-semibold text-fifow-secondary">{product.location}</p><Badge variant={available ? 'success' : 'warning'} className="mt-3">{product.statusLabel}</Badge></div></div>
      <div className="mt-8 grid w-full max-w-xl gap-3">
        {available ? <Link to={`/products/${product.slug}`} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-fifow-primary px-6 text-lg font-black text-white transition hover:bg-fifow-primaryDark">Voir mon annonce <ArrowRight className="h-5 w-5" /></Link> : <Link to="/profile/listings" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-fifow-primary px-6 text-lg font-black text-white">Suivre la validation <ArrowRight className="h-5 w-5" /></Link>}
        <Link to="/profile/listings" className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-fifow-primary bg-white px-6 text-lg font-black text-fifow-primary hover:bg-fifow-lavender"><ListChecks className="h-5 w-5" /> Gérer mes annonces</Link>
        <Link to="/" className="inline-flex h-12 items-center justify-center gap-2 font-black text-fifow-primary"><Home className="h-5 w-5" /> Retour à l’accueil</Link>
      </div>
    </div>
  )
}
