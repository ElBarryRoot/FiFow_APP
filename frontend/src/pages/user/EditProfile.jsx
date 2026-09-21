import { useRef, useState } from 'react'
import { Camera, Save, Trash2 } from 'lucide-react'
import { errorMessage, isApiError } from '../../api/errors.js'
import { toUserView } from '../../api/adapters.js'
import { usersApi } from '../../api/users.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { useToast } from '../../lib/toast.jsx'

export default function EditProfile() {
  const auth = useAuth()
  const user = toUserView(auth.user)
  const showToast = useToast()
  const fileInput = useRef(null)
  const [saving, setSaving] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function save(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      const updated = await usersApi.updateMe({
        fullName: String(form.get('fullName')).trim(),
        phone: String(form.get('phone')).trim() || null,
        commune: String(form.get('commune')).trim() || null,
        quartier: String(form.get('quartier')).trim() || null,
      })
      auth.setUser(updated)
      showToast('Profil mis à jour.')
    } catch (requestError) {
      if (isApiError(requestError)) setFieldErrors(requestError.fieldErrors())
      setError(errorMessage(requestError, 'Mise à jour impossible.'))
    } finally {
      setSaving(false)
    }
  }

  async function changeAvatar(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return showToast('La photo ne doit pas dépasser 5 Mo.', { type: 'error' })
    setAvatarLoading(true)
    try {
      const updated = await usersApi.updateAvatar(file)
      auth.setUser(updated)
      showToast('Photo de profil mise à jour.')
    } catch (requestError) {
      showToast(errorMessage(requestError, 'Photo impossible à envoyer.'), { type: 'error' })
    } finally {
      setAvatarLoading(false)
    }
  }

  async function deleteAvatar() {
    setAvatarLoading(true)
    try {
      await usersApi.deleteAvatar()
      await auth.refreshUser()
      showToast('Photo supprimée.', { type: 'info' })
    } catch (requestError) {
      showToast(errorMessage(requestError, 'Suppression impossible.'), { type: 'error' })
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <UserPageShell title="Modifier profil" subtitle="Gardez vos informations à jour pour sécuriser vos échanges." backTo="/profile" backLabel="Retour au profil">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-max p-5 text-center">
          <img src={user.avatar} alt={user.fullName} className="mx-auto h-32 w-32 rounded-full object-cover" />
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={changeAvatar} className="sr-only" />
          <Button type="button" variant="secondary" icon={Camera} loading={avatarLoading} onClick={() => fileInput.current?.click()} className="mt-5 w-full">Changer la photo</Button>
          {auth.user.avatarUrl ? <Button type="button" variant="ghost" icon={Trash2} disabled={avatarLoading} onClick={deleteAvatar} className="mt-2 w-full text-fifow-red">Supprimer</Button> : null}
        </Card>
        <Card as="form" onSubmit={save} className="space-y-5 p-5 sm:p-7">
          <div><Input name="fullName" defaultValue={auth.user.fullName} placeholder="Nom complet" required minLength={2} maxLength={80} />{fieldErrors.fullName ? <FieldError message={fieldErrors.fullName} /> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="phone" defaultValue={auth.user.phone || ''} placeholder="Téléphone" autoComplete="tel" />
            <Input value={auth.user.email} type="email" aria-label="Email" disabled className="bg-slate-50" />
          </div>
          <p className="-mt-3 text-xs font-semibold text-fifow-muted">L’adresse email est protégée et ne se modifie pas depuis ce formulaire.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="commune" defaultValue={auth.user.commune || ''} placeholder="Commune" />
            <Input name="quartier" defaultValue={auth.user.quartier || ''} placeholder="Quartier" />
          </div>
          {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-fifow-red">{error}</p> : null}
          <Button type="submit" icon={Save} loading={saving} className="w-full sm:w-auto">Enregistrer le profil</Button>
        </Card>
      </div>
    </UserPageShell>
  )
}

function FieldError({ message }) {
  return <p className="mt-1 text-sm font-bold text-fifow-red">{message}</p>
}

