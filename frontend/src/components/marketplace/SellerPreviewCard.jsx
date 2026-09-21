import { ChevronRight, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

function SellerMeta({ seller, compact = false }) {
  const verified = seller.verified || seller.verifiedSeller || seller.sellerVerificationStatus === 'APPROVED'
  const reviews = seller.reviews ?? seller.reviewCount ?? seller.totalReviews ?? 0
  return (
    <span className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold text-fifow-secondary ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {verified ? <span className="inline-flex items-center gap-1 text-fifow-primary"><ShieldCheck className="h-3.5 w-3.5" /> Vérifié</span> : null}
      {seller.rating != null && reviews > 0 ? <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(seller.rating).toFixed(1)} ({reviews} avis)</span> : null}
    </span>
  )
}

export default function SellerPreviewCard({ seller, featured = false }) {
  if (!seller) return null

  if (featured) {
    return (
      <>
        <Link
          to={`/seller/${seller.id}`}
          className="group flex w-full items-center gap-3 rounded-xl border border-violet-100 bg-white p-3 text-left shadow-sm transition hover:border-violet-300 hover:shadow-card lg:hidden"
        >
          <img src={seller.avatar || seller.avatarUrl || '/assets/avatar-default.svg'} alt="" className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black leading-5 text-fifow-dark">{seller.name}</span>
            <SellerMeta seller={seller} compact />
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-fifow-primary" />
        </Link>
        <Link
          to={`/seller/${seller.id}`}
          className="group hidden h-full w-full flex-col justify-between rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-5 text-left shadow-sm transition hover:border-violet-300 hover:shadow-card lg:flex"
        >
          <div className="flex items-start justify-between gap-3">
            <img src={seller.avatar || seller.avatarUrl || '/assets/avatar-default.svg'} alt="" className="h-16 w-16 rounded-2xl border-2 border-white object-cover shadow-sm" />
            <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-fifow-primary" />
          </div>
          <span className="mt-5 min-w-0">
            <span className="block truncate text-lg font-black leading-6 text-fifow-dark">{seller.name}</span>
            <SellerMeta seller={seller} />
          </span>
          <span className="mt-5 inline-flex w-fit rounded-lg border border-violet-100 bg-white px-3 py-2 text-xs font-extrabold text-fifow-primary">Voir le profil</span>
        </Link>
      </>
    )
  }

  return (
    <Link to={`/seller/${seller.id}`} className="group flex w-full items-center gap-3 rounded-lg border border-fifow-border bg-slate-50/70 p-3 text-left transition-colors hover:border-violet-200 hover:bg-fifow-lavender/40">
      <img src={seller.avatar || seller.avatarUrl || '/assets/avatar-default.svg'} alt="" className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-fifow-dark">{seller.name}</span>
        <SellerMeta seller={seller} compact />
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-fifow-primary" />
    </Link>
  )
}
