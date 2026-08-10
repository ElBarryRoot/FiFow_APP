import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const variants = {
  primary: 'bg-fifow-primary text-white shadow-[0_8px_18px_rgba(90,53,214,0.2)] hover:bg-fifow-primaryDark',
  secondary: 'bg-white text-fifow-primary border border-violet-200 hover:border-fifow-primary hover:bg-fifow-lavender',
  ghost: 'bg-transparent text-fifow-secondary hover:bg-slate-100',
  danger: 'bg-fifow-red text-white hover:bg-red-700',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-4 text-sm rounded-lg',
  lg: 'h-12 px-5 text-base rounded-lg',
}

export default function Button({ children, className, variant = 'primary', size = 'md', loading = false, icon: Icon, as: Component = 'button', disabled = false, ...props }) {
  const nativeButtonProps = Component === 'button' ? { disabled: loading || disabled } : {}

  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...nativeButtonProps}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : Icon ? <Icon className="h-5 w-5" /> : null}
      {children}
    </Component>
  )
}
