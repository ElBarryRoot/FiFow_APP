import { useMemo, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import CheckoutProductSummary from '../../components/payment/CheckoutProductSummary.jsx'
import MobileMoneyPhoneInput from '../../components/payment/MobileMoneyPhoneInput.jsx'
import PaymentMethodCard from '../../components/payment/PaymentMethodCard.jsx'
import PaymentSecurityCard from '../../components/payment/PaymentSecurityCard.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import { checkoutOrder, getCheckoutTotal, paymentMethods } from '../../data/payments.js'
import { formatGNF } from '../../lib/formatters.js'

export default function Checkout() {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState('mobile_money')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const total = useMemo(() => getCheckoutTotal(checkoutOrder), [])

  function submitPayment() {
    const normalized = phone.replace(/\D/g, '')
    if (selectedMethod === 'mobile_money' && normalized.length < 9) {
      setError('Veuillez saisir un numéro Mobile Money valide.')
      return
    }
    navigate(`/checkout/${checkoutOrder.id}/processing`)
  }

  return (
    <main className="min-h-screen bg-fifow-bg pb-8">
      <TransactionHeader title="Paiement" backTo="/orders" />
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6 lg:order-2">
          <CheckoutProductSummary order={checkoutOrder} />
          <PaymentSecurityCard />
        </div>

        <div className="space-y-5 lg:order-1">
          <div>
            <h2 className="text-2xl font-extrabold text-fifow-dark">Finaliser l’achat</h2>
            <p className="mt-1 text-sm font-medium text-fifow-secondary">Choisissez votre moyen de paiement sécurisé.</p>
          </div>
          <div className="space-y-4">
            {paymentMethods.slice(0, 2).map((method) => (
              <PaymentMethodCard key={method.id} method={method} selected={selectedMethod === method.id} onSelect={(id) => { setSelectedMethod(id); setError('') }} />
            ))}
          </div>
          {selectedMethod === 'mobile_money' ? <MobileMoneyPhoneInput value={phone} onChange={(value) => { setPhone(value); setError('') }} error={error} /> : null}
          <Button size="lg" className="sticky bottom-4 z-20 w-full lg:static" icon={LockKeyhole} onClick={submitPayment}>
            Payer {formatGNF(total)}
          </Button>
          <p className="text-center text-sm font-semibold text-fifow-secondary">
            En payant sur Fi Fow, votre achat bénéficie de la Protection acheteur.
          </p>
        </div>
      </section>
    </main>
  )
}
