import { useState } from 'react'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/auth.js'
import { errorMessage } from '../../api/errors.js'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get('email')
    setLoading(true)
    setError('')
    try {
      const response = await authApi.forgotPassword(String(email).trim().toLowerCase())
      setMessage(response.message)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Le lien ne peut pas être envoyé.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Saisissez l’adresse email associée à votre compte.">
      {message ? (
        <Card className="border-emerald-100 bg-emerald-50 p-5">
          <Mail className="h-8 w-8 text-fifow-green" />
          <h2 className="mt-3 text-lg font-black text-fifow-dark">Consultez votre messagerie</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">{message}</p>
        </Card>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <Input name="email" type="email" autoComplete="email" placeholder="Adresse email" required />
          {error ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-fifow-red">{error}</p> : null}
          <Button type="submit" className="w-full" icon={Mail} loading={loading}>Envoyer le lien de récupération</Button>
          <Card className="border-violet-100 bg-fifow-lavender/60 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-fifow-primary" />
              <p className="text-sm font-semibold leading-6 text-fifow-secondary">Pour votre sécurité, la réponse reste identique même lorsqu’aucun compte ne correspond à cet email.</p>
            </div>
          </Card>
        </form>
      )}
      <Link to="/login" className="mt-6 flex items-center justify-center gap-2 font-black text-fifow-primary"><ArrowLeft className="h-4 w-4" /> Retour à la connexion</Link>
    </AuthLayout>
  )
}

