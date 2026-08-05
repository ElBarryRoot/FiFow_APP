import { ChevronRight, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SellerPreviewCard({ seller }) {
  if (!seller) return null

  return (
    <Link to={`/seller/${seller.id}`} className="flex w-full items-center gap-3 rounded-lg border border-fifow-border bg-slate-50/70 p-3 text-left transition-colors hover:border-violet-200 hover:bg-fifow-lavender/40">
      <img src={seller.avatar || '/assets/avatar-default.svg'} alt="" className="h-12 w-12 rounded-full bg-white object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold text-fifow-dark">{seller.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
          {seller.verified ? <span className="inline-flex items-center gap-1 text-fifow-primary"><ShieldCheck className="h-3.5 w-3.5" /> Vérifié</span> : null}
          {seller.rating ? <span className="inline-flex items-center gap-1 text-fifow-secondary"><Star className="h-3.5 w-3.5 fill-fifow-yellow text-fifow-yellow" /> {seller.rating} ({seller.reviews ?? 0} avis)</span> : null}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-fifow-muted" />
    </Link>
  )
}
