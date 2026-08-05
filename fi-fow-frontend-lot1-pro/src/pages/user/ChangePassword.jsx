import { useState } from 'react'
import { CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { errorMessage, isApiError } from '../../api/errors.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

function validatePassword(password) {
  if (password.length < 10 || password.length > 72) return 'Utilisez entre 10 et 72 caractères.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Ajoutez au moins une minuscule, une majuscule et un chiffre.'
  }
  return ''
}

export default function ChangePassword() {
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') || '')
    const password = String(data.get('password') || '')
    const passwordConfirmation = String(data.get('passwordConfirmation') || '')
    const passwordError = validatePassword(password)
    const localErrors = {
      ...(currentPassword ? {} : { currentPassword: 'Saisissez votre mot de passe actuel.' }),
      ...(passwordError ? { password: passwordError } : {}),
      ...(password === passwordConfirmation ? {} : { passwordConfirmation: 'Les deux nouveaux mots de passe doivent être identiques.' }),
      ...(currentPassword && currentPassword === password ? { password: 'Choisissez un mot de passe différent du mot de passe actuel.' } : {}),
    }
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors)
      setSuccess('')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFieldErrors({})
    try {
      const result = await auth.changePassword({ currentPassword, password, passwordConfirmation })
      form.reset()
      setSuccess(`${result.revokedSessionCount || 0} autre${result.revokedSessionCount > 1 ? 's' : ''} session${result.revokedSessionCount > 1 ? 's' : ''} déconnectée${result.revokedSessionCount > 1 ? 's' : ''}.`)
    } catch (requestError) {
      if (isApiError(requestError)) setFieldErrors(requestError.fieldErrors())
      setError(errorMessage(requestError, 'Le mot de passe ne peut pas être modifié.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserPageShell title="Changer le mot de passe" eyebrow="Sécurité du compte" subtitle="Confirmez votre identité avant de remplacer le mot de passe." backTo="/settings" backLabel="Retour aux paramètres">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,720px)_360px]">
        <Card as="form" onSubmit={submit} className="space-y-5 p-5 sm:p-7" noValidate>
          <PasswordField icon={KeyRound} name="currentPassword" label="Mot de passe actuel" autoComplete="current-password" error={fieldErrors.currentPassword} />
          <div className="border-t border-fifow-border pt-5">
            <PasswordField icon={LockKeyhole} name="password" label="Nouveau mot de passe" autoComplete="new-password" error={fieldErrors.password} />
          </div>
          <PasswordField icon={ShieldCheck} name="passwordConfirmation" label="Confirmer le nouveau mot de passe" autoComplete="new-password" error={fieldErrors.passwordConfirmation} />
          <p className="text-sm font-semibold leading-6 text-fifow-secondary">10 à 72 caractères, avec au moins une minuscule, une majuscule et un chiffre.</p>
          {error ? <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p> : null}
          {success ? <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Mot de passe modifié. {success}</p> : null}
          <Button type="submit" loading={loading}>Mettre à jour le mot de passe</Button>
        </Card>
        <aside className="lg:sticky lg:top-24"><HumanTrustPanel title="Protection appliquée" text="Votre session actuelle reste ouverte avec de nouveaux jetons." items={['Autres appareils déconnectés', 'Liens de récupération invalidés', 'Nouveau jeton de session', 'Action inscrite au journal de sécurité']} /></aside>
      </div>
    </UserPageShell>
  )
}

function PasswordField({ icon, name, label, autoComplete, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-fifow-dark">{label}</span>
      <Input icon={icon} name={name} type="password" minLength={10} maxLength={72} autoComplete={autoComplete} required aria-invalid={Boolean(error)} />
      {error ? <span className="mt-1 block text-sm font-bold text-fifow-red">{error}</span> : null}
    </label>
  )
}
