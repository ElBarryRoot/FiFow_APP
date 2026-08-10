import { MessageCircle, Music2, Phone } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export function FacebookIcon({ className }) {
  return <span aria-hidden="true" className={cn('font-sans text-[1.45rem] font-black leading-none', className)}>f</span>
}

export function WhatsAppIcon({ className }) {
  return (
    <span aria-hidden="true" className={cn('relative grid h-6 w-6 place-items-center', className)}>
      <MessageCircle className="h-6 w-6 fill-current" strokeWidth={1.8} />
      <Phone className="absolute h-3 w-3 text-[#25d366]" strokeWidth={3} />
    </span>
  )
}

export function TikTokIcon({ className }) {
  return <Music2 aria-hidden="true" className={cn('h-5 w-5', className)} strokeWidth={2.8} />
}
