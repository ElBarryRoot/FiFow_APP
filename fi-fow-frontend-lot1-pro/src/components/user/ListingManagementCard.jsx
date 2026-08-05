import { Archive, Eye, Heart, MapPin, MessageCircle, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

const editableStatuses = new Set(['DRAFT', 'REJECTED'])

export default function ListingManagementCard({ listing, onArchive, archiving = false }) {
  const publicLink = `/products/${listing.slug || listing.id}`
  return (
    <Card className="group overflow-hidden p-4 transition duration-300 hover:shadow-soft">
      <div className="grid gap-4 sm:grid-cols-[190px_1fr] xl:grid-cols-[210px_1fr_auto]">
        <div className="relative overflow-hidden rounded-lg">
          <img src={listing.image} alt={listing.title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-full" />
          {listing.boosted ? <Badge icon={Zap} variant="warning" className="absolute left-3 top-3 bg-orange-100 text-fifow-orange">Boostée</Badge> : null}
          <span className="absolute bottom-3 left-3 rounded-md bg-black/75 px-3 py-1.5 text-xs font-black text-white backdrop-blur">{listing.time || 'Brouillon'}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={listing.status === 'AVAILABLE' ? 'success' : 'warning'}>{listing.statusLabel}</Badge>
            <Badge variant="neutral">{listing.condition}</Badge>
            {listing.moderationReason ? <span className="inline-flex items-center gap-1 text-sm font-black text-fifow-red"><Sparkles className="h-4 w-4" /> {listing.moderationReason}</span> : null}
          </div>
          <h2 className="mt-3 text-xl font-black text-fifow-dark sm:text-2xl">{listing.title}</h2>
          <p className="mt-1 text-xl font-black text-fifow-primary">{formatGNF(listing.price)}</p>
          <p className="mt-1 flex items-center gap-1 font-semibold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {listing.location}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric icon={Eye} label="Vues" value={listing.views} tone="text-fifow-primary bg-fifow-lavender" />
            <Metric icon={Heart} label="Favoris" value={listing.favorites} tone="text-fifow-red bg-red-50" />
            <Metric icon={MessageCircle} label="Messages" value={listing.messages} tone="text-fifow-green bg-emerald-50" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-40 xl:grid-cols-1 xl:self-center">
          {editableStatuses.has(listing.status) ? <Button as={Link} to={`/products/${listing.id}/edit`} variant="secondary">Modifier</Button> : <Button as={Link} to={publicLink} variant="secondary">Voir</Button>}
          {listing.status === 'AVAILABLE' && !listing.boosted ? <Button as={Link} to={`/boost/plans?productId=${encodeURIComponent(listing.id)}`} className="bg-fifow-orange hover:bg-orange-600">Booster</Button> : null}
          {onArchive ? <Button type="button" variant="ghost" icon={Archive} loading={archiving} onClick={() => onArchive(listing)}>Archiver</Button> : null}
        </div>
      </div>
    </Card>
  )
}

function Metric({ icon: Icon, label, value, tone }) {
  return <div className="rounded-lg bg-slate-50 p-3"><span className={`inline-grid h-8 w-8 place-items-center rounded-md ${tone}`}><Icon className="h-4 w-4" /></span><p className="mt-2 text-lg font-black text-fifow-dark">{value}</p><p className="text-xs font-bold text-fifow-muted">{label}</p></div>
}
