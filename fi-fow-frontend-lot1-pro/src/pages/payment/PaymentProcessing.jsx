import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock3, Headphones, RefreshCw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../api/errors.js'
import { paymentsApi } from '../../api/payments.js'
import { queryKeys } from '../../api/queryKeys.js'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import PaymentReferenceCard from '../../components/payment/PaymentReferenceCard.jsx'
import PaymentSecurityCard from '../../components/payment/PaymentSecurityCard.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { paymentStatus } from '../../lib/commerce.js'
import { cn } from '../../lib/utils.js'
import { useToast } from '../../lib/toast.jsx'

const pollingWindowMs = 2 * 60_000

export default function PaymentProcessing() {
  const { paymentId } = useParams()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const boostId = searchParams.get('boostId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const pollingStartedAt = useRef(Date.now())
  const paymentQuery = useQuery({
    queryKey: queryKeys.payment(paymentId),
    queryFn: () => paymentsApi.detail(paymentId),
    enabled: Boolean(paymentId),
    refetchInterval(query) {
      const status = query.state.data?.status
      if (status && paymentStatus(status).terminal) return false
      return Date.now() - pollingStartedAt.current < pollingWindowMs ? 3_000 : false
    },
    refetchIntervalInBackground: false,
  })
  const mockMutation = useMutation({
    mutationFn: () => paymentsApi.mockConfirm(paymentId, { outcome: 'SUCCEEDED' }),
    onSuccess: (result) => {
      const payment = result?.payment || result
      queryClient.setQueryData(queryKeys.payment(paymentId), payment)
      if (orderId) queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      queryClient.invalidateQueries({ queryKey: queryKeys.boosts })
      showToast('Paiement sandbox confirmé.')
    },
    onError: (error) => showToast(errorMessage(error, 'Confirmation sandbox impossible.'), { type: 'error' }),
  })
  const payment = paymentQuery.data
  const status = paymentStatus(payment?.status)
  const timedOut = Boolean(payment && !status.terminal && Date.now() - pollingStartedAt.current >= pollingWindowMs)

  useEffect(() => {
    if (payment?.status !== 'SUCCEEDED') return
    const query = new URLSearchParams()
    if (orderId) query.set('orderId', orderId)
    if (boostId) query.set('boostId', boostId)
    const timeout = window.setTimeout(() => navigate(`/payments/${paymentId}/success?${query.toString()}`, { replace: true }), 900)
    return () => window.clearTimeout(timeout)
  }, [boostId, navigate, orderId, payment?.status, paymentId])

  useEffect(() => {
    if (!orderId || !['FAILED', 'CANCELLED'].includes(payment?.status)) return
    sessionStorage.removeItem(`fifow:payment-key:${orderId}`)
  }, [orderId, payment?.status])

  const backTo = orderId ? `/orders/${orderId}` : '/profile/boosts'
  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Suivi du paiement" backTo={backTo} />
      <section className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        {paymentQuery.isLoading ? <LoadingBlock label="Vérification du paiement" rows={3} /> : null}
        {paymentQuery.isError ? <ErrorBlock title="Paiement introuvable" message={errorMessage(paymentQuery.error, 'Le statut du paiement ne peut pas être chargé.')} onRetry={paymentQuery.refetch} /> : null}
        {payment ? (
          <div className="space-y-5">
            <Card className="p-6 text-center sm:p-8" aria-live="polite">
              <StatusIcon status={payment.status} />
              <Badge variant={status.tone} className="mt-5">{status.label}</Badge>
              <h1 className="mt-3 text-2xl font-black text-fifow-dark sm:text-3xl">{statusTitle(payment.status)}</h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-fifow-secondary">{statusDescription(payment.status, timedOut)}</p>
            </Card>

            <PaymentReferenceCard reference={payment.internalReference} amount={payment.amount} />
            {payment.failureReason ? <Card className="border-red-100 bg-red-50 p-4 text-sm font-bold text-fifow-red" role="alert">{payment.failureReason}</Card> : null}
            <PaymentSecurityCard>Fi Fow se fie uniquement à la confirmation signée du fournisseur de paiement.</PaymentSecurityCard>

            <div className="grid gap-3 sm:grid-cols-2">
              {!status.terminal || timedOut ? <Button type="button" variant="secondary" icon={RefreshCw} loading={paymentQuery.isFetching} onClick={() => paymentQuery.refetch()}>Actualiser le statut</Button> : null}
              {['FAILED', 'CANCELLED'].includes(payment.status) && orderId ? <Button as={Link} to={`/checkout/${orderId}`}>Réessayer le paiement</Button> : null}
              {payment.status === 'REFUNDED' ? <Button as={Link} to={backTo} variant="secondary">Voir le dossier</Button> : null}
              <Button as={Link} to="/support" variant="secondary" icon={Headphones}>Contacter le support</Button>
            </div>

            {import.meta.env.DEV && payment.status === 'PROCESSING' ? (
              <Card className="border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase text-amber-800">Environnement local uniquement</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">Ce bouton simule le webhook signé du fournisseur pour valider le parcours de développement.</p>
                <Button type="button" size="sm" className="mt-3" loading={mockMutation.isPending} onClick={() => mockMutation.mutate()}>Confirmer le paiement sandbox</Button>
              </Card>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  )
}

function StatusIcon({ status }) {
  const success = status === 'SUCCEEDED'
  const failed = ['FAILED', 'CANCELLED'].includes(status)
  const Icon = success ? CheckCircle2 : failed ? AlertCircle : Clock3
  return <span className={cn('mx-auto grid h-20 w-20 place-items-center rounded-full', success ? 'bg-emerald-50 text-fifow-green' : failed ? 'bg-red-50 text-fifow-red' : 'bg-fifow-lavender text-fifow-primary')}><Icon className={cn('h-10 w-10', !success && !failed && 'animate-pulse')} /></span>
}

function statusTitle(status) {
  if (status === 'SUCCEEDED') return 'Paiement confirmé'
  if (status === 'FAILED') return 'Paiement non confirmé'
  if (status === 'CANCELLED') return 'Paiement annulé'
  if (status === 'REFUNDED') return 'Paiement remboursé'
  if (status === 'REFUND_PENDING') return 'Remboursement en cours'
  return 'Paiement en vérification'
}

function statusDescription(status, timedOut) {
  if (status === 'SUCCEEDED') return 'La confirmation du fournisseur a été reçue. Vous allez être redirigé.'
  if (status === 'FAILED') return 'Aucun montant n’est considéré comme payé. Vérifiez le motif avant de réessayer.'
  if (status === 'CANCELLED') return 'Cette tentative est terminée. Vous pouvez reprendre le paiement depuis la commande.'
  if (status === 'REFUNDED') return 'Le fournisseur a confirmé le remboursement de cette transaction.'
  if (timedOut) return 'La vérification continue côté serveur. Vous pouvez quitter cette page et revenir depuis vos commandes.'
  return 'Nous interrogeons le statut sécurisé. Ne relancez pas une deuxième transaction pendant cette vérification.'
}
