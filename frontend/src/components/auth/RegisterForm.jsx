import { useState } from 'react'
import { Eye, EyeOff, Home, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, isApiError } from '../../api/errors.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function RegisterForm() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const passwordConfirmation = String(form.get('passwordConfirmation'))
    const localErrors = {}
    if (password !== passwordConfirmation) localErrors.passwordConfirmation = 'Les deux mots de passe doivent être identiques.'
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      localErrors.password = 'Utilisez au moins une minuscule, une majuscule et un chiffre.'
    }
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors)
      return
    }

    const optional = (name) => String(form.get(name) || '').trim() || undefined
    setLoading(true)
    setError('')
    setFieldErrors({})
    try {
      await auth.register({
        fullName: String(form.get('fullName')).trim(),
        email: String(form.get('email')).trim().toLowerCase(),
        password,
        passwordConfirmation,
        phone: optional('phone'),
        commune: optional('commune'),
        quartier: optional('quartier'),
        acceptedTerms: form.get('acceptedTerms') === 'on',
      })
      navigate('/', { replace: true })
    } catch (requestError) {
      if (isApiError(requestError)) setFieldErrors(requestError.fieldErrors())
      setError(errorMessage(requestError, 'Création du compte impossible.'))
    } finally {
      setLoading(false)
    }
  }

  const PasswordIcon = showPassword ? EyeOff : Eye
  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Input icon={UserRound} name="fullName" placeholder="Nom complet" autoComplete="name" minLength={2} maxLength={80} required aria-invalid={Boolean(fieldErrors.fullName)} />
      <FieldError message={fieldErrors.fullName} />
      <Input icon={Mail} name="email" type="email" placeholder="Adresse email" autoComplete="email" required aria-invalid={Boolean(fieldErrors.email)} />
      <FieldError message={fieldErrors.email} />
      <Input icon={Phone} name="phone" placeholder="Téléphone (facultatif)" autoComplete="tel" aria-invalid={Boolean(fieldErrors.phone)} />
      <FieldError message={fieldErrors.phone} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input icon={MapPin} name="commune" placeholder="Commune (facultatif)" />
        <Input icon={Home} name="quartier" placeholder="Quartier (facultatif)" />
      </div>
      <Input
        icon={Lock}
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Mot de passe (10 caractères minimum)"
        autoComplete="new-password"
        minLength={10}
        maxLength={72}
        required
        aria-invalid={Boolean(fieldErrors.password)}
        right={(
          <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="grid h-9 w-9 place-items-center rounded-md text-fifow-muted hover:bg-slate-100 hover:text-fifow-dark">
            <PasswordIcon className="h-5 w-5" />
          </button>
        )}
      />
      <FieldError message={fieldErrors.password} />
      <Input icon={Lock} name="passwordConfirmation" type={showPassword ? 'text' : 'password'} placeholder="Confirmer le mot de passe" autoComplete="new-password" minLength={10} maxLength={72} required aria-invalid={Boolean(fieldErrors.passwordConfirmation)} />
      <FieldError message={fieldErrors.passwordConfirmation} />
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-fifow-border p-4 text-sm font-semibold leading-6 text-fifow-secondary">
        <input name="acceptedTerms" type="checkbox" required className="mt-1 h-4 w-4 accent-fifow-primary" />
        <span>J’accepte les conditions d’utilisation et la politique de confidentialité de Fi Fow.</span>
      </label>
      <FieldError message={fieldErrors.acceptedTerms} />
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-fifow-red">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" loading={loading}>Créer mon compte</Button>
      <p className="pt-3 text-center text-sm font-medium text-fifow-secondary">
        Déjà inscrit ? <Link to="/login" className="font-extrabold text-fifow-primary hover:underline">Se connecter</Link>
      </p>
    </form>
  )
}

function FieldError({ message }) {
  return message ? <p className="-mt-2 text-sm font-bold text-fifow-red">{message}</p> : null
}

