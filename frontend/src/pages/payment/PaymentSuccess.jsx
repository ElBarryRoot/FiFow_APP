import { PartyPopper, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import PaymentReceiptCard from '../../components/payment/PaymentReceiptCard.jsx'
import PaymentSecurityCard from '../../components/payment/PaymentSecurityCard.jsx'
import PaymentStatusHero from '../../components/payment/PaymentStatusHero.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import { paymentReceipt } from '../../data/payments.js'

export default function PaymentSuccess() {
  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Paiement confirmé" backTo="/orders" />
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PaymentStatusHero status="success" title="Paiement confirmé" description="Merci ! Votre paiement a été effectué avec succès." />
        <div className="mt-8 space-y-5">
          <PaymentReceiptCard receipt={paymentReceipt} />
          <div className="mx-auto max-w-2xl">
            <PaymentSecurityCard title="Paiement sécurisé">Vos informations sont protégées. Merci de faire confiance à Fi Fow.</PaymentSecurityCard>
          </div>
          <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
            <Button as={Link} to="/orders" size="lg" variant="secondary" className="w-full" icon={PackageCheck}>Voir la commande</Button>
            <Button as={Link} to="/connected" size="lg" className="w-full" icon={PartyPopper}>Continuer</Button>
          </div>
          <p className="text-center text-sm font-black text-fifow-dark">Achetez local, soutenez le vôtre.</p>
        </div>
      </section>
    </main>
  )
}
