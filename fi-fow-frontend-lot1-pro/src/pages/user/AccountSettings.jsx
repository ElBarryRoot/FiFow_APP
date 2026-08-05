import { BadgeCheck, Bell, HelpCircle, LockKeyhole, LogOut, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors.js'
import { usersApi } from '../../api/users.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Card from '../../components/ui/Card.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import SettingsRow from '../../components/user/SettingsRow.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { useToast } from '../../lib/toast.jsx'

export default function AccountSettings() {
  const auth = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [pendingAction, setPendingAction] = useState(null)

  async function signOut(allDevices = false) {
    setPendingAction(allDevices ? 'logout-all' : 'logout')
    try {
      if (allDevices) await auth.logoutAll()
      else await auth.logout()
      navigate('/login', { replace: true })
    } catch (error) {
      showToast(errorMessage(error, 'Déconnexion impossible.'), { type: 'error' })
    } finally {
      setPendingAction(null)
    }
  }

  async function archiveAccount() {
    const confirmed = window.confirm('Archiver définitivement votre compte ? Vos annonces seront retirées et toutes vos sessions seront fermées.')
    if (!confirmed) return

    setPendingAction('archive')
    try {
      await usersApi.archiveMe()
      await auth.logout()
      showToast('Votre compte a été archivé.', { type: 'info' })
      navigate('/', { replace: true })
    } catch (error) {
      showToast(errorMessage(error, 'Archivage impossible.'), { type: 'error' })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <UserPageShell title="Paramètres compte" eyebrow="Sécurité et préférences" subtitle="Un compte bien renseigné protège vos ventes, vos achats et vos récupérations futures.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <HumanSectionHeader title="Réglages essentiels" description="Les informations sensibles doivent rester simples à vérifier et difficiles à usurper." />
          <SettingsRow icon={UserRound} title="Modifier mon profil" description="Nom, téléphone, email, commune et quartier." to="/profile/edit" />
          <SettingsRow icon={LockKeyhole} title="Mot de passe et sécurité" description="Changer votre mot de passe en confirmant le mot de passe actuel." to="/settings/password" />
          <SettingsRow icon={Bell} title="Notifications" description="Messages, offres et activité de vos annonces." to="/notifications" />
          <SettingsRow icon={BadgeCheck} title="Vérification vendeur" description="Transmettre des justificatifs et suivre la décision." to="/seller-verification" />
          <SettingsRow icon={HelpCircle} title="Support / aide" description="Contacter l’équipe Fi Fow en cas de problème." to="/support" />
          <SettingsRow icon={LogOut} title={pendingAction === 'logout' ? 'Déconnexion…' : 'Déconnexion'} description="Quitter ce compte sur cet appareil." onClick={() => signOut(false)} disabled={Boolean(pendingAction)} />
          <SettingsRow icon={ShieldCheck} title={pendingAction === 'logout-all' ? 'Fermeture des sessions…' : 'Déconnecter tous les appareils'} description="Révoquer immédiatement toutes les sessions actives de ce compte." onClick={() => signOut(true)} disabled={Boolean(pendingAction)} />
          <SettingsRow icon={Trash2} title={pendingAction === 'archive' ? 'Archivage en cours…' : 'Archiver mon compte'} description="Retirer le compte et toutes ses annonces de la marketplace." onClick={archiveAccount} disabled={Boolean(pendingAction)} danger />
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="h-max border-violet-100 bg-fifow-lavender/50 p-5">
            <ShieldCheck className="h-10 w-10 text-fifow-primary" />
            <h2 className="mt-4 text-xl font-black text-fifow-dark">Compte protégé</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Ne partagez jamais votre mot de passe. Fi Fow ne vous demandera jamais un code ou un mot de passe par message.</p>
          </Card>
          <HumanTrustPanel title="Récupération plus simple" items={['Email ajouté', 'Téléphone correct', 'Quartier renseigné', 'Photo de profil claire']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
