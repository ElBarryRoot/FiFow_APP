import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Handshake, Home, MapPinned, ShieldCheck, ShoppingBag, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { cartApi } from '../../api/cart.js'
import { createIdempotencyKey } from '../../api/commerceAdapters.js'
import { errorMessage } from '../../api/errors.js'
import { ordersApi } from '../../api/orders.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import AppHeader from '../../components/layout/AppHeader.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { handoverLabels } from '../../lib/commerce.js'
import { cn } from '../../lib/utils.js'

const modeIcons = {
  HAND_TO_HAND: Handshake,
  HOME_DELIVERY: Home,
  PICKUP_POINT: Store,
}

export default function BuyProduct() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const offerId = searchParams.get('offerId') || undefined
  const conversationId = searchParams.get('conversationId') || undefined
  const requestedMode = searchParams.get('handoverMode') || ''
  const cartSellerId = searchParams.get('cartSeller') || ''
  const cartQuery = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.get,
    enabled: Boolean(cartSellerId),
  })
  const cartGroup = location.state?.cartGroup || cartQuery.data?.groups?.find((group) => group.seller.id === cartSellerId)
  const multiItem = Boolean(cartGroup?.items?.length)
  const initialProduct = location.state?.product
  const productQuery = useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => catalogueApi.detail(id),
    initialData: initialProduct?.id === id || initialProduct?.slug === id ? initialProduct : undefined,
    enabled: Boolean(id),
  })
  const product = productQuery.data
  const allowedModes = useMemo(() => {
    if (!multiItem) return product?.handoverModes || []
    const [first, ...rest] = cartGroup.items
    return (first?.product?.handoverModes || []).filter((mode) => rest.every((item) => item.product.handoverModes?.includes(mode)))
  }, [cartGroup, multiItem, product?.handoverModes])
  const [handoverMode, setHandoverMode] = useState('')
  const [details, setDetails] = useState(() => ({
    recipientName: auth.user?.fullName || '',
    phone: auth.user?.phone || '',
    commune: auth.user?.commune || '',
    quartier: auth.user?.quartier || '',
    addressLine: '',
    instructions: '',
    pickupLocation: '',
    meetingLocation: [auth.user?.quartier, auth.user?.commune].filter(Boolean).join(', '),
  }))
  const [quote, setQuote] = useState(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!allowedModes.length || handoverMode) return
    setHandoverMode(allowedModes.includes(requestedMode) ? requestedMode : allowedModes[0])
  }, [allowedModes, handoverMode, requestedMode])

  const quoteMutation = useMutation({
    mutationFn: (input) => ordersApi.quote(input),
    onSuccess: (nextQuote) => {
      setQuote(nextQuote)
      setAcceptedTerms(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  })
  const createMutation = useMutation({
    mutationFn: () => {
      const storageKey = `fifow:order-key:${quote.id}`
      let idempotencyKey = sessionStorage.getItem(storageKey)
      if (!idempotencyKey) {
        idempotencyKey = createIdempotencyKey(`order:${quote.id}`)
        sessionStorage.setItem(storageKey, idempotencyKey)
      }
      return ordersApi.create(
        { quoteId: quote.id, ...(conversationId ? { conversationId } : {}) },
        { idempotencyKey, userId: auth.user.id },
      )
    },
    onSuccess: (order) => {
      sessionStorage.removeItem(`fifow:order-key:${quote.id}`)
      if (offerId) sessionStorage.setItem(`fifow:offer-order:${offerId}`, order.id)
      if (conversationId) queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart })
      navigate(`/orders/${order.id}`, { replace: true })
    },
  })

  const handoverDetails = useMemo(() => {
    if (handoverMode === 'HOME_DELIVERY') {
      return {
        recipientName: details.recipientName.trim(),
        phone: normalizePhone(details.phone),
        commune: details.commune.trim(),
        quartier: details.quartier.trim(),
        addressLine: details.addressLine.trim(),
        ...(details.instructions.trim() ? { instructions: details.instructions.trim() } : {}),
      }
    }
    if (handoverMode === 'PICKUP_POINT') return { pickupLocation: details.pickupLocation.trim(), phone: normalizePhone(details.phone) }
    return { meetingLocation: details.meetingLocation.trim(), phone: normalizePhone(details.phone) }
  }, [details, handoverMode])

  function updateDetail(field, value) {
    setDetails((current) => ({ ...current, [field]: value }))
    setQuote(null)
    setValidationError('')
  }

  function selectMode(mode) {
    setHandoverMode(mode)
    setQuote(null)
    setValidationError('')
  }

  function quoteInput() {
    return {
      ...(multiItem
        ? { items: cartGroup.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) }
        : { productId: product.id, ...(offerId ? { offerId } : {}) }),
      handoverMode,
      handoverDetails,
    }
  }

  function requestQuote(event) {
    event?.preventDefault()
    const error = validateHandover(handoverMode, handoverDetails)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    quoteMutation.mutate(quoteInput())
  }

  if (productQuery.isLoading || (cartSellerId && cartQuery.isLoading && !cartGroup)) return <CommerceLoader onBack={() => navigate(-1)} />
  if (productQuery.isError || !product) {
    return (
      <CommerceShell onBack={() => navigate(-1)}>
        <ErrorBlock title="Produit indisponible" message={errorMessage(productQuery.error, 'Cette annonce ne peut pas être achetée actuellement.')} onRetry={productQuery.refetch} />
      </CommerceShell>
    )
  }

  if (cartSellerId && !cartGroup) {
    return <CommerceShell onBack={() => navigate('/cart')}><ErrorBlock title="Groupe introuvable" message="Ce groupe de panier est vide ou n’est plus disponible." /></CommerceShell>
  }

  if (auth.user?.id === product.seller?.id) {
    return (
      <CommerceShell onBack={() => navigate(-1)}>
        <ErrorBlock title="Votre propre annonce" message="Vous ne pouvez pas acheter un produit que vous vendez." />
      </CommerceShell>
    )
  }

  if (multiItem && !allowedModes.length) {
    return <CommerceShell onBack={() => navigate('/cart')}><ErrorBlock title="Remise incompatible" message="Ces annonces n’ont aucun mode de remise en commun. Retirez un article ou commandez-le séparément." /></CommerceShell>
  }

  if (multiItem && !cartGroup.canCheckout) {
    return <CommerceShell onBack={() => navigate('/cart')}><ErrorBlock title="Panier à actualiser" message="Au moins une annonce n’est plus disponible dans la quantité demandée. Modifiez ce groupe avant de continuer." /></CommerceShell>
  }

  return (
    <CommerceShell onBack={() => navigate(-1)}>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-fifow-primary">Achat sécurisé</p>
        <h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">{multiItem ? `Finaliser ${cartGroup.items.length} articles` : "Finaliser l'achat en toute confiance"}</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-fifow-secondary">Fi Fow calcule le montant exact, garde un suivi clair et vous guide jusqu'à la confirmation de réception.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          {!quote ? (
            <form onSubmit={requestQuote} className="space-y-5">
              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-black text-fifow-dark">Choisir la remise</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Mode de remise">
                  {allowedModes.map((mode) => {
                    const Icon = modeIcons[mode] || MapPinned
                    const selected = handoverMode === mode
                    return (
                      <button key={mode} type="button" role="radio" aria-checked={selected} onClick={() => selectMode(mode)} className={cn('relative min-h-28 rounded-lg border p-4 text-left transition', selected ? 'border-fifow-primary bg-fifow-lavender ring-2 ring-violet-100' : 'border-fifow-border bg-white hover:border-violet-200')}>
                        <Icon className={cn('h-6 w-6', selected ? 'text-fifow-primary' : 'text-fifow-secondary')} />
                        <span className="mt-3 block text-sm font-black text-fifow-dark">{handoverLabels[mode] || mode}</span>
                        {selected ? <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-fifow-primary text-white"><Check className="h-4 w-4" /></span> : null}
                      </button>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-black text-fifow-dark">Informations de remise</h2>
                <p className="mt-1 text-sm font-semibold text-fifow-secondary">Ces informations servent uniquement à cette transaction.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {handoverMode === 'HOME_DELIVERY' ? <>
                    <Field label="Nom du destinataire"><Input value={details.recipientName} maxLength={80} onChange={(event) => updateDetail('recipientName', event.target.value)} autoComplete="name" /></Field>
                    <Field label="Téléphone"><Input value={details.phone} maxLength={20} inputMode="tel" onChange={(event) => updateDetail('phone', event.target.value)} autoComplete="tel" placeholder="+224 6…" /></Field>
                    <Field label="Commune"><Input value={details.commune} maxLength={80} onChange={(event) => updateDetail('commune', event.target.value)} /></Field>
                    <Field label="Quartier"><Input value={details.quartier} maxLength={80} onChange={(event) => updateDetail('quartier', event.target.value)} /></Field>
                    <Field label="Adresse précise" className="sm:col-span-2"><Input value={details.addressLine} maxLength={300} onChange={(event) => updateDetail('addressLine', event.target.value)} placeholder="Rue, repère ou bâtiment" /></Field>
                    <Field label="Instructions complémentaires (optionnel)" className="sm:col-span-2"><Textarea value={details.instructions} maxLength={500} onChange={(event) => updateDetail('instructions', event.target.value)} className="min-h-24" /></Field>
                  </> : null}
                  {handoverMode === 'PICKUP_POINT' ? <><Field label="Téléphone"><Input value={details.phone} maxLength={20} inputMode="tel" onChange={(event) => updateDetail('phone', event.target.value)} autoComplete="tel" placeholder="+224 6…" /></Field><Field label="Point de retrait souhaité"><Input value={details.pickupLocation} maxLength={300} onChange={(event) => updateDetail('pickupLocation', event.target.value)} placeholder="Nom et emplacement du point" /></Field></> : null}
                  {handoverMode === 'HAND_TO_HAND' ? <><Field label="Téléphone"><Input value={details.phone} maxLength={20} inputMode="tel" onChange={(event) => updateDetail('phone', event.target.value)} autoComplete="tel" placeholder="+224 6…" /></Field><Field label="Lieu de rencontre"><Input value={details.meetingLocation} maxLength={300} onChange={(event) => updateDetail('meetingLocation', event.target.value)} placeholder="Lieu public et précis" /></Field></> : null}
                </div>
                {validationError ? <p className="mt-4 text-sm font-bold text-fifow-red" role="alert">{validationError}</p> : null}
              </Card>

              {quoteMutation.isError ? <ErrorBlock title="Devis impossible" message={errorMessage(quoteMutation.error)} onRetry={() => requestQuote()} /> : null}
              <Button type="submit" size="lg" className="w-full sm:w-auto" icon={ShoppingBag} loading={quoteMutation.isPending}>Calculer mon récapitulatif</Button>
            </form>
          ) : (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-fifow-primary">Devis Fi Fow</p>
                  <h2 className="mt-1 text-2xl font-black text-fifow-dark">Votre récapitulatif</h2>
                  <p className="mt-1 text-sm font-semibold text-fifow-secondary">Valable jusqu’au {formatExpiry(quote.expiresAt)}.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" icon={ArrowLeft} onClick={() => setQuote(null)}>Modifier</Button>
              </div>
              <div className="mt-6 space-y-3 border-y border-fifow-border py-5 text-sm font-semibold text-fifow-secondary">
                <AmountRow label={quote.items?.length > 1 ? `Articles (${quote.items.length})` : "Prix de l’article"} value={quote.itemAmount} />
                <AmountRow label="Protection de votre achat" value={quote.buyerProtectionFee} helper="Paiement sécurisé, suivi de la commande et assistance en cas de problème." />
                <AmountRow label="Livraison" value={quote.deliveryFee} zeroLabel="Offerte" />
                {Number(quote.discountAmount || 0) > 0 ? <AmountRow label="Réduction" value={-Number(quote.discountAmount)} /> : null}
              </div>
              <div className="flex items-end justify-between gap-4 py-5">
                <span className="font-black text-fifow-dark">Total sécurisé</span>
                <span className="text-2xl font-black text-fifow-primary">{formatGNF(Number(quote.totalAmount || 0))}</span>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-fifow-border bg-slate-50 p-4 text-sm font-semibold leading-6 text-fifow-secondary">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-fifow-primary" />
                <span>Je confirme le mode de remise et accepte les conditions de la transaction et de la Protection acheteur.</span>
              </label>
              {createMutation.isError ? <p className="mt-4 text-sm font-bold text-fifow-red" role="alert">{errorMessage(createMutation.error)}</p> : null}
              <Button type="button" size="lg" className="mt-5 w-full" icon={ShieldCheck} disabled={!acceptedTerms} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Créer la commande</Button>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <PurchaseSummary product={product} cartGroup={multiItem ? cartGroup : null} />
          <Card className="border-emerald-100 bg-fifow-mint p-4">
            <div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-fifow-green" /><div><h2 className="font-black text-fifow-dark">Votre achat est protégé</h2><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">Votre paiement reste suivi jusqu’à la confirmation de réception. Le montant de protection est calculé côté serveur.</p></div></div>
          </Card>
        </aside>
      </div>
    </CommerceShell>
  )
}

function PurchaseSummary({ product, cartGroup }) {
  return (
    <Card className="p-4">
      {cartGroup ? (
        <div>
          <div className="flex items-center justify-between gap-3"><h2 className="truncate font-black text-fifow-dark">Chez {cartGroup.seller.fullName}</h2><Badge variant="primary">{cartGroup.items.length} articles</Badge></div>
          <div className="mt-3 divide-y divide-fifow-border">{cartGroup.items.map((item) => <div key={item.id} className="flex gap-3 py-3"><img src={item.product.imageUrl || '/assets/empty-product.svg'} alt="" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0"><p className="line-clamp-1 text-sm font-black text-fifow-dark">{item.product.title}</p><p className="mt-1 text-xs font-bold text-fifow-secondary">{item.quantity} × {formatGNF(item.currentUnitPrice)}</p></div></div>)}</div>
          <Link to="/cart" className="mt-3 block text-center text-sm font-black text-fifow-primary hover:underline">Modifier le panier</Link>
        </div>
      ) : (
        <>
          <div className="flex gap-4"><img src={product.image} alt={product.title} className="h-24 w-24 shrink-0 rounded-lg object-cover" /><div className="min-w-0"><Badge variant="success">{product.condition}</Badge><h2 className="mt-2 line-clamp-2 font-black text-fifow-dark">{product.title}</h2><p className="mt-1 text-lg font-black text-fifow-primary">{formatGNF(product.price)}</p></div></div>
          <Link to={`/products/${product.slug}`} className="mt-4 block text-center text-sm font-black text-fifow-primary hover:underline">Revoir l’annonce</Link>
        </>
      )}
    </Card>
  )
}

function CommerceShell({ onBack, children }) {
  return <main className="min-h-screen bg-fifow-bg pb-10"><AppHeader showBack title="Acheter" onBack={onBack} showSearch={false} mobileSearch={false} showPublish={false} /><section className="marketplace-container py-6">{children}</section></main>
}

function CommerceLoader({ onBack }) {
  return <CommerceShell onBack={onBack}><LoadingBlock rows={3} /></CommerceShell>
}

function Field({ label, className = '', children }) {
  return <label className={className}><span className="mb-2 block text-sm font-extrabold text-fifow-dark">{label}</span>{children}</label>
}

function AmountRow({ label, value, helper, zeroLabel }) {
  const amount = Number(value || 0)
  return <div className="flex items-start justify-between gap-5"><span>{label}{helper ? <small className="mt-0.5 block max-w-md font-medium leading-5">{helper}</small> : null}</span><span className="whitespace-nowrap font-black text-fifow-dark">{amount === 0 && zeroLabel ? zeroLabel : formatGNF(amount)}</span></div>
}

function normalizePhone(value) {
  const normalized = value.trim().replace(/[\s().-]/g, '')
  return normalized || undefined
}

function validateHandover(mode, details) {
  if (!mode) return 'Sélectionnez un mode de remise.'
  if (!details.phone || !/^\+?[0-9]{8,20}$/.test(details.phone)) return 'Renseignez un numéro de téléphone valide.'
  if (mode === 'HOME_DELIVERY' && !details.recipientName) return 'Renseignez le nom du destinataire.'
  if (mode === 'HOME_DELIVERY' && (!details.commune || !details.quartier || !details.addressLine)) return 'Renseignez la commune, le quartier et l’adresse de livraison.'
  if (mode === 'PICKUP_POINT' && !details.pickupLocation) return 'Renseignez le point de retrait souhaité.'
  if (mode === 'HAND_TO_HAND' && !details.meetingLocation) return 'Renseignez un lieu de rencontre.'
  return ''
}

function formatExpiry(value) {
  if (!value) return 'délai indiqué'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'délai indiqué'
  return new Intl.DateTimeFormat('fr-GN', { hour: '2-digit', minute: '2-digit' }).format(date)
}
