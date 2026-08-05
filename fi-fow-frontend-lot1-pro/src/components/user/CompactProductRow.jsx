import { Heart, MapPin, MessageCircle, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { useFavorites } from '../../lib/favorites.jsx'
import { useToast } from '../../lib/toast.jsx'

export default function CompactProductRow({ item }) {
  const { toggle } = useFavorites()
  const showToast = useToast()

  function handleUnfavorite(event) {
    event.preventDefault()
    event.stopPropagation()
    toggle(item.id)
    showToast('Retiré de vos favoris', { type: 'info' })
  }

  return (
    <Card as={Link} to={`/products/${item.slug || item.id}`} className="group block overflow-hidden p-4 transition duration-300 hover:shadow-soft">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <img src={item.image} alt={item.title} className="h-32 w-28 rounded-lg object-cover transition duration-500 group-hover:scale-[1.03] sm:h-36 sm:w-40" />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[11px] font-black text-white">{item.condition}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="line-clamp-2 text-lg font-black text-fifow-dark">{item.title}</h2><p className="mt-1 text-xl font-black text-fifow-primary">{formatGNF(item.price)}</p></div>
            <button type="button" onClick={handleUnfavorite} aria-label="Retirer des favoris" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-fifow-red transition hover:scale-105 active:scale-90"><Heart className="h-5 w-5 fill-current" /></button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-fifow-secondary"><MapPin className="h-4 w-4" /> {item.location}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.seller ? <Badge variant="neutral" icon={ShieldCheck}>{item.seller.name}</Badge> : null}
            {item.negotiable ? <Badge>Négociable</Badge> : null}
            <Badge variant="success" icon={MessageCircle}>Discussion sécurisée</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
