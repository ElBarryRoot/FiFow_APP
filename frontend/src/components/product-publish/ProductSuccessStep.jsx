import { ArrowRight, Box, Home, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import { formatGNF } from '../../lib/formatters.js'

function productFromDraft(draft) {
  return {
    title: draft.title || 'iPhone 13 Pro Max 256Go',
    price: Number(draft.price || 6500000),
    image: draft.photos?.[0] || '/assets/phone.png',
    location: draft.commune ? `Conakry, ${draft.commune}` : 'Conakry, Kaloum',
  }
}

export default function ProductSuccessStep({ draft }) {
  const product = productFromDraft(draft)

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <div className="relative mt-2 grid h-64 w-full max-w-lg place-items-center overflow-hidden rounded-[2rem] bg-fifow-lavender/60">
        <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-fifow-primary/10" />
        <div className="absolute -right-12 bottom-6 h-40 w-40 rounded-full bg-fifow-orange/10" />
        <img src="/assets/hero_connected.png" alt="Annonce publiée" className="relative h-full w-full object-contain object-bottom" />
        <span className="absolute left-[18%] top-14 grid h-20 w-20 place-items-center rounded-full bg-fifow-green text-white shadow-float">
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
      </div>

      <h2 className="mt-8 text-4xl font-black tracking-[-0.06em] text-fifow-dark sm:text-5xl">Annonce publiée avec succès !</h2>
      <p className="mt-3 max-w-xl text-base font-medium leading-7 text-fifow-secondary">
        Félicitations, votre annonce est maintenant en ligne et visible par les acheteurs sur Fi Fow.
      </p>

      <div className="mt-8 flex w-full max-w-xl items-center gap-4 rounded-[1.5rem] border border-fifow-border bg-white p-4 text-left shadow-card">
        <img src={product.image} alt={product.title} className="h-32 w-36 rounded-[1.15rem] object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-xl font-black tracking-[-0.03em] text-fifow-dark">{product.title}</h3>
          <p className="mt-2 text-2xl font-black text-fifow-primary">{formatGNF(product.price)}</p>
          <p className="mt-2 text-sm font-semibold text-fifow-secondary">{product.location}</p>
          <Badge variant="success" className="mt-3">En ligne</Badge>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-xl gap-4 rounded-[1.35rem] border border-violet-100 bg-fifow-lavender/70 p-4 text-left">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-fifow-primary shadow-card">
          <Box className="h-7 w-7" />
        </span>
        <div>
          <h3 className="font-black text-fifow-dark">Votre annonce est visible sur Fi Fow</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-fifow-secondary">Les acheteurs peuvent maintenant la voir, l’enregistrer en favori et vous contacter directement.</p>
        </div>
      </div>

      <div className="mt-8 grid w-full max-w-xl gap-3">
        <Link to="/products/iphone-13-pro-max" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-fifow-primary px-6 text-lg font-black text-white shadow-float transition hover:bg-fifow-primaryDark active:scale-[0.98]">Voir mon annonce <ArrowRight className="h-5 w-5" /></Link>
        <Link to="/products/iphone-13-pro/boost/checkout" className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.15rem] border border-fifow-primary bg-white px-6 text-lg font-black text-fifow-primary transition hover:bg-fifow-lavender">
          <Rocket className="h-5 w-5" /> Booster maintenant
        </Link>
        <Link to="/connected" className="inline-flex h-12 items-center justify-center gap-2 font-black text-fifow-primary">
          <Home className="h-5 w-5" /> Retour à l’accueil
        </Link>
      </div>
    </div>
  )
}
