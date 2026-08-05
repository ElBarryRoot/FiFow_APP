import { Info, Image as ImageIcon } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const icons = { info: Info, image: ImageIcon }

export default function PublishTipsCard({ title, children, icon = 'info', className }) {
  const Icon = icons[icon] || Info
  return (
    <div className={cn('flex gap-4 rounded-[1.35rem] border border-violet-100 bg-fifow-lavender/70 p-4 text-fifow-dark', className)}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-fifow-primary shadow-card">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-fifow-secondary">{children}</p>
      </div>
    </div>
  )
}
