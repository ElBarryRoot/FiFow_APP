import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, PackageCheck, Rocket } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../api/errors.js'
import { paymentsApi } from '../../api/payments.js'
import { queryKeys } from '../../api/queryKeys.js'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import PaymentJourney from '../../components/payment/PaymentJourney.jsx'
import PaymentReceiptCard from '../../components/payment/PaymentReceiptCard.jsx'
import PaymentSecurityCard from '../../components/payment/PaymentSecurityCard.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import Button from '../../components/ui/Button.jsx'

export default function PaymentSuccess() {
  const { paymentId } = useParams()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const queryClient = useQueryClient()
  const paymentQuery = useQuery({ queryKey: queryKeys.payment(paymentId), queryFn: () => paymentsApi.detail(paymentId), enabled: Boolean(paymentId) })
  const payment = paymentQuery.data

  useEffect(() => {
    if (payment?.status !== 'SUCCEEDED') return
    if (orderId) {
      sessionStorage.removeItem(`fifow:payment-key:${orderId}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.boosts })
  }, [orderId, payment?.status, queryClient])

  const destination = orderId ? `/orders/${orderId}` : '/profile/boosts'
  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Confirmation du paiement" backTo={destination} />
      <section className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        {paymentQuery.isLoading ? <LoadingBlock label="Chargement du reçu" rows={3} /> : null}
        {paymentQuery.isError ? <ErrorBlock title="Reçu indisponible" message={errorMessage(paymentQuery.error)} onRetry={paymentQuery.refetch} /> : null}
        {payment && payment.status !== 'SUCCEEDED' ? (
          <ErrorBlock
            title="Paiement non confirmé"
            message="Cette page ne peut pas afficher un succès tant que le fournisseur n’a pas confirmé la transaction."
            onRetry={paymentQuery.refetch}
          />
        ) : null}
        {payment?.status === 'SUCCEEDED' ? (
          <div className="space-y-5">
            <div className="text-center" aria-live="polite">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-fifow-green"><CheckCircle2 className="h-11 w-11" /></span>
              <h1 className="mt-5 text-2xl font-black text-fifow-dark sm:text-3xl">Paiement confirmé</h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-fifow-secondary">La confirmation sécurisée a été enregistrée. La transaction apparaît maintenant dans votre suivi.</p>
            </div>
            {orderId ? <PaymentJourney current="handover" /> : null}
            <PaymentReceiptCard receipt={toReceipt(payment)} />
            <PaymentSecurityCard title="Transaction enregistrée">Conservez la référence de paiement dans vos échanges avec le support.</PaymentSecurityCard>
            {orderId ? <p className="text-center text-sm font-semibold leading-6 text-fifow-secondary">Prochaine étape : suivez la préparation et la remise depuis votre commande.</p> : null}
            <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
              <Button as={Link} to={destination} icon={orderId ? PackageCheck : Rocket}>{orderId ? 'Voir la commande' : 'Voir mes boosts'}</Button>
              <Button as={Link} to="/connected" variant="secondary">Retour à l’accueil</Button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function toReceipt(payment) {
  const providerLabels = { MOCK: 'Sandbox Fi Fow', ORANGE_MONEY: 'Orange Money', MTN_MOMO: 'MTN MoMo', OTHER: 'Partenaire de paiement' }
  return {
    reference: payment.internalReference,
    label: payment.type === 'BOOST' ? 'Boost Fi Fow' : 'Commande Fi Fow',
    amount: payment.amount,
    method: providerLabels[payment.provider] || payment.provider,
    paidAt: payment.paidAt ? new Intl.DateTimeFormat('fr-GN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.paidAt)) : 'Confirmé',
    transactionReference: payment.providerTransactionId || payment.internalReference,
  }
}
