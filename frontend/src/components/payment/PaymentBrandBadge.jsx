import { cn } from '../../lib/utils.js'

const styles = {
  MTN: 'bg-yellow-300 text-black',
  Orange: 'bg-orange-500 text-white',
  Moov: 'bg-emerald-600 text-white',
  Airtel: 'bg-red-600 text-white',
  VISA: 'bg-slate-100 text-blue-700',
  MC: 'bg-slate-100 text-red-500',
}

export default function PaymentBrandBadge({ brand, className }) {
  return (
    <span className={cn('inline-flex h-11 min-w-14 items-center justify-center rounded-xl px-3 text-[11px] font-black shadow-sm', styles[brand] ?? 'bg-slate-100 text-fifow-dark', className)}>
      {brand}
    </span>
  )
}
