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

      <section className="marketplace-container py-5 lg:py-7">
        <div className="mb-5 border-b border-fifow-border pb-4">
          {backTo ? (
            <Link to={backTo} className="mb-4 inline-flex h-8 items-center gap-2 rounded-md px-1 text-sm font-extrabold text-fifow-secondary transition hover:bg-fifow-lavender hover:text-fifow-primary">
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="page-eyebrow">{eyebrow}</p>
              <h1 className="page-title mt-1">{title}</h1>
              {subtitle ? <p className="page-description mt-2">{subtitle}</p> : null}
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
