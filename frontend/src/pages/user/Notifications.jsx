import { Bell, CreditCard, MessageCircle, Rocket, Star } from 'lucide-react'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { notifications } from '../../data/clientPortal.js'

const icons = { message: MessageCircle, payment: CreditCard, boost: Rocket, review: Star }

export default function Notifications() {
  return (
    <UserPageShell title="Notifications" subtitle="Les informations importantes sur vos annonces, paiements, messages et avis.">
      <div className="space-y-4">
        {notifications.map((notification) => {
          const Icon = icons[notification.type] ?? Bell
          return (
            <Card key={notification.id} className="p-5">
              <div className="flex gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-fifow-lavender text-fifow-primary"><Icon className="h-7 w-7" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-fifow-dark">{notification.title}</h2>
                    {notification.unread ? <Badge>Nouveau</Badge> : null}
                  </div>
                  <p className="mt-1 font-semibold text-fifow-secondary">{notification.description}</p>
                  <p className="mt-2 text-sm font-bold text-fifow-muted">{notification.time}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </UserPageShell>
  )
}
