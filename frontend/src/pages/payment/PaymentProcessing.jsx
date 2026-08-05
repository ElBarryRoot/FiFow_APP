import { Headphones, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import PaymentReferenceCard from '../../components/payment/PaymentReferenceCard.jsx'
import PaymentSecurityCard from '../../components/payment/PaymentSecurityCard.jsx'
import PaymentStatusHero from '../../components/payment/PaymentStatusHero.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import { processingPayment } from '../../data/payments.js'

export default function PaymentProcessing() {
  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Paiement en vérification" />
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PaymentStatusHero
          title="Votre paiement est en cours de vérification"
          description="Notre système vérifie votre paiement en toute sécurité. Cela ne prend généralement que quelques secondes."
        />

        <div className="mx-auto mt-8 max-w-2xl space-y-5">
          <PaymentReferenceCard reference={processingPayment.orderReference} amount={processingPayment.amount} />
          <Card className="border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 font-black text-white">•••</span>
              <div>
                <h3 className="font-black text-fifow-dark">Statut : {processingPayment.status}</h3>
                <p className="mt-1 text-sm font-semibold text-fifow-dark">Nous vous notifierons dès que le paiement sera confirmé.</p>
              </div>
            </div>
          </Card>
          <PaymentSecurityCard title="Paiement 100% sécurisé">Fi Fow protège vos transactions et vos données.</PaymentSecurityCard>
          <div className="grid gap-3">
            <Button as={Link} to="/orders" size="lg" className="w-full" icon={PackageCheck}>Retourner à mes commandes</Button>
            <Button as={Link} to="/support" size="lg" variant="secondary" className="w-full" icon={Headphones}>Contacter le support</Button>
          </div>
          <p className="text-center text-sm font-bold text-fifow-secondary">Merci pour votre confiance. L’équipe Fi Fow</p>
        </div>
      </section>
    </main>
  )
}
