import { useState } from 'react'
import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth.js'
import { errorMessage, isApiError } from '../../api/errors.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'

export default function AccountRecovery() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const token = searchParams.get('token') || ''
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const passwordConfirmation = String(form.get('passwordConfirmation'))
    if (password !== passwordConfirmation) {
      setFieldErrors({ passwordConfirmation: 'Les deux mots de passe doivent être identiques.' })
      return
    }
    setLoading(true)
    setError('')
    setFieldErrors({})
    try {
      await authApi.resetPassword({ token, password, passwordConfirmation })
      await auth.logout()
      setSuccess(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 1800)
    } catch (requestError) {
      if (isApiError(requestError)) setFieldErrors(requestError.fieldErrors())
      setError(errorMessage(requestError, 'Le mot de passe ne peut pas être modifié.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un mot de passe unique pour sécuriser votre compte.">
      {!token ? (
        <Card className="p-5 text-center">
          <LockKeyhole className="mx-auto h-10 w-10 text-fifow-red" />
          <p className="mt-3 font-bold text-fifow-dark">Ce lien de récupération est incomplet.</p>
          <Button as={Link} to="/forgot-password" className="mt-5 w-full">Demander un nouveau lien</Button>
        </Card>
      ) : success ? (
        <Card className="border-emerald-100 bg-emerald-50 p-5 text-center">
          <CheckCircle2 className="mx-auto h-11 w-11 text-fifow-green" />
          <h2 className="mt-3 text-xl font-black text-fifow-dark">Mot de passe modifié</h2>
          <p className="mt-2 font-semibold text-fifow-secondary">Vous allez être redirigé vers la connexion.</p>
        </Card>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input icon={LockKeyhole} name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} placeholder="Nouveau mot de passe" required />
          {fieldErrors.password ? <FieldError message={fieldErrors.password} /> : null}
          <Input icon={ShieldCheck} name="passwordConfirmation" type="password" autoComplete="new-password" minLength={10} maxLength={72} placeholder="Confirmer le mot de passe" required />
          {fieldErrors.passwordConfirmation ? <FieldError message={fieldErrors.passwordConfirmation} /> : null}
          {error ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-fifow-red">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>Modifier le mot de passe</Button>
        </form>
      )}
    </AuthLayout>
  )
}

function FieldError({ message }) {
  return <p className="-mt-2 text-sm font-bold text-fifow-red">{message}</p>
}
