import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminPage({ title, description, eyebrow, actions, backTo, children }) {
  return (
    <section>
      <header className="mb-5 border-b border-fifow-border pb-5">
        {backTo ? (
          <Link to={backTo} className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-fifow-secondary hover:text-fifow-primary">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? <p className="text-xs font-black uppercase text-fifow-primary">{eyebrow}</p> : null}
            <h2 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">{title}</h2>
            {description ? <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-fifow-secondary">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

