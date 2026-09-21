import { cn } from '../../lib/utils.js'

export default function Input({ icon: Icon, right, className, inputClassName, ...props }) {
  return (
    <label className={cn('flex h-12 items-center gap-3 rounded-lg border border-fifow-border bg-white px-3.5 transition focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100', className)}>
      {Icon ? <Icon className="h-5 w-5 shrink-0 text-fifow-muted" /> : null}
      <input className={cn('w-full min-w-0 bg-transparent text-base text-fifow-dark placeholder:text-fifow-muted outline-none', inputClassName)} {...props} />
      {right}
    </label>
  )
}
