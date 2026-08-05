import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function LoginForm() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function submit(event) {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setLoading(true)
    window.setTimeout(() => navigate('/connected'), 450)
  }

  const PasswordIcon = showPassword ? EyeOff : Eye

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Input icon={Mail} name="identifier" placeholder="Téléphone ou email" autoComplete="username" required />
      <Input
        icon={Lock}
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Mot de passe"
        autoComplete="current-password"
        required
        right={(
          <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="grid h-9 w-9 place-items-center rounded-md text-fifow-muted hover:bg-slate-100 hover:text-fifow-dark">
            <PasswordIcon className="h-5 w-5" />
          </button>
        )}
      />
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm font-extrabold text-fifow-primary hover:underline">Mot de passe oublié ?</Link>
      </div>
      <Button type="submit" icon={ShieldCheck} size="lg" className="w-full" loading={loading}>Se connecter</Button>
      <p className="pt-3 text-center text-sm font-medium text-fifow-secondary">
        Pas encore de compte ? <Link to="/register" className="font-extrabold text-fifow-primary hover:underline">S’inscrire</Link>
      </p>
    </form>
  )
}
