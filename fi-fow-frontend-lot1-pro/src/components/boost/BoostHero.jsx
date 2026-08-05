import { Rocket, ShieldCheck, Zap } from 'lucide-react'
import Card from '../ui/Card.jsx'

export default function BoostHero() {
  return (
    <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-white to-fifow-lavender p-5 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr] lg:items-center">
        <div className="grid h-36 w-36 place-items-center rounded-[2rem] bg-white text-fifow-primary shadow-card">
          <Rocket className="h-20 w-20" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-[-0.05em] text-fifow-primary sm:text-4xl">Boostez. Soyez vu. Vendez plus.</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-fifow-dark sm:text-lg">
            Placez votre annonce en tête des résultats et touchez plus d’acheteurs locaux en un temps record.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-fifow-primary shadow-sm">
              <ShieldCheck className="h-4 w-4" /> Paiement sécurisé
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-fifow-primary shadow-sm">
              <Zap className="h-4 w-4" /> Effet immédiat
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
