import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Check, HandCoins, Handshake, ImagePlus, MapPin, Send, ShieldCheck, ShoppingBag, Store, Truck, X } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { conversationsApi, toMessageView } from '../../api/conversations.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import ConversationListItem from '../../components/user/ConversationListItem.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { useRealtime } from '../../realtime/RealtimeContext.jsx'
import { cn } from '../../lib/utils.js'
import { formatGNF } from '../../lib/formatters.js'
import { useToast } from '../../lib/toast.jsx'
import ConfirmDialog from '../../components/commerce/ConfirmDialog.jsx'

const handoverLabels = { HAND_TO_HAND: 'Remise en main propre', HOME_DELIVERY: 'Livraison à domicile', PICKUP_POINT: 'Point de retrait' }
const offerLabels = { PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée', COUNTERED: 'Contre-proposée', EXPIRED: 'Expirée', CANCELLED: 'Annulée' }
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

export default function Conversation() {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const realtime = useRealtime()
  const showToast = useToast()
  const endRef = useRef(null)
  const messagesViewportRef = useRef(null)
  const loadingHistoryRef = useRef(false)
  const typingTimer = useRef(null)
  const incomingTypingTimer = useRef(null)
  const lastTypingSentAt = useRef(0)
  const [draft, setDraft] = useState('')
  const [counterpartTyping, setCounterpartTyping] = useState(false)
  const [offerOpen, setOfferOpen] = useState(searchParams.get('intent') === 'buy')
  const [counteringOffer, setCounteringOffer] = useState(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [handoverMode, setHandoverMode] = useState('HAND_TO_HAND')
  const [historySeededFor, setHistorySeededFor] = useState(null)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversationList,
    queryFn: () => conversationsApi.list({ limit: 50, userId: auth.user.id }),
  })
  const detailQuery = useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => conversationsApi.detail(id, auth.user.id),
    enabled: Boolean(id),
  })
  const detail = detailQuery.data
  const conversation = detail?.conversation
  const recentMessages = detail?.messages || []
  const offers = detail?.offers || []
  const messagesHistoryQuery = useInfiniteQuery({
    queryKey: queryKeys.conversationMessages(id),
    queryFn: ({ pageParam }) => conversationsApi.messages(id, { cursor: pageParam, limit: 100, userId: auth.user.id }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    enabled: Boolean(id && detail && historySeededFor === id),
  })
  const messages = useMemo(() => {
    const history = [...(messagesHistoryQuery.data?.pages || [])].reverse().flatMap((page) => page.items)
    const unique = new Map()
    ;[...history, ...recentMessages].forEach((message) => unique.set(message.id || message.clientId, message))
    return [...unique.values()].sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0))
  }, [messagesHistoryQuery.data, recentMessages])
  const timeline = useMemo(() => [
    ...messages.map((message) => ({ kind: 'message', id: message.id || message.clientId, createdAt: message.createdAt, value: message })),
    ...offers.map((offer) => ({ kind: 'offer', id: offer.id, createdAt: offer.createdAt, value: offer })),
  ].sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0)), [messages, offers])
  const isBuyer = conversation?.buyerId === auth.user.id
  const canOffer = Boolean(isBuyer && conversation?.product?.isNegotiable)
  const allowedHandoverModes = conversation?.product?.handoverModes || []

  useEffect(() => {
    if (!detail || !id) return
    queryClient.setQueryData(queryKeys.conversationMessages(id), (current) => current || {
      pages: [{
        items: detail.messages,
        nextCursor: detail.messages.length >= 100 ? detail.messages[0]?.id || null : null,
        hasNextPage: detail.messages.length >= 100,
      }],
      pageParams: [undefined],
    })
    setHistorySeededFor(id)
  }, [detail, id, queryClient])

  useEffect(() => {
    if (!conversation) return
    setOfferAmount((current) => current || String(Math.max(100, Math.round(conversation.price * 0.9))))
    setHandoverMode(conversation.product.handoverModes?.[0] || 'HAND_TO_HAND')
  }, [conversation])

  useEffect(() => {
    if (!id || realtime.status !== 'connected') return undefined
    const leave = realtime.joinConversation(id)
    const unsubscribeMessage = realtime.subscribe('message:new', (message) => {
      if (message?.conversationId !== id) return
      const normalized = toMessageView(message, auth.user.id)
      queryClient.setQueryData(queryKeys.conversation(id), (current) => {
        if (!current || current.messages.some((item) => item.id === normalized.id || (normalized.clientId && item.clientId === normalized.clientId))) return current
        return { ...current, messages: [...current.messages, normalized] }
      })
    })
    const unsubscribeRead = realtime.subscribe('message:read', (event) => {
      if (event?.conversationId !== id) return
      queryClient.setQueryData(queryKeys.conversation(id), (current) => current ? { ...current, messages: current.messages.map((message) => message.senderId !== event.readerId ? { ...message, readAt: event.readAt } : message) } : current)
    })
    const refreshOffers = (offer) => {
      if (offer?.conversationId === id) queryClient.invalidateQueries({ queryKey: queryKeys.conversation(id) })
    }
    const unsubscribeOfferNew = realtime.subscribe('offer:new', refreshOffers)
    const unsubscribeOfferUpdated = realtime.subscribe('offer:updated', refreshOffers)
    const unsubscribeTyping = realtime.subscribe('conversation:typing', (event) => {
      if (event?.conversationId !== id || event.userId === auth.user.id) return
      window.clearTimeout(incomingTypingTimer.current)
      setCounterpartTyping(Boolean(event.isTyping))
      if (event.isTyping) incomingTypingTimer.current = window.setTimeout(() => setCounterpartTyping(false), 2_500)
    })
    return () => {
      leave()
      unsubscribeMessage()
      unsubscribeRead()
      unsubscribeOfferNew()
      unsubscribeOfferUpdated()
      unsubscribeTyping()
    }
  }, [id, realtime, auth.user.id, queryClient])

  useEffect(() => {
    if (!detail || !conversation?.unread) return
    conversationsApi.read(id).then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationList })
      queryClient.setQueryData(queryKeys.conversation(id), (current) => current ? { ...current, conversation: { ...current.conversation, unread: 0, unreadCount: 0 } } : current)
    }).catch(() => undefined)
  }, [conversation?.unread, detail, id, queryClient])

  useEffect(() => {
    if (!loadingHistoryRef.current) endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, offers.length])

  useEffect(() => {
    if (offerOpen && conversation && !canOffer) setOfferOpen(false)
  }, [canOffer, conversation, offerOpen])

  useEffect(() => () => {
    window.clearTimeout(typingTimer.current)
    window.clearTimeout(incomingTypingTimer.current)
    if (id) realtime.emitTyping(id, false)
  }, [id, realtime])

  const textMutation = useMutation({
    mutationFn: ({ text, clientId }) => conversationsApi.sendText(id, text, clientId, auth.user.id),
    onMutate(variables) {
      const previous = queryClient.getQueryData(queryKeys.conversation(id))
      queryClient.setQueryData(queryKeys.conversation(id), (current) => {
        if (!current) return current
        const existing = current.messages.find((message) => message.clientId === variables.clientId)
        if (existing) return { ...current, messages: current.messages.map((message) => message.clientId === variables.clientId ? { ...message, pending: true, failed: false } : message) }
        const optimistic = { id: variables.clientId, clientId: variables.clientId, conversationId: id, senderId: auth.user.id, from: 'me', type: 'TEXT', text: variables.text, time: 'maintenant', createdAt: new Date().toISOString(), pending: true, retryVariables: variables }
        return { ...current, messages: [...current.messages, optimistic] }
      })
      return { previous }
    },
    onSuccess(message, variables) {
      queryClient.setQueryData(queryKeys.conversation(id), (current) => current ? { ...current, messages: current.messages.map((item) => item.clientId === variables.clientId ? message : item) } : current)
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationList })
    },
    onError(error, variables) {
      queryClient.setQueryData(queryKeys.conversation(id), (current) => current ? { ...current, messages: current.messages.map((message) => message.clientId === variables.clientId ? { ...message, pending: false, failed: true } : message) } : current)
      showToast(errorMessage(error, 'Message non envoyé.'), { type: 'error' })
    },
  })

  const imageMutation = useMutation({
    mutationFn: ({ file, clientId }) => conversationsApi.sendImage(id, file, clientId, auth.user.id),
    onMutate(variables) {
      queryClient.setQueryData(queryKeys.conversation(id), (current) => {
        if (!current) return current
        const existing = current.messages.find((message) => message.clientId === variables.clientId)
        if (existing) {
          return { ...current, messages: current.messages.map((message) => message.clientId === variables.clientId ? { ...message, pending: true, failed: false } : message) }
        }
        const preview = URL.createObjectURL(variables.file)
        return { ...current, messages: [...current.messages, { id: variables.clientId, clientId: variables.clientId, conversationId: id, senderId: auth.user.id, from: 'me', type: 'IMAGE', mediaUrl: preview, localPreview: preview, time: 'maintenant', createdAt: new Date().toISOString(), pending: true, retryVariables: variables }] }
      })
    },
    onSuccess(message, variables) {
      queryClient.setQueryData(queryKeys.conversation(id), (current) => {
        const previous = current?.messages.find((item) => item.clientId === variables.clientId)
        if (previous?.localPreview) URL.revokeObjectURL(previous.localPreview)
        return current ? { ...current, messages: current.messages.map((item) => item.clientId === variables.clientId ? message : item) } : current
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationList })
    },
    onError(error, variables) {
      queryClient.setQueryData(queryKeys.conversation(id), (current) => current ? { ...current, messages: current.messages.map((message) => message.clientId === variables.clientId ? { ...message, pending: false, failed: true } : message) } : current)
      showToast(errorMessage(error, 'Photo non envoyée.'), { type: 'error' })
    },
  })

  const offerMutation = useMutation({
    mutationFn: ({ type, offerId, input }) => type === 'create' ? conversationsApi.createOffer(id, input) : conversationsApi.respondOffer(offerId, input),
    onSuccess() {
      setOfferOpen(false)
      setCounteringOffer(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationList })
      showToast('Proposition mise à jour.')
    },
    onError: (error) => showToast(errorMessage(error, 'La proposition ne peut pas être envoyée.'), { type: 'error' }),
  })
  const archiveMutation = useMutation({
    mutationFn: () => conversationsApi.archive(id),
    onSuccess() { queryClient.invalidateQueries({ queryKey: queryKeys.conversationList }); navigate('/messages') },
    onError: (error) => showToast(errorMessage(error, 'Archivage impossible.'), { type: 'error' }),
  })

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || textMutation.isPending) return
    textMutation.mutate({ text, clientId: crypto.randomUUID() })
    setDraft('')
    realtime.emitTyping(id, false)
  }

  function updateDraft(value) {
    setDraft(value)
    const now = Date.now()
    if (now - lastTypingSentAt.current > 700) {
      realtime.emitTyping(id, true)
      lastTypingSentAt.current = now
    }
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => realtime.emitTyping(id, false), 1_500)
  }

  function sendImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!acceptedImageTypes.has(file.type)) return showToast('Utilisez une image JPEG, PNG, WebP, HEIC ou HEIF.', { type: 'error' })
    if (file.size > 5 * 1024 * 1024) return showToast('La photo ne doit pas dépasser 5 Mo.', { type: 'error' })
    imageMutation.mutate({ file, clientId: crypto.randomUUID() })
  }

  function submitOffer(event) {
    event.preventDefault()
    if (!/^[1-9][0-9]{2,14}$/.test(offerAmount)) return showToast('Saisissez un montant valide.', { type: 'error' })
    const input = { amount: offerAmount, handoverMode }
    offerMutation.mutate(counteringOffer ? { type: 'respond', offerId: counteringOffer.id, input: { action: 'COUNTER', ...input } } : { type: 'create', input })
  }

  async function loadPreviousMessages() {
    const viewport = messagesViewportRef.current
    const previousHeight = viewport?.scrollHeight || 0
    loadingHistoryRef.current = true
    const result = await messagesHistoryQuery.fetchNextPage()
    if (result.isError) showToast(errorMessage(result.error, 'Les anciens messages ne peuvent pas être chargés.'), { type: 'error' })
    window.requestAnimationFrame(() => {
      if (viewport) viewport.scrollTop += viewport.scrollHeight - previousHeight
      loadingHistoryRef.current = false
    })
  }

  function respond(offer, action) {
    if (action === 'COUNTER') {
      setCounteringOffer(offer)
      setOfferAmount(offer.amount)
      setHandoverMode(offer.handoverMode)
      setOfferOpen(true)
      return
    }
    offerMutation.mutate({ type: 'respond', offerId: offer.id, input: { action } })
  }

  if (detailQuery.isLoading) return <UserPageShell title="Conversation" backTo="/messages"><div className="h-[620px] animate-pulse rounded-lg bg-slate-100" /></UserPageShell>
  if (detailQuery.isError || !conversation) return <UserPageShell title="Conversation introuvable" backTo="/messages"><Card className="p-8 text-center"><p className="font-bold text-fifow-secondary">Cette conversation n’est plus accessible.</p><Button className="mt-4" onClick={() => detailQuery.refetch()}>Réessayer</Button></Card></UserPageShell>
  return (
    <UserPageShell title={conversation.seller} eyebrow="Conversation" subtitle={`${conversation.productTitle} • ${formatGNF(conversation.price)}`} backTo="/messages" backLabel="Retour aux messages">
      <div className="grid items-start gap-5 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)_290px]">
        <aside className="hidden max-h-[720px] space-y-3 overflow-y-auto lg:block">{conversationsQuery.data?.items.map((item) => <ConversationListItem key={item.id} conversation={item} active={item.id === id} compact />)}</aside>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-fifow-border bg-white p-4"><img src={conversation.avatar} alt="" className="h-12 w-12 rounded-full object-cover" /><div className="min-w-0 flex-1"><h2 className="font-black text-fifow-dark">{conversation.seller}</h2><p className="truncate text-sm font-semibold text-fifow-secondary">{counterpartTyping ? 'Écrit…' : conversation.location || 'Échange sécurisé Fi Fow'}</p></div>{canOffer ? <Button type="button" variant="secondary" size="sm" icon={HandCoins} onClick={() => { setCounteringOffer(null); setOfferOpen(true) }} className="hidden md:inline-flex">Proposer</Button> : null}<button type="button" onClick={() => setArchiveOpen(true)} aria-label="Archiver" className="grid h-10 w-10 place-items-center rounded-lg text-fifow-secondary hover:bg-slate-100"><Archive className="h-5 w-5" /></button><Link to={`/products/${conversation.productSlug}`}><img src={conversation.image} alt={conversation.productTitle} className="h-12 w-12 rounded-lg object-cover" /></Link></div>
          <div ref={messagesViewportRef} className="max-h-[560px] min-h-[440px] space-y-4 overflow-y-auto bg-fifow-bg p-4 sm:p-6">
            {messagesHistoryQuery.hasNextPage ? <div className="flex justify-center"><Button type="button" size="sm" variant="ghost" loading={messagesHistoryQuery.isFetchingNextPage} onClick={loadPreviousMessages}>Charger les messages précédents</Button></div> : null}
            {!messages.length && !offers.length ? <p className="py-16 text-center text-sm font-semibold text-fifow-secondary">Démarrez la conversation avec une question précise sur l’annonce.</p> : null}
            {timeline.map((item) => item.kind === 'message'
              ? <MessageBubble key={`message-${item.id}`} message={item.value} onRetry={() => item.value.type === 'IMAGE' ? imageMutation.mutate(item.value.retryVariables) : textMutation.mutate(item.value.retryVariables)} />
              : <OfferCard key={`offer-${item.id}`} offer={item.value} conversation={conversation} currentUserId={auth.user.id} onRespond={respond} loading={offerMutation.isPending} />)}
            {counterpartTyping ? <div className="flex"><span className="rounded-lg border border-fifow-border bg-white px-4 py-2 text-sm font-bold text-fifow-secondary">Écrit…</span></div> : null}
            <div ref={endRef} />
          </div>
          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-fifow-border bg-white p-3 sm:p-4"><label className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-lg bg-fifow-lavender text-fifow-primary"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={sendImage} className="sr-only" /><ImagePlus className="h-5 w-5" /></label><textarea value={draft} onChange={(event) => updateDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} rows={1} maxLength={2000} placeholder="Écrire un message…" aria-label="Message" className="min-h-12 max-h-32 min-w-0 flex-1 resize-none rounded-lg border border-fifow-border px-4 py-3 text-sm font-semibold outline-none focus:border-fifow-primary focus:ring-4 focus:ring-violet-100" /><Button type="submit" icon={Send} loading={textMutation.isPending} aria-label="Envoyer"><span className="hidden sm:inline">Envoyer</span></Button></form>
        </Card>
        <aside className="hidden space-y-4 xl:block xl:sticky xl:top-[92px]"><Card className="p-4"><Link to={`/products/${conversation.productSlug}`} className="block"><img src={conversation.image} alt={conversation.productTitle} className="aspect-[4/3] w-full rounded-lg object-cover" /><h2 className="mt-4 text-lg font-black text-fifow-dark">{conversation.productTitle}</h2><p className="mt-1 text-xl font-black text-fifow-primary">{formatGNF(conversation.price)}</p><p className="mt-2 flex items-center gap-2 text-sm font-bold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {conversation.location || 'Guinée'}</p></Link>{canOffer ? <Button type="button" variant="secondary" icon={HandCoins} onClick={() => { setCounteringOffer(null); setOfferOpen(true) }} className="mt-4 w-full">Proposer un prix</Button> : null}</Card><HumanTrustPanel title="Avant de conclure" items={['Demandez l’état réel du produit', 'Confirmez le lieu exact', 'Gardez une trace de l’échange']} /><div className="flex gap-2 rounded-lg border border-emerald-100 bg-fifow-mint p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-fifow-green" /><p className="text-sm font-semibold leading-6 text-fifow-secondary">Ne partagez jamais votre mot de passe ou un code de validation.</p></div></aside>
      </div>
      {offerOpen ? <OfferDialog amount={offerAmount} setAmount={setOfferAmount} handoverMode={handoverMode} setHandoverMode={setHandoverMode} allowedModes={allowedHandoverModes} price={conversation.price} counter={Boolean(counteringOffer)} loading={offerMutation.isPending} onClose={() => { setOfferOpen(false); setCounteringOffer(null) }} onSubmit={submitOffer} /> : null}
      <ConfirmDialog open={archiveOpen} title="Archiver cette conversation ?" description="Elle disparaîtra de votre liste. Un nouveau message la rendra de nouveau visible." confirmLabel="Archiver" loading={archiveMutation.isPending} onClose={() => setArchiveOpen(false)} onConfirm={() => archiveMutation.mutate()} />
    </UserPageShell>
  )
}

