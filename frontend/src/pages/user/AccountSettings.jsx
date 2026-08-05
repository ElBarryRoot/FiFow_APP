import { Bell, HelpCircle, LockKeyhole, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import SettingsRow from '../../components/user/SettingsRow.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

export default function AccountSettings() {
  return (
    <UserPageShell title="Paramètres compte" eyebrow="Sécurité et préférences" subtitle="Un compte bien renseigné protège vos ventes, vos achats et vos récupérations futures." tone="trust">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <HumanSectionHeader title="Réglages essentiels" description="Les informations sensibles doivent rester simples à vérifier et difficiles à usurper." />
          <SettingsRow icon={UserRound} title="Modifier mon profil" description="Nom, téléphone, email, commune et quartier." to="/profile/edit" />
          <SettingsRow icon={LockKeyhole} title="Mot de passe et sécurité" description="Changer le mot de passe ou récupérer le compte." to="/forgot-password" />
          <SettingsRow icon={Bell} title="Notifications" description="Messages, commandes, paiements et annonces." to="/notifications" />
          <SettingsRow icon={HelpCircle} title="Support / aide" description="Contacter l’équipe Fi Fow en cas de problème." to="/support" />
          <SettingsRow icon={LogOut} title="Déconnexion" description="Quitter ce compte sur cet appareil." to="/login" />
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
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
