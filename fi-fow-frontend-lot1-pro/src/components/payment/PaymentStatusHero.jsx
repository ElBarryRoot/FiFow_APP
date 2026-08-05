import { Check, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function PaymentStatusHero({ status = 'processing', title, description }) {
  const success = status === 'success'

  return (
    <section className="text-center">
      <div className={cn('relative mx-auto grid h-44 w-44 place-items-center rounded-full', success ? 'bg-emerald-50' : 'bg-fifow-lavender')}>
        <div className={cn('absolute inset-5 rounded-full border-[7px]', success ? 'border-emerald-200' : 'border-violet-200')} />
        <div className={cn('absolute inset-5 rounded-full border-[7px] border-l-transparent border-b-transparent', success ? 'border-emerald-500' : 'animate-spin border-fifow-primary')} />
        <div className={cn('relative z-10 grid h-24 w-24 place-items-center rounded-full text-white shadow-float', success ? 'bg-fifow-green' : 'bg-fifow-primary')}>
          {success ? <Check className="h-14 w-14" /> : <ShieldCheck className="h-14 w-14" />}
        </div>
        {!success ? <Clock className="absolute -right-2 bottom-8 h-12 w-12 rounded-full bg-amber-400 p-3 text-white shadow-card" /> : null}
      </div>
      <h2 className="mx-auto mt-8 max-w-2xl text-3xl font-black tracking-[-0.05em] text-fifow-dark sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-fifow-secondary sm:text-lg">{description}</p>
    </section>
  )
}
