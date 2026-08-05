import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppHeader from '../layout/AppHeader.jsx'

export default function PublishHeader({ title = 'Publier une annonce', backTo = '/profile/listings' }) {
  return (
    <>
      <AppHeader connected showSearch={false} mobileSearch={false} showPublish={false} />
      <div className="border-b border-fifow-border bg-white">
        <div className="marketplace-container flex min-h-[88px] items-center justify-between gap-5 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to={backTo}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-fifow-border text-fifow-dark transition hover:border-violet-200 hover:bg-fifow-lavender"
              aria-label="Quitter la publication"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold text-fifow-dark sm:text-[28px]">{title}</h1>
              <p className="mt-0.5 hidden text-sm font-medium text-fifow-secondary sm:block">
                Créez une annonce claire pour vendre plus facilement.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-fifow-secondary sm:flex">
            <CheckCircle2 className="h-4 w-4 text-fifow-green" />
            Brouillon enregistré
          </div>
        </div>
      </div>
    </>
  )
}
