import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppHeader from '../layout/AppHeader.jsx'
import BottomNav from '../layout/BottomNav.jsx'

export default function UserPageShell({
  title,
  subtitle,
  children,
  actions,
  eyebrow = 'Espace client',
  backTo,
  backLabel = 'Retour',
}) {
  return (
    <main className="min-h-screen bg-fifow-bg pb-28 lg:pb-12">
      <AppHeader connected mobileSearch={false} />

      <section className="marketplace-container py-5 lg:py-8">
        <div className="mb-6 border-b border-fifow-border pb-5">
          {backTo ? (
            <Link to={backTo} className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-fifow-secondary transition hover:text-fifow-primary">
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-fifow-primary">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-fifow-secondary sm:text-base">{subtitle}</p> : null}
            </div>
            {actions}
          </div>
        </div>
        {children}
      </section>
      <BottomNav connected />
    </main>
  )
}
