import { cn } from '../../lib/utils.js'

export default function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'min-h-40 w-full resize-none rounded-lg border border-fifow-border bg-white px-4 py-4 text-base leading-7 text-fifow-dark outline-none transition placeholder:text-fifow-muted focus:border-fifow-primary focus:ring-4 focus:ring-violet-100',
        className,
      )}
      {...props}
    />
  )
}
