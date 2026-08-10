import { ArrowRight, BriefcaseBusiness, Heart, MessageCircle, Plus, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toUserView } from '../../api/adapters.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useFavorites } from '../../lib/favorites.jsx'
import Button from '../ui/Button.jsx'
import SearchBar from './SearchBar.jsx'

const heroProducts = [
  { title: 'Smartphones', image: '/assets/phone.png', to: '/products?category=telephones' },
  { title: 'Mode', image: '/assets/orangebag.png', to: '/products?category=mode' },
  { title: 'Maison', image: '/assets/sofa.png', to: '/products?category=maison' },
]

export function GuestHero() {
  return (
    <section className="relative min-h-[360px] overflow-hidden rounded-lg border border-violet-100 bg-[#f3f0ff] px-5 py-7 sm:px-8 lg:min-h-[420px] lg:px-12 lg:py-10">
      <img
        src="/assets/fifow-marketplace-hero.png"
        alt=""
        className="absolute inset-y-0 right-0 hidden h-full w-[48%] object-cover object-[74%_center] opacity-70 lg:block"
      />
      <div className="absolute inset-y-0 right-[39%] hidden w-[28%] bg-gradient-to-r from-[#f3f0ff] via-[#f3f0ff]/72 to-transparent lg:block" aria-hidden="true" />
      <div className="relative z-10 grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md bg-white/90 px-3 py-1.5 text-xs font-black uppercase text-fifow-primary shadow-card">
            Marketplace locale
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.08] text-fifow-dark sm:text-[2.5rem] lg:text-[2.75rem]">
            Trouvez, vendez et achetez plus simplement en Guinee.
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-fifow-secondary">
            Des annonces proches de vous, des vendeurs visibles et un achat guide jusqu'a la remise.
          </p>
          <div className="mt-6 w-full max-w-xl">
            <SearchBar placeholder="Rechercher un produit, une marque ou un quartier" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button as={Link} to="/products" icon={ArrowRight}>Explorer</Button>
            <Button as={Link} to="/login" variant="secondary" icon={Plus}>Publier</Button>
          </div>
        </div>

        <div className="hidden rounded-lg border border-white/80 bg-white/86 p-3 shadow-card backdrop-blur-sm lg:block">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-fifow-dark">Categories actives</p>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Fi Fow
            </span>
          </div>
          <div className="grid gap-2">
            {heroProducts.map((item) => (
              <Link key={item.title} to={item.to} className="flex h-20 items-center gap-3 rounded-md border border-fifow-border bg-white/85 p-2 transition hover:border-violet-200 hover:bg-fifow-lavender">
                <img src={item.image} alt="" className="h-16 w-16 rounded-md bg-slate-50 object-contain" />
                <span className="font-extrabold text-fifow-dark">{item.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-fifow-primary" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ConnectedHero() {
  const auth = useAuth()
  const favorites = useFavorites()
  const currentUser = toUserView(auth.user)

  return (
    <section className="relative overflow-hidden rounded-lg border border-emerald-100 bg-[#eaf8f3] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/assets/hero_connected_v2.png"
          alt=""
          className="absolute inset-y-0 right-0 hidden h-full w-[54%] object-contain object-right sm:block lg:w-[44%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#eaf8f3] via-[#eaf8f3]/90 to-[#eaf8f3]/10 sm:via-[#eaf8f3]/65" />
        <div className="absolute right-[29%] top-1/2 z-10 hidden h-52 w-64 -translate-y-1/2 2xl:block">
          <img
            src="/assets/publication+_accueil.jpg"
            alt=""
            className="hero-publication-float absolute left-0 top-3 h-28 w-36 rounded-2xl border-2 border-white/90 object-cover object-center shadow-xl"
          />
          <img
            src="/assets/iphone_accueil.jpg"
            alt=""
            className="hero-product-float absolute bottom-1 right-3 h-40 w-32 rounded-2xl border-2 border-white/90 object-cover object-top shadow-2xl [filter:hue-rotate(230deg)_saturate(.72)_brightness(1.08)]"
          />
        </div>
      </div>
      <div className="relative z-20 max-w-4xl">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt="" className="h-14 w-14 rounded-lg border-4 border-white object-cover shadow-card" />
          <div>
            <p className="text-sm font-extrabold uppercase text-fifow-green">Votre espace</p>
            <h1 className="text-2xl font-black text-fifow-dark sm:text-[2rem]">Bonjour {currentUser.name}</h1>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-fifow-secondary">
          Reprenez vos annonces, vos favoris et vos conversations sans perdre le fil.
        </p>
        <div className="mt-7 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
          <QuickAction to="/profile/listings" icon={BriefcaseBusiness} label="Mes annonces" />
          <QuickAction to="/favorites" icon={Heart} label="Favoris" value={`${favorites.ids.size} enregistre${favorites.ids.size > 1 ? 's' : ''}`} />
          <QuickAction to="/messages" icon={MessageCircle} label="Messages" />
        </div>
      </div>
    </section>
  )
}

function QuickAction({ to, icon: Icon, label, value }) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 rounded-lg border border-white/90 bg-white/95 px-3 text-left shadow-card transition-colors hover:border-emerald-200 hover:bg-white">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-fifow-dark text-white"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-fifow-dark">{label}</span>
        {value !== undefined && value !== null ? <span className="block truncate text-xs font-bold text-fifow-primary">{value}</span> : null}
      </span>
    </Link>
  )
}