function MessageBubble({ message, onRetry }) {
  const mine = message.from === 'me'
  return <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[82%] rounded-lg px-4 py-3 text-sm font-semibold leading-6 shadow-sm sm:max-w-[70%]', mine ? 'bg-fifow-primary text-white' : 'border border-fifow-border bg-white text-fifow-dark', message.failed && 'border-2 border-red-300')}>
    {message.type === 'IMAGE' ? <img src={message.mediaUrl} alt="Photo envoyée" className="max-h-72 rounded-md object-contain" /> : <p className="whitespace-pre-wrap break-words">{message.text}</p>}
    <div className={cn('mt-1 flex items-center justify-end gap-2 text-[11px]', mine ? 'text-white/70' : 'text-fifow-muted')}><span>{message.time}</span>{message.pending ? <span>Envoi…</span> : mine && message.readAt ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Lu</span> : null}</div>
    {message.failed ? <button type="button" onClick={onRetry} className={cn('mt-1 text-xs font-black underline', mine ? 'text-white' : 'text-fifow-red')}>Réessayer</button> : null}
  </div></div>
}

function OfferCard({ offer, conversation, currentUserId, onRespond, loading }) {
  const expired = offer.status === 'PENDING' && new Date(offer.expiresAt) <= new Date()
  const status = expired ? 'EXPIRED' : offer.status
  const actionable = status === 'PENDING' && offer.recipientId === currentUserId
  const linkedOrderId = offer.orderId || offer.acceptedOrder?.id || sessionStorage.getItem(`fifow:offer-order:${offer.id}`)
  const canCreateOrder = status === 'ACCEPTED' && conversation?.buyerId === currentUserId && !linkedOrderId
  const productId = offer.productId || conversation?.product?.id
  const productRouteId = conversation?.productSlug || conversation?.product?.slug || productId
  const checkoutQuery = new URLSearchParams({
    offerId: offer.id,
    conversationId: conversation?.id || offer.conversationId,
    handoverMode: offer.handoverMode,
  }).toString()
  const HandoverIcon = offer.handoverMode === 'HOME_DELIVERY' ? Truck : offer.handoverMode === 'HAND_TO_HAND' ? Handshake : Store
  return <div className="mx-auto max-w-lg rounded-lg border border-violet-200 bg-white p-4 shadow-card"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-fifow-primary">{offer.creatorId === currentUserId ? 'Votre proposition' : 'Proposition reçue'}</p><p className="mt-1 text-2xl font-black text-fifow-dark">{formatGNF(Number(offer.amount))}</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-fifow-secondary"><HandoverIcon className="h-4 w-4" />{handoverLabels[offer.handoverMode]}</p>{offer.message ? <p className="mt-2 text-sm text-fifow-secondary">{offer.message}</p> : null}</div><span className={cn('rounded-full px-3 py-1 text-xs font-extrabold', status === 'ACCEPTED' ? 'bg-emerald-50 text-fifow-green' : status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-fifow-secondary')}>{offerLabels[status] || status}</span></div>{actionable ? <div className="mt-4 grid grid-cols-3 gap-2"><Button size="sm" variant="danger" disabled={loading} onClick={() => onRespond(offer, 'REJECT')}>Refuser</Button><Button size="sm" variant="secondary" disabled={loading} onClick={() => onRespond(offer, 'COUNTER')}>Contrer</Button><Button size="sm" disabled={loading} onClick={() => onRespond(offer, 'ACCEPT')}>Accepter</Button></div> : null}{canCreateOrder && productRouteId ? <Button as={Link} to={`/products/${productRouteId}/buy?${checkoutQuery}`} icon={ShoppingBag} className="mt-4 w-full">Créer la commande</Button> : null}{linkedOrderId && conversation?.buyerId === currentUserId ? <Button as={Link} to={`/orders/${linkedOrderId}`} variant="secondary" className="mt-4 w-full">Voir la commande</Button> : null}</div>
}

function OfferDialog({ amount, setAmount, handoverMode, setHandoverMode, allowedModes, price, counter, loading, onClose, onSubmit }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="offer-title"><form onSubmit={onSubmit} className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase text-fifow-primary">Négociation</p><h2 id="offer-title" className="mt-1 text-2xl font-black text-fifow-dark">{counter ? 'Faire une contre-proposition' : 'Proposer un prix'}</h2><p className="mt-1 text-sm font-semibold text-fifow-secondary">Prix affiché : {formatGNF(price)}</p></div><button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-fifow-secondary"><X className="h-5 w-5" /></button></div><label className="mt-6 block"><span className="text-sm font-extrabold text-fifow-dark">Montant proposé</span><div className="mt-2 flex h-14 items-center rounded-lg border border-fifow-border px-4 focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100"><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric" className="min-w-0 flex-1 bg-transparent text-xl font-black text-fifow-dark outline-none" autoFocus /><span className="font-extrabold text-fifow-secondary">GNF</span></div></label><fieldset className="mt-5"><legend className="text-sm font-extrabold text-fifow-dark">Mode de remise</legend><div className="mt-2 grid gap-2">{allowedModes.map((mode) => <label key={mode} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-extrabold', handoverMode === mode ? 'border-fifow-primary bg-fifow-lavender text-fifow-primary' : 'border-fifow-border text-fifow-secondary')}><input type="radio" checked={handoverMode === mode} onChange={() => setHandoverMode(mode)} className="accent-fifow-primary" />{handoverLabels[mode]}</label>)}</div></fieldset><div className="mt-6 grid grid-cols-2 gap-3"><Button type="button" variant="secondary" onClick={onClose}>Annuler</Button><Button type="submit" icon={Send} loading={loading}>Envoyer</Button></div></form></div>
}
