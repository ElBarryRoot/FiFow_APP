import { cn } from '../../lib/utils.js'

export default function Switch({ checked = false, onChange, label = 'Activer', className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-10 w-[4.6rem] shrink-0 items-center rounded-full p-1 transition-all focus:outline-none focus:ring-4 focus:ring-violet-100',
        checked ? 'bg-fifow-primary shadow-float' : 'bg-slate-200',
        className,
      )}
    >
      <span className={cn('h-8 w-8 rounded-full bg-white shadow-md transition-transform', checked ? 'translate-x-8' : 'translate-x-0')} />
    </button>
  )
}
