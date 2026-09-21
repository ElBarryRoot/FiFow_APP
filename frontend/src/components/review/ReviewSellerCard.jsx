import { ShieldCheck, Star, UserRound } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'

export default function ReviewSellerCard({ seller, label = 'Utilisateur évalué' }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <img src={seller.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
        <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase text-fifow-muted">{label}</p><h2 className="mt-1 truncate text-lg font-black text-fifow-dark">{seller.name}</h2>{seller.verified ? <Badge variant="success" icon={ShieldCheck} className="mt-2">Profil vérifié</Badge> : null}</div>
      </div>
      {seller.rating != null ? <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-bold text-fifow-secondary"><Star className="h-5 w-5 fill-fifow-orange text-fifow-orange" /><strong className="text-fifow-dark">{Number(seller.rating).toFixed(1)}/5</strong>{seller.totalReviews != null ? ` · ${seller.totalReviews} avis` : ''}</div> : <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-bold text-fifow-secondary"><UserRound className="h-5 w-5 text-fifow-primary" /> Transaction vérifiée par Fi Fow</div>}
    </Card>
  )
}
