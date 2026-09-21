import { cn } from '../../lib/utils.js'

export default function PageFrame({ children, className }) {
  return (
    <main className="page-shell">
      <div className={cn('min-h-screen w-full bg-white lg:bg-fifow-bg', className)}>
        {children}
      </div>
    </main>
  )
}
