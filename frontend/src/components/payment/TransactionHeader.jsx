import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../layout/AppHeader.jsx'

export default function TransactionHeader({ title, secure = true, backTo }) {
  const navigate = useNavigate()

  const backButton = backTo ? (
    <Link to={backTo} className="grid h-10 w-10 place-items-center rounded-lg border border-fifow-border bg-white text-fifow-dark transition hover:bg-slate-50" aria-label="Retour">
      <ArrowLeft className="h-5 w-5" />
    </Link>
  ) : (
    <button type="button" onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-lg border border-fifow-border bg-white text-fifow-dark transition hover:bg-slate-50" aria-label="Retour">
      <ArrowLeft className="h-5 w-5" />
    </button>
  )

  return (
    <>
      <AppHeader connected mobileSearch={false} />
      <div className="border-b border-fifow-border bg-white">
        <div className="marketplace-container flex min-h-[66px] items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-lg font-black text-fifow-dark sm:text-xl">{title}</h1>
            {secure ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-fifow-secondary">
                <ShieldCheck className="h-3.5 w-3.5 text-fifow-green" /> Paiement sécurisé
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
