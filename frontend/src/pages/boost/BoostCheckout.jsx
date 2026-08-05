import { Rocket } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import BoostCheckoutCard from '../../components/boost/BoostCheckoutCard.jsx'
import BoostGainGrid from '../../components/boost/BoostGainGrid.jsx'
import PaymentMethodCard from '../../components/payment/PaymentMethodCard.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import { boostGains, boostProduct, selectedBoostPlan } from '../../data/boostPlans.js'
import { paymentMethods } from '../../data/payments.js'
import { formatGNF } from '../../lib/formatters.js'

export default function BoostCheckout() {
  const [method, setMethod] = useState('mobile_money')

  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Acheter un boost" backTo="/boost/plans" />
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_430px] lg:px-8">
        <div className="space-y-5 lg:order-2">
          <BoostCheckoutCard product={boostProduct} plan={selectedBoostPlan} />
          <BoostGainGrid gains={boostGains} />
        </div>
        <div className="space-y-5 lg:order-1">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-fifow-dark">Méthode de paiement</h2>
          <div className="space-y-3">
            {paymentMethods.map((paymentMethod) => (
              <PaymentMethodCard key={paymentMethod.id} method={paymentMethod} selected={method === paymentMethod.id} onSelect={setMethod} />
            ))}
          </div>
          <Button size="lg" className="sticky bottom-4 z-20 w-full lg:static" icon={Rocket}>
            Payer {formatGNF(selectedBoostPlan.price)} et activer le boost
          </Button>
          <p className="text-center text-sm font-bold text-fifow-muted">Paiement 100% sécurisé par nos partenaires.</p>
        </div>
      </section>
    </main>
  )
}
