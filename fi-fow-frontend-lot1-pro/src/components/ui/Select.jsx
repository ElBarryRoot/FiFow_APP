import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function Select({ className, children, ...props }) {
  return (
    <label className={cn('relative flex h-14 items-center rounded-lg border border-fifow-border bg-white transition focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100', className)}>
      <select className="h-full w-full appearance-none rounded-lg bg-transparent px-4 pr-12 text-base font-bold text-fifow-dark outline-none" {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 h-5 w-5 text-fifow-secondary" />
    </label>
  )
}
