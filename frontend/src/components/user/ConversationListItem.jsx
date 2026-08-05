import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function ConversationListItem({ conversation }) {
  return (
    <Card as={Link} to={`/messages/${conversation.id}`} className="group block p-4 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <img src={conversation.avatar} alt={conversation.seller} className="h-14 w-14 rounded-full object-cover" />
          {conversation.online ? <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-fifow-green" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <h2 className="truncate font-black text-fifow-dark">{conversation.seller}</h2>
            <span className="text-xs font-bold text-fifow-muted">{conversation.time}</span>
          </div>
          <p className="mt-1 text-sm font-bold text-fifow-primary">{conversation.product} • {formatGNF(conversation.price)}</p>
          <p className="mt-1 truncate text-sm font-semibold text-fifow-secondary">{conversation.lastMessage}</p>
          <p className="mt-1 text-xs font-bold text-fifow-muted">{conversation.location}</p>
        </div>
        <img src={conversation.image} alt={conversation.product} className="h-14 w-14 rounded-2xl object-cover transition group-hover:scale-105" />
        {conversation.unread ? <span className="grid h-7 w-7 place-items-center rounded-full bg-fifow-primary text-xs font-black text-white">{conversation.unread}</span> : null}
      </div>
    </Card>
  )
}
