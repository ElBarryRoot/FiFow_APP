import { cn } from '../../lib/utils.js'

export default function IconButton({ icon: Icon, label, badge, active = false, className, as: Component = 'button', ...props }) {
  const nativeProps = Component === 'button' ? { type: 'button' } : {}

  return (
    <Component
      aria-label={label}
      className={cn(
        'relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-fifow-border bg-white text-fifow-dark transition-colors duration-200 hover:border-violet-200 hover:bg-fifow-lavender hover:text-fifow-primary active:scale-95',
        active && 'border-violet-200 bg-fifow-lavender text-fifow-primary',
        className,
      )}
      {...nativeProps}
      {...props}
    >
      <Icon className="h-5 w-5" />
      {badge ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-fifow-primary px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
          {badge}
        </span>
      ) : null}
    </Component>
  )
}
