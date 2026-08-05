import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { cn } from '../../lib/utils.js'

export default function ConversationListItem({ conversation, active = false, compact = false }) {
  return (
    <Card as={Link} to={`/messages/${conversation.id}`} className={cn('group block p-4 transition hover:border-violet-200 hover:shadow-soft', active && 'border-fifow-primary bg-fifow-lavender/40', compact && 'shadow-none')}>
      <div className="flex gap-3">
        <img src={conversation.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3"><h2 className="truncate font-black text-fifow-dark">{conversation.seller}</h2><span className="shrink-0 text-xs font-bold text-fifow-muted">{conversation.time}</span></div>
          <p className="mt-1 truncate text-sm font-bold text-fifow-primary">{conversation.productTitle} • {formatGNF(conversation.price)}</p>
          <p className={cn('mt-1 truncate text-sm text-fifow-secondary', conversation.unread ? 'font-black' : 'font-semibold')}>{conversation.lastMessage}</p>
        </div>
        {conversation.unread ? <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fifow-primary text-xs font-black text-white">{conversation.unread}</span> : null}
      </div>
    </Card>
  )
}

