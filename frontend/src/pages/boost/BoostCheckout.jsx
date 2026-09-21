import { useMutation, useQuery } from '@tanstack/react-query'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { boostsApi } from '../../api/boosts.js'
import { catalogueApi } from '../../api/catalogue.js'
import { createIdempotencyKey } from '../../api/commerceAdapters.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import BoostCheckoutCard from '../../components/boost/BoostCheckoutCard.jsx'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import MobileMoneyPhoneInput from '../../components/payment/MobileMoneyPhoneInput.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'

export default function BoostCheckout() {
  const { id: productSlug } = useParams()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId')
  const auth = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState(auth.user?.phone || '')
  const [fieldError, setFieldError] = useState('')
  const productQuery = useQuery({ queryKey: queryKeys.product(productSlug), queryFn: () => catalogueApi.detail(productSlug), enabled: Boolean(productSlug) })
  const plansQuery = useQuery({ queryKey: queryKeys.boostPlans, queryFn: boostsApi.plans })
  const plan = plansQuery.data?.find((item) => item.id === planId)
  const product = productQuery.data
  const boostMutation = useMutation({
    mutationFn: ({ normalizedPhone, idempotencyKey }) => boostsApi.create(product.id, { planId, phone: normalizedPhone }, { idempotencyKey }),
    onSuccess: ({ boost, payment }) => {
      sessionStorage.removeItem(`fifow:boost-key:${product.id}:${planId}`)
      navigate(`/payments/${payment.id}/processing?boostId=${encodeURIComponent(boost.id)}`)
    },
  })

  function submit(event) {
    event.preventDefault()
    const normalizedPhone = normalizePhone(phone)
    if (!/^\+?[0-9]{8,20}$/.test(normalizedPhone)) {
      setFieldError('Saisissez un numéro de paiement valide.')
      return
    }
    const storageKey = `fifow:boost-key:${product.id}:${planId}`
    let idempotencyKey = sessionStorage.getItem(storageKey)
    if (!idempotencyKey) {
      idempotencyKey = createIdempotencyKey('boost')
      sessionStorage.setItem(storageKey, idempotencyKey)
    }
    boostMutation.mutate({ normalizedPhone, idempotencyKey })
  }

  const backTo = `/boost/plans?productId=${encodeURIComponent(product?.id || '')}`
  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Paiement du boost" backTo={backTo} />
      <section className="marketplace-container py-6">
        {productQuery.isLoading || plansQuery.isLoading ? <LoadingBlock label="Chargement du boost" rows={3} /> : null}
        {productQuery.isError ? <ErrorBlock title="Annonce indisponible" message={errorMessage(productQuery.error)} onRetry={productQuery.refetch} /> : null}
        {plansQuery.isError ? <ErrorBlock title="Plans indisponibles" message={errorMessage(plansQuery.error)} onRetry={plansQuery.refetch} /> : null}
        {!plansQuery.isLoading && !plansQuery.isError && !plan ? <ErrorBlock title="Plan introuvable" message="Ce plan n’est plus disponible. Choisissez une formule active." /> : null}
        {product && product.seller?.id !== auth.user.id ? <ErrorBlock title="Action réservée au vendeur" message="Vous ne pouvez booster que vos propres annonces." /> : null}
        {product && plan && product.seller?.id === auth.user.id ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <form onSubmit={submit} className="space-y-5">
              <div><p className="text-xs font-black uppercase text-fifow-orange">Visibilité payante</p><h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">Confirmer le boost</h1><p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Le boost ne devient actif qu’après confirmation du paiement.</p></div>
              <MobileMoneyPhoneInput value={phone} onChange={(value) => { setPhone(value); setFieldError('') }} error={fieldError} />
              {boostMutation.isError ? <Card className="border-red-100 bg-red-50 p-4 text-sm font-bold text-fifow-red" role="alert">{errorMessage(boostMutation.error, 'Le boost ne peut pas être créé.')}</Card> : null}
              <Button type="submit" size="lg" className="sticky bottom-4 z-20 w-full lg:static" icon={LockKeyhole} loading={boostMutation.isPending}>Payer et lancer la vérification</Button>
              <Button as={Link} to={backTo} variant="secondary" className="w-full lg:w-auto">Changer de plan</Button>
            </form>
            <aside className="space-y-4 lg:sticky lg:top-24">
              <BoostCheckoutCard product={product} plan={plan} />
              <Card className="border-emerald-100 bg-fifow-mint p-4"><div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-fifow-green" /><p className="text-sm font-semibold leading-6 text-fifow-secondary">Le classement est appliqué côté serveur. Fi Fow ne garantit pas un nombre de vues ou de ventes.</p></div></Card>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function normalizePhone(value) {
  const compact = value.trim().replace(/[\s().-]/g, '')
  return /^[6-7][0-9]{8}$/.test(compact) ? `+224${compact}` : compact
}
