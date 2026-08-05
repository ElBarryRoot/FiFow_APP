import { HelpCircle, ShieldCheck } from 'lucide-react'
import BoostBenefitRow from '../../components/boost/BoostBenefitRow.jsx'
import BoostHero from '../../components/boost/BoostHero.jsx'
import BoostPlanCard from '../../components/boost/BoostPlanCard.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import { boostBenefits, boostPlans } from '../../data/boostPlans.js'

export default function BoostPlans() {
  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Plans de boost" secure={false} backTo="/profile/listings" />
      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end lg:hidden">
          <HelpCircle className="h-7 w-7 text-fifow-primary" />
        </div>
        <BoostHero />
        <BoostBenefitRow benefits={boostBenefits} />
        <div className="grid gap-5 xl:grid-cols-3">
          {boostPlans.map((plan) => <BoostPlanCard key={plan.id} plan={plan} />)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-fifow-primary" />
            <p className="font-bold text-fifow-dark">Paiement 100% sécurisé avec MoMo • Carte bancaire • Orange Money</p>
          </div>
          <button type="button" className="font-black text-fifow-primary">Voir nos CGU ›</button>
        </div>
      </section>
    </main>
  )
}
