import { useState } from 'react'
import { CheckCircle2, HandCoins, ImagePlus, MapPin, Phone, Send, ShieldCheck, Store, Truck, X } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { conversationMessages, conversations } from '../../data/clientPortal.js'
import { cn } from '../../lib/utils.js'
import { formatGNF } from '../../lib/formatters.js'
import { useToast } from '../../lib/toast.jsx'

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const conversation = conversations.find((item) => item.id === id)
  const [messages, setMessages] = useState(conversationMessages)
  const [draft, setDraft] = useState('')
  const [offerOpen, setOfferOpen] = useState(searchParams.get('intent') === 'buy')
  const [offerAmount, setOfferAmount] = useState(() => String(Math.round((conversation?.price ?? 0) * 0.9)))
  const [deliveryMode, setDeliveryMode] = useState('meetup')
  const [offer, setOffer] = useState(null)
  const [orderCreated, setOrderCreated] = useState(false)
  const showToast = useToast()

  if (!conversation) return <Navigate to="/messages" replace />

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [...current, {
      id: Date.now(),
      from: 'me',
      text,
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
    }])
    setDraft('')
  }

  function submitOffer(event) {
    event.preventDefault()
    const amount = Number(offerAmount)
    if (!amount || amount <= 0) {
      showToast('Saisissez un montant valide', { type: 'error' })
      return
    }

    setOffer({ amount, deliveryMode, status: 'pending' })
    setOfferOpen(false)
    showToast('Votre proposition a été envoyée')

    window.setTimeout(() => {
      setOffer((current) => current ? { ...current, status: 'accepted' } : current)
      setMessages((current) => [...current, {
        id: Date.now(),
        from: 'seller',
        text: `J’accepte votre proposition de ${formatGNF(amount)}. Nous pouvons confirmer les conditions.`,
        time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      }])
    }, 900)
  }

  function createOrder() {
    setOrderCreated(true)
    showToast('Commande créée. Vous pouvez maintenant payer.')
  }

  return (
    <UserPageShell
      title={conversation.seller}
      eyebrow="Conversation"
      subtitle={`${conversation.product} • ${formatGNF(conversation.price)}`}
      backTo="/messages"
      backLabel="Retour aux messages"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-fifow-border bg-white p-4">
            <img src={conversation.avatar} alt="" className="h-12 w-12 rounded-full" />
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-fifow-dark">{conversation.seller}</h2>
              <p className="truncate text-sm font-semibold text-fifow-secondary">{conversation.online ? 'En ligne' : 'Hors ligne'} • {conversation.location}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" icon={HandCoins} onClick={() => setOfferOpen(true)} className="hidden md:inline-flex">
              Proposer un prix
            </Button>
            <a href="tel:+224620123456" className="hidden h-10 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-sm font-black text-fifow-green sm:inline-flex"><Phone className="h-4 w-4" /> Appeler</a>
            <Link to={`/products/${conversation.product.includes('Nike') ? 'nike-air-force' : conversation.product.includes('TV') ? 'samsung-tv' : 'gucci-bag'}`}>
              <img src={conversation.image} alt={conversation.product} className="h-12 w-12 rounded-lg object-cover" />
            </Link>
          </div>

          <div className="min-h-[440px] space-y-4 bg-fifow-bg p-4 sm:p-6">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[82%] rounded-lg px-4 py-3 text-sm font-semibold leading-6 shadow-sm sm:max-w-[66%]', message.from === 'me' ? 'bg-fifow-primary text-white' : 'border border-fifow-border bg-white text-fifow-dark')}>
                  {message.text}
                  <p className={cn('mt-1 text-right text-[11px]', message.from === 'me' ? 'text-white/70' : 'text-fifow-muted')}>{message.time}</p>
                </div>
              </div>
            ))}

            {offer ? (
              <div className="mx-auto max-w-lg rounded-lg border border-violet-200 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-fifow-primary">Proposition de prix</p>
                    <p className="mt-1 text-2xl font-black text-fifow-dark">{formatGNF(offer.amount)}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-fifow-secondary">
                      {offer.deliveryMode === 'delivery' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                      {offer.deliveryMode === 'delivery' ? 'Livraison à définir' : 'Remise en main propre'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${offer.status === 'accepted' ? 'bg-emerald-50 text-fifow-green' : 'bg-amber-50 text-amber-700'}`}>
                    {offer.status === 'accepted' ? 'Acceptée' : 'En attente'}
                  </span>
                </div>

                {offer.status === 'accepted' && !orderCreated ? (
                  <Button className="mt-4 w-full" icon={CheckCircle2} onClick={createOrder}>Confirmer les conditions</Button>
                ) : null}

                {orderCreated ? (
                  <div className="mt-4 border-t border-fifow-border pt-4">
                    <p className="flex items-center gap-2 font-extrabold text-fifow-green"><CheckCircle2 className="h-5 w-5" /> Commande créée</p>
                    <p className="mt-1 text-sm font-semibold text-fifow-secondary">Le prix et le mode de remise sont enregistrés.</p>
                    <Button className="mt-4 w-full" onClick={() => navigate('/checkout/order-ff-7g8x')}>Passer au paiement</Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-fifow-border bg-white p-3 sm:p-4">
            <button type="button" onClick={() => showToast('Ajout de photo prêt pour la connexion au stockage', { type: 'info' })} aria-label="Ajouter une photo" className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary">
              <ImagePlus className="h-5 w-5" />
            </button>
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire un message..." aria-label="Message" />
            <Button type="submit" icon={Send} aria-label="Envoyer"><span className="hidden sm:inline">Envoyer</span></Button>
          </form>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
          <Card className="p-4">
            <Link to={`/products/${conversation.product.includes('Nike') ? 'nike-air-force' : conversation.product.includes('TV') ? 'samsung-tv' : 'gucci-bag'}`} className="block">
              <img src={conversation.image} alt={conversation.product} className="aspect-[4/3] w-full rounded-lg object-cover" />
              <h2 className="mt-4 text-lg font-black text-fifow-dark">{conversation.product}</h2>
              <p className="mt-1 text-xl font-black text-fifow-primary">{formatGNF(conversation.price)}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {conversation.location}</p>
            </Link>
            <Button type="button" variant="secondary" icon={HandCoins} onClick={() => setOfferOpen(true)} className="mt-4 w-full">Proposer un prix</Button>
          </Card>
          <HumanTrustPanel title="Avant de conclure" items={['Demandez l’état réel du produit', 'Confirmez le lieu exact', 'Gardez une trace de l’échange']} />
          <div className="flex gap-2 rounded-lg border border-emerald-100 bg-fifow-mint p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-fifow-green" />
            <p className="text-sm font-semibold leading-6 text-fifow-secondary">Un vendeur sérieux répond clairement et confirme le produit avant la rencontre.</p>
          </div>
        </aside>
      </div>

      {offerOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="offer-title">
          <form onSubmit={submitOffer} className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-fifow-primary">Négociation</p>
                <h2 id="offer-title" className="mt-1 text-2xl font-black text-fifow-dark">Proposer un prix</h2>
                <p className="mt-1 text-sm font-semibold text-fifow-secondary">Prix affiché : {formatGNF(conversation.price)}</p>
              </div>
              <button type="button" onClick={() => setOfferOpen(false)} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-fifow-secondary"><X className="h-5 w-5" /></button>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-extrabold text-fifow-dark">Votre proposition</span>
              <div className="mt-2 flex h-14 items-center rounded-lg border border-fifow-border px-4 focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100">
                <input value={offerAmount} onChange={(event) => setOfferAmount(event.target.value.replace(/\D/g, ''))} inputMode="numeric" className="min-w-0 flex-1 bg-transparent text-xl font-black text-fifow-dark outline-none" autoFocus />
                <span className="font-extrabold text-fifow-secondary">GNF</span>
              </div>
            </label>

            <fieldset className="mt-5">
              <legend className="text-sm font-extrabold text-fifow-dark">Mode de remise souhaité</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <DeliveryChoice icon={Store} label="Main propre" value="meetup" selected={deliveryMode} onChange={setDeliveryMode} />
                <DeliveryChoice icon={Truck} label="Livraison" value="delivery" selected={deliveryMode} onChange={setDeliveryMode} />
              </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => setOfferOpen(false)}>Annuler</Button>
              <Button type="submit" icon={Send}>Envoyer</Button>
            </div>
          </form>
        </div>
      ) : null}
    </UserPageShell>
  )
}

function DeliveryChoice({ icon: Icon, label, value, selected, onChange }) {
  const active = selected === value
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-extrabold transition ${active ? 'border-fifow-primary bg-fifow-lavender text-fifow-primary' : 'border-fifow-border text-fifow-secondary hover:border-violet-200'}`}>
      <input type="radio" name="deliveryMode" value={value} checked={active} onChange={() => onChange(value)} className="sr-only" />
      <Icon className="h-5 w-5" /> {label}
    </label>
  )
}
