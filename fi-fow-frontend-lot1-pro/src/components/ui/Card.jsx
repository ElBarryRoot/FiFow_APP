import { forwardRef } from 'react'
import { cn } from '../../lib/utils.js'

const Card = forwardRef(function Card({ children, className, as: Component = 'div', ...props }, ref) {
  return <Component ref={ref} className={cn('rounded-lg border border-fifow-border bg-white shadow-card', className)} {...props}>{children}</Component>
})

export default Card
