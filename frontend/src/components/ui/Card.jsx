import { cn } from '../../lib/utils.js'

export default function Card({ children, className, as: Component = 'div', ...props }) {
  return <Component className={cn('rounded-lg border border-fifow-border bg-white shadow-card', className)} {...props}>{children}</Component>
}
