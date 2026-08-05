import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, CreditCard, MessageCircle, Rocket, ShieldCheck, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../../api/notifications.js'
import { queryKeys } from '../../api/queryKeys.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

const icons = {
  NEW_MESSAGE: MessageCircle,
  OFFER_RECEIVED: CreditCard,
  OFFER_ACCEPTED: CreditCard,
  OFFER_REJECTED: CreditCard,
  PAYMENT_CONFIRMED: CreditCard,
  PAYMENT_SUCCEEDED: CreditCard,
  PAYMENT_FAILED: CreditCard,
  BOOST_ACTIVATED: Rocket,
  REVIEW_RECEIVED: Star,
  SELLER_VERIFICATION_APPROVED: ShieldCheck,
}

function notificationLink(notification) {
  const data = notification.data || {}
  if (data.supportTicketId) return `/support/${data.supportTicketId}`
  if (data.conversationId) return `/messages/${data.conversationId}`
  if (data.orderId) return `/orders/${data.orderId}`
  if (data.paymentId) return `/payments/${data.paymentId}/processing${data.boostId ? `?boostId=${encodeURIComponent(data.boostId)}` : ''}`
  return null
}

export default function Notifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notificationsQuery = useInfiniteQuery({
    queryKey: queryKeys.notificationPages,
    queryFn: ({ pageParam }) => notificationsApi.list({ cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const notifications = notificationsQuery.data?.pages.flatMap((page) => page.items) || []
  const unreadCount = notificationsQuery.data?.pages[0]?.unreadCount || 0

  const readMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.markRead(notificationId),
    onMutate(notificationId) {
      const previous = queryClient.getQueryData(queryKeys.notificationPages)
      queryClient.setQueryData(queryKeys.notificationPages, (current) => {
        if (!current) return current
        const wasUnread = current.pages.some((page) => page.items.some((notification) => notification.id === notificationId && notification.unread))
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            unreadCount: wasUnread ? Math.max(0, page.unreadCount - 1) : page.unreadCount,
            items: page.items.map((notification) => notification.id === notificationId ? { ...notification, unread: false, readAt: new Date().toISOString() } : notification),
          })),
        }
      })
      return { previous }
    },
    onError(_error, _notificationId, context) {
      if (context?.previous) queryClient.setQueryData(queryKeys.notificationPages, context.previous)
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
  const readAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate() {
      const previous = queryClient.getQueryData(queryKeys.notificationPages)
      queryClient.setQueryData(queryKeys.notificationPages, (current) => current ? {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          unreadCount: 0,
          items: page.items.map((notification) => ({ ...notification, unread: false, readAt: notification.readAt || new Date().toISOString() })),
        })),
      } : current)
      return { previous }
    },
    onError(_error, _variables, context) {
      if (context?.previous) queryClient.setQueryData(queryKeys.notificationPages, context.previous)
    },
    onSettled() { queryClient.invalidateQueries({ queryKey: queryKeys.notifications }) },
  })

  function openNotification(notification) {
    if (notification.unread) readMutation.mutate(notification.id)
    const link = notificationLink(notification)
    if (link) navigate(link)
  }

  return (
    <UserPageShell title="Notifications" subtitle="Les événements importants de votre compte, classés du plus récent au plus ancien." actions={unreadCount ? <Button type="button" variant="secondary" size="sm" icon={CheckCheck} loading={readAllMutation.isPending} onClick={() => readAllMutation.mutate()}>Tout marquer comme lu</Button> : null}>
      <div className="space-y-4">
        {notificationsQuery.isLoading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-lg bg-slate-100" />) : null}
        {notificationsQuery.isError ? <Card className="p-8 text-center"><p className="font-bold text-fifow-red">Les notifications ne peuvent pas être chargées.</p><Button onClick={() => notificationsQuery.refetch()} className="mt-4">Réessayer</Button></Card> : null}
        {notifications.map((notification) => {
          const Icon = icons[notification.type] || Bell
          const link = notificationLink(notification)
          return (
            <Card as={link ? 'button' : 'article'} type={link ? 'button' : undefined} key={notification.id} onClick={link ? () => openNotification(notification) : undefined} className={`w-full p-5 text-left transition ${link ? 'hover:border-violet-200 hover:shadow-soft' : ''} ${notification.unread ? 'border-violet-200 bg-fifow-lavender/20' : ''}`}>
              <div className="flex gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary"><Icon className="h-7 w-7" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-fifow-dark">{notification.title}</h2>{notification.unread ? <Badge>Nouveau</Badge> : null}</div><p className="mt-1 font-semibold text-fifow-secondary">{notification.description}</p><p className="mt-2 text-sm font-bold text-fifow-muted">{notification.time}</p></div>{notification.unread && !link ? <button type="button" aria-label="Marquer comme lue" onClick={() => readMutation.mutate(notification.id)} className="grid h-10 w-10 place-items-center rounded-lg text-fifow-primary hover:bg-white"><CheckCheck className="h-5 w-5" /></button> : null}</div>
            </Card>
          )
        })}
        {!notificationsQuery.isLoading && !notificationsQuery.isError && !notifications.length ? <Card className="p-10 text-center"><Bell className="mx-auto h-11 w-11 text-fifow-muted" /><h2 className="mt-4 text-xl font-black text-fifow-dark">Aucune notification</h2><p className="mt-2 font-semibold text-fifow-secondary">Les nouvelles activités apparaîtront ici.</p></Card> : null}
        {notificationsQuery.hasNextPage ? <Button variant="secondary" loading={notificationsQuery.isFetchingNextPage} onClick={() => notificationsQuery.fetchNextPage()} className="mx-auto flex">Charger les précédentes</Button> : null}
      </div>
    </UserPageShell>
  )
}
