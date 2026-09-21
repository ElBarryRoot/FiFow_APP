import { cn } from '../../lib/utils.js'

const variants = {
  primary: 'bg-fifow-lavender text-fifow-primary',
  boost: 'bg-fifow-primary text-white',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-slate-100 text-slate-600',
}

export default function Badge({ children, icon: Icon, variant = 'primary', className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold', variants[variant], className)}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  )
}
