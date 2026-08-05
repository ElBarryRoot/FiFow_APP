import { Bell, ChevronDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import BottomNav from '../../components/layout/BottomNav.jsx'
import BoostPerformanceCard from '../../components/boost/BoostPerformanceCard.jsx'
import BoostTabs from '../../components/boost/BoostTabs.jsx'
import Logo from '../../components/ui/Logo.jsx'
import { boostTabs, myBoosts } from '../../data/boosts.js'
import { currentUser } from '../../data/user.js'

export default function MyBoosts() {
  const [activeTab, setActiveTab] = useState('active')

  return (
    <main className="min-h-screen bg-fifow-bg pb-28 lg:pb-10">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-card">
            <Bell className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 rounded-full bg-fifow-red px-1.5 text-xs font-black text-white">3</span>
          </span>
          <span className="flex items-center gap-2 rounded-full bg-white p-1.5 pr-3 shadow-card">
            <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full" />
            <ChevronDown className="h-4 w-4 text-fifow-secondary" />
          </span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-[-0.07em] text-fifow-dark sm:text-6xl">Mes boosts</h1>
            <p className="mt-3 text-lg font-semibold text-fifow-secondary">Suivez les performances de vos annonces boostées.</p>
          </div>
          <span className="hidden h-20 w-20 place-items-center rounded-3xl bg-fifow-lavender text-fifow-primary sm:grid">
            <TrendingUp className="h-10 w-10" />
          </span>
        </div>
        <BoostTabs tabs={boostTabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="grid gap-5 xl:grid-cols-2">
          {activeTab === 'active' ? myBoosts.map((boost) => <BoostPerformanceCard key={boost.id} boost={boost} />) : (
            <div className="rounded-3xl bg-white p-10 text-center shadow-card xl:col-span-2">
              <p className="text-xl font-black text-fifow-dark">Aucun boost dans cet onglet pour la démo.</p>
              <p className="mt-2 font-semibold text-fifow-secondary">Les états en attente et expirés sont prêts côté UI.</p>
            </div>
          )}
        </div>
      </section>
      <BottomNav connected />
    </main>
  )
}
