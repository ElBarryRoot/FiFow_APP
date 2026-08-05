import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage, isApiError } from '../../api/errors.js'
import { hasAdminRole } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function LoginForm() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    setFieldErrors({})
    try {
      const session = await auth.login({
        email: String(form.get('email')).trim().toLowerCase(),
        password: String(form.get('password')),
      })
      const requestedPath = location.state?.from
      const destination = requestedPath
        ? `${requestedPath.pathname}${requestedPath.search || ''}`
        : hasAdminRole(session.user) ? '/admin' : '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      if (isApiError(requestError)) setFieldErrors(requestError.fieldErrors())
      setError(errorMessage(requestError, 'Connexion impossible.'))
    } finally {
      setLoading(false)
    }
  }

  const PasswordIcon = showPassword ? EyeOff : Eye
  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Input icon={Mail} name="email" type="email" placeholder="Adresse email" autoComplete="email" required aria-invalid={Boolean(fieldErrors.email)} />
      {fieldErrors.email ? <FieldError message={fieldErrors.email} /> : null}
      <Input
        icon={Lock}
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Mot de passe"
        autoComplete="current-password"
        required
        aria-invalid={Boolean(fieldErrors.password)}
        right={(
          <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="grid h-9 w-9 place-items-center rounded-md text-fifow-muted hover:bg-slate-100 hover:text-fifow-dark">
            <PasswordIcon className="h-5 w-5" />
          </button>
        )}
      />
      {fieldErrors.password ? <FieldError message={fieldErrors.password} /> : null}
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm font-extrabold text-fifow-primary hover:underline">Mot de passe oublié ?</Link>
      </div>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-fifow-red">{error}</p> : null}
      <Button type="submit" icon={ShieldCheck} size="lg" className="w-full" loading={loading}>Se connecter</Button>
      <p className="pt-3 text-center text-sm font-medium text-fifow-secondary">
        Pas encore de compte ? <Link to="/register" className="font-extrabold text-fifow-primary hover:underline">S’inscrire</Link>
      </p>
    </form>
  )
}

function FieldError({ message }) {
  return <p className="-mt-2 text-sm font-bold text-fifow-red">{message}</p>
}
