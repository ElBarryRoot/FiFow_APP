import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

function SessionLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-fifow-bg" role="status" aria-label="Restauration de la session">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-fifow-primary" />
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth.status === 'booting') return <SessionLoader />
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export function GuestRoute({ children }) {
  const auth = useAuth()
  if (auth.status === 'booting') return <SessionLoader />
  if (auth.isAuthenticated) return <Navigate to="/" replace />
  return children
}

