import { useMutation, useQuery } from '@tanstack/react-query'
import { CreditCard, LockKeyhole, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createIdempotencyKey } from '../../api/commerceAdapters.js'
import { errorMessage } from '../../api/errors.js'
import { ordersApi } from '../../api/orders.js'
import { paymentsApi } from '../../api/payments.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import CheckoutProductSummary from '../../components/payment/CheckoutProductSummary.jsx'
import MobileMoneyPhoneInput from '../../components/payment/MobileMoneyPhoneInput.jsx'
import PaymentSecurityCard from '../../components/payment/PaymentSecurityCard.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'

export default function Checkout() {
  const { orderId } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState(auth.user?.phone || '')
  const [fieldError, setFieldError] = useState('')
  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => ordersApi.detail(orderId, { userId: auth.user.id }),
    enabled: Boolean(orderId),
  })
  const order = orderQuery.data
  const currentPayment = order?.payment || order?.payments?.[0]
  const pendingPayment = currentPayment && ['CREATED', 'PROCESSING'].includes(currentPayment.status) ? currentPayment : null
  const paymentMutation = useMutation({
    mutationFn: ({ normalizedPhone, idempotencyKey }) => paymentsApi.initiate({ orderId, phone: normalizedPhone }, { idempotencyKey }),
    onSuccess: (result) => {
      const payment = result?.payment || result
      navigate(`/payments/${payment.id}/processing?orderId=${encodeURIComponent(orderId)}`)
    },
  })

  useEffect(() => {
    const latest = order?.payment || order?.payments?.[0]
    if (latest && ['FAILED', 'CANCELLED'].includes(latest.status)) sessionStorage.removeItem(paymentKeyName(orderId))
  }, [order, orderId])

  function submitPayment(event) {
    event.preventDefault()
    const normalizedPhone = normalizePhone(phone)
    if (!/^\+?[0-9]{8,20}$/.test(normalizedPhone)) {
      setFieldError('Saisissez un numéro valide, par exemple +224 620 12 34 56.')
      return
    }
    setFieldError('')
    let idempotencyKey = sessionStorage.getItem(paymentKeyName(orderId))
    if (!idempotencyKey) {
      idempotencyKey = createIdempotencyKey(`order-payment:${orderId}`)
      sessionStorage.setItem(paymentKeyName(orderId), idempotencyKey)
    }
    paymentMutation.mutate({ normalizedPhone, idempotencyKey })
  }

  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Paiement" backTo={`/orders/${orderId}`} />
      <section className="marketplace-container py-6">
        {orderQuery.isLoading ? <LoadingBlock label="Chargement du paiement" rows={3} /> : null}
        {orderQuery.isError ? <ErrorBlock title="Paiement indisponible" message={errorMessage(orderQuery.error, 'La commande ne peut pas être chargée.')} onRetry={orderQuery.refetch} /> : null}
        {order && order.buyerId !== auth.user.id ? <ErrorBlock title="Action réservée à l’acheteur" message="Seul l’acheteur de cette commande peut effectuer le paiement." /> : null}
        {order && order.buyerId === auth.user.id ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-black uppercase text-fifow-primary">Transaction protégée</p>
                <h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">Finaliser le paiement</h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Le paiement n’est confirmé qu’après validation du fournisseur.</p>
              </div>

              {order.status === 'AWAITING_PAYMENT' && !pendingPayment ? (
                <form onSubmit={submitPayment} className="space-y-4">
                  <Card className="border-fifow-primary bg-fifow-lavender/30 p-5">
                    <div className="flex items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-fifow-primary"><Smartphone className="h-6 w-6" /></span>
                      <div><h2 className="font-black text-fifow-dark">Paiement mobile sécurisé</h2><p className="mt-1 text-sm font-semibold text-fifow-secondary">Le moyen disponible est déterminé par le fournisseur Fi Fow configuré.</p></div>
                    </div>
                  </Card>
                  <MobileMoneyPhoneInput value={phone} onChange={(value) => { setPhone(value); setFieldError('') }} error={fieldError} />
                  {paymentMutation.isError ? <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-fifow-red" role="alert">{errorMessage(paymentMutation.error, 'Le paiement ne peut pas être initialisé.')}</p> : null}
                  <Button type="submit" size="lg" className="sticky bottom-4 z-20 w-full lg:static" icon={LockKeyhole} loading={paymentMutation.isPending}>Lancer le paiement sécurisé</Button>
                </form>
              ) : null}

              {pendingPayment ? (
                <Card className="p-5">
                  <CreditCard className="h-8 w-8 text-fifow-primary" />
                  <h2 className="mt-3 text-xl font-black text-fifow-dark">Un paiement est déjà en vérification</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Reprenez son suivi sans créer une nouvelle transaction.</p>
                  <Button as={Link} to={`/payments/${pendingPayment.id}/processing?orderId=${encodeURIComponent(orderId)}`} className="mt-5">Reprendre le suivi</Button>
                </Card>
              ) : null}

              {!['AWAITING_PAYMENT'].includes(order.status) && !pendingPayment ? (
                <Card className="p-5">
                  <h2 className="text-xl font-black text-fifow-dark">Cette commande n’est pas payable maintenant</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Son statut actuel est « {order.statusLabel} ». Consultez le détail pour connaître la prochaine action.</p>
                  <Button as={Link} to={`/orders/${order.id}`} variant="secondary" className="mt-5">Voir la commande</Button>
                </Card>
              ) : null}
            </div>
            <aside className="space-y-4 lg:sticky lg:top-24"><CheckoutProductSummary order={order} /><PaymentSecurityCard /></aside>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function paymentKeyName(orderId) {
  return `fifow:payment-key:${orderId}`
}

function normalizePhone(value) {
  const compact = value.trim().replace(/[\s().-]/g, '')
  if (/^[6-7][0-9]{8}$/.test(compact)) return `+224${compact}`
  return compact
}
