import { MapPin, PackageCheck, ShieldCheck, Star } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'

export default function ReviewSellerCard({ seller }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <img src={seller.avatar} alt={seller.name} className="h-20 w-20 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-fifow-dark">{seller.name} <ShieldCheck className="inline h-5 w-5 text-fifow-primary" /></h2>
            <Badge variant="success" icon={ShieldCheck}>Vendeur</Badge>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {seller.location}</p>
          <p className="mt-1 text-sm font-semibold text-fifow-secondary">Membre depuis {seller.memberSince}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-fifow-border pt-5">
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-4">
          <Star className="h-8 w-8 text-fifow-orange" />
          <div><p className="text-lg font-black text-fifow-dark">{seller.rating}/5</p><p className="text-xs font-bold text-fifow-secondary">Note moyenne</p></div>
        </div>
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-4">
          <PackageCheck className="h-8 w-8 text-fifow-primary" />
          <div><p className="text-lg font-black text-fifow-dark">{seller.sales}</p><p className="text-xs font-bold text-fifow-secondary">Ventes réalisées</p></div>
        </div>
      </div>
    </Card>
  )
}
