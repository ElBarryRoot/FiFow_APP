import { ArrowRight, BriefcaseBusiness, Heart, Plus, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { currentUser } from '../../data/user.js'

export function GuestHero() {
  return (
    <section className="relative min-h-[340px] overflow-hidden rounded-lg bg-[#ebe7ff] px-6 py-9 sm:px-10 lg:min-h-[410px] lg:px-14 lg:py-12">
      <img
        src="/assets/hero_guest.png"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-[68%_center] opacity-20 sm:w-[64%] sm:object-center sm:opacity-100 lg:w-[58%]"
      />
      <div className="relative z-10 max-w-[18rem] sm:max-w-[34rem]">
        <p className="text-sm font-extrabold uppercase text-fifow-primary">La marketplace locale</p>
        <h1 className="mt-3 text-3xl font-black leading-[1.05] text-fifow-dark sm:text-5xl lg:text-6xl">
          Fi Fow Marketplace
        </h1>
        <p className="mt-4 max-w-md text-base font-semibold leading-7 text-fifow-secondary sm:text-lg">
          Achetez et vendez facilement en Guinée, auprès de personnes proches de vous.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button as={Link} to="/products" icon={ArrowRight}>Explorer les annonces</Button>
          <Button as={Link} to="/login" variant="secondary" icon={Plus}>Publier une annonce</Button>
        </div>
      </div>
    </section>
  )
}

export function ConnectedHero() {
  return (
    <section className="relative min-h-[330px] overflow-hidden rounded-lg bg-[#eaf8f3] px-6 py-8 sm:px-10 lg:min-h-[390px] lg:px-14 lg:py-11">
      <img
        src="/assets/hero_connected.png"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-[70%_center] opacity-20 sm:w-[60%] sm:object-center sm:opacity-100 lg:w-[54%]"
      />
      <div className="relative z-10 max-w-[19rem] sm:max-w-[38rem]">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt="" className="h-14 w-14 rounded-full border-4 border-white shadow-card" />
          <div>
            <p className="text-sm font-extrabold uppercase text-fifow-green">Votre espace</p>
            <h1 className="text-3xl font-black text-fifow-dark sm:text-4xl">Bonjour {currentUser.name}</h1>
          </div>
        </div>
        <p className="mt-4 max-w-md text-base font-semibold leading-7 text-fifow-secondary sm:text-lg">
          Retrouvez vos annonces, vos favoris et les nouvelles opportunités près de chez vous.
        </p>
        <div className="mt-7 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
          <QuickAction to="/profile/listings" icon={BriefcaseBusiness} label="Mes annonces" />
          <QuickAction to="/favorites" icon={Heart} label="Favoris" value={currentUser.favoritesCount} />
          <QuickAction to="/orders" icon={WalletCards} label="Portefeuille" value={formatGNF(currentUser.wallet)} />
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
        {value ? <span className="block truncate text-xs font-bold text-fifow-primary">{value}</span> : null}
      </span>
    </Link>
  )
}
