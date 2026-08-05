import { Eye, Heart, MapPin, MessageCircle, MoreVertical, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function ListingManagementCard({ listing }) {
  return (
    <Card className="group overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="grid gap-4 sm:grid-cols-[190px_1fr] xl:grid-cols-[210px_1fr_auto]">
        <div className="relative">
          <img src={listing.image} alt={listing.title} className="h-52 w-full rounded-3xl object-cover transition duration-500 group-hover:scale-[1.03] sm:h-full" />
          {listing.boosted ? <Badge icon={Zap} variant="warning" className="absolute left-3 top-3 bg-orange-100 text-fifow-orange">Boostée</Badge> : null}
          <span className="absolute bottom-3 left-3 rounded-2xl bg-black/75 px-3 py-1.5 text-xs font-black text-white backdrop-blur">{listing.publishedAt}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={listing.status === 'En ligne' ? 'success' : 'warning'}>{listing.status}</Badge>
            <Badge variant="neutral">{listing.condition}</Badge>
            <span className="inline-flex items-center gap-1 text-sm font-black text-fifow-orange"><Sparkles className="h-4 w-4" /> {listing.buyerSignal}</span>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-fifow-dark">{listing.title}</h2>
          <p className="mt-1 text-xl font-black text-fifow-primary">{formatGNF(listing.price)}</p>
          <p className="mt-1 flex items-center gap-1 font-semibold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {listing.location}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric icon={Eye} label="Vues" value={listing.views} tone="text-fifow-primary bg-fifow-lavender" />
            <Metric icon={Heart} label="Favoris" value={listing.favorites} tone="text-fifow-red bg-red-50" />
            <Metric icon={MessageCircle} label="Messages" value={listing.messages} tone="text-fifow-green bg-emerald-50" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-40 xl:grid-cols-1 xl:self-center">
          <Button as={Link} to={`/products/${listing.id}/edit`} variant="secondary">Modifier</Button>
          <Button as={Link} to={`/products/${listing.id}/boost/checkout`} className="bg-fifow-orange hover:bg-orange-600">Booster</Button>
          <button className="grid h-11 place-items-center rounded-2xl text-fifow-secondary hover:bg-slate-100"><MoreVertical className="h-5 w-5" /></button>
        </div>
      </div>
    </Card>
  )
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <span className={`inline-grid h-8 w-8 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
      <p className="mt-2 text-lg font-black text-fifow-dark">{value}</p>
      <p className="text-xs font-bold text-fifow-muted">{label}</p>
    </div>
  )
}
