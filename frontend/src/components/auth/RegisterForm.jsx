import { useState } from 'react'
import { Eye, EyeOff, Home, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('passwordConfirmation')) {
      setError('Les deux mots de passe doivent être identiques.')
      return
    }
    setError('')
    setLoading(true)
    window.setTimeout(() => navigate('/connected'), 500)
  }

  const PasswordIcon = showPassword ? EyeOff : Eye

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Input icon={UserRound} name="name" placeholder="Nom complet" autoComplete="name" required />
      <Input icon={Phone} name="phone" placeholder="Téléphone" autoComplete="tel" required />
      <Input icon={Mail} name="email" type="email" placeholder="Email facultatif" autoComplete="email" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input icon={MapPin} name="commune" placeholder="Commune" required />
        <Input icon={Home} name="neighborhood" placeholder="Quartier" required />
      </div>
      <Input
        icon={Lock}
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Mot de passe"
        autoComplete="new-password"
        minLength={6}
        required
        right={(
          <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="grid h-9 w-9 place-items-center rounded-md text-fifow-muted hover:bg-slate-100 hover:text-fifow-dark">
            <PasswordIcon className="h-5 w-5" />
          </button>
        )}
      />
      <Input icon={Lock} name="passwordConfirmation" type={showPassword ? 'text' : 'password'} placeholder="Confirmer le mot de passe" autoComplete="new-password" minLength={6} required />
      {error ? <p className="text-sm font-bold text-fifow-red">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" loading={loading}>Créer mon compte</Button>
      <p className="pt-3 text-center text-sm font-medium text-fifow-secondary">
        Déjà inscrit ? <Link to="/login" className="font-extrabold text-fifow-primary hover:underline">Se connecter</Link>
      </p>
    </form>
  )
}
