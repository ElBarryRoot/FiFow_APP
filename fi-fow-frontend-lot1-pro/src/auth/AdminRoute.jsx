import { ShieldX } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { canAdmin, hasAdminRole } from './adminAccess.js'
import Button from '../components/ui/Button.jsx'
import Logo from '../components/ui/Logo.jsx'

export default function AdminRoute({ children, capability }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'booting') {
    return (
      <div className="grid min-h-screen place-items-center bg-fifow-bg" role="status" aria-label="Vérification des autorisations">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-fifow-primary" />
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasAdminRole(auth.user) || (capability && !canAdmin(auth.user, capability))) {
    return (
      <main className="grid min-h-screen place-items-center bg-fifow-bg px-4">
        <section className="w-full max-w-md rounded-lg border border-fifow-border bg-white p-7 text-center shadow-card">
          <Logo className="mx-auto" />
          <span className="mx-auto mt-7 grid h-14 w-14 place-items-center rounded-lg bg-red-50 text-fifow-red">
            <ShieldX className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-black text-fifow-dark">Accès réservé</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">
            Ce compte ne possède pas les autorisations nécessaires pour ouvrir l’administration FiFow.
          </p>
          <Button as={Link} to="/" className="mt-6 w-full">Retour à la marketplace</Button>
        </section>
      </main>
    )
  }

  return children
}
