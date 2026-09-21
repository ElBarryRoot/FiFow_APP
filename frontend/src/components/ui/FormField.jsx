import { cn } from '../../lib/utils.js'

export default function FormField({ label, counter, hint, error, children, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <label className="block text-base font-black text-fifow-dark">{label}</label>
          {hint ? <p className="mt-1 text-sm font-medium text-fifow-secondary">{hint}</p> : null}
        </div>
        {counter ? <span className="text-sm font-bold text-fifow-muted">{counter}</span> : null}
      </div>
      {children}
      {error ? <p className="text-sm font-bold text-fifow-red">{error}</p> : null}
    </div>
  )
}
