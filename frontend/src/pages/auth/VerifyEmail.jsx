import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, MailCheck, RefreshCw, XCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth.js'
import { errorMessage } from '../../api/errors.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'

const verificationRequests = new Map()

function verifyEmailOnce(token) {
  if (!verificationRequests.has(token)) verificationRequests.set(token, authApi.verifyEmail(token))
  return verificationRequests.get(token)
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const auth = useAuth()
  const authRef = useRef(auth)
  authRef.current = auth
  const [state, setState] = useState({ status: token ? 'loading' : 'error', message: token ? '' : 'Le lien de vérification est incomplet.' })

  useEffect(() => {
    if (!token) return
    let active = true
    verifyEmailOnce(token)
      .then(async (response) => {
        if (authRef.current.isAuthenticated) await authRef.current.refreshUser()
        if (active) setState({ status: 'success', message: response.message })
      })
      .catch((error) => {
        if (active) setState({ status: 'error', message: errorMessage(error, 'Ce lien ne peut pas être vérifié.') })
      })
    return () => { active = false }
  }, [token])

  const Icon = state.status === 'success' ? CheckCircle2 : state.status === 'error' ? XCircle : RefreshCw
  return (
    <AuthLayout title="Vérification de l’email" subtitle="Cette étape protège votre identité et vos futures annonces.">
      <Card className="p-6 text-center">
        <Icon className={`mx-auto h-12 w-12 ${state.status === 'loading' ? 'animate-spin text-fifow-primary' : state.status === 'success' ? 'text-fifow-green' : 'text-fifow-red'}`} />
        <h2 className="mt-4 text-xl font-black text-fifow-dark">
          {state.status === 'loading' ? 'Vérification en cours…' : state.status === 'success' ? 'Email vérifié' : 'Vérification impossible'}
        </h2>
        {state.message ? <p className="mt-2 font-semibold text-fifow-secondary">{state.message}</p> : null}
        {state.status !== 'loading' ? (
          <Button as={Link} to={auth.isAuthenticated ? '/' : '/login'} icon={state.status === 'success' ? MailCheck : undefined} className="mt-6 w-full">
            {auth.isAuthenticated ? 'Revenir à Fi Fow' : 'Se connecter'}
          </Button>
        ) : null}
      </Card>
    </AuthLayout>
  )
}
