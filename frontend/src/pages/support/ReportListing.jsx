import { Flag, ShieldAlert } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'

export default function ReportListing() {
  return (
    <UserPageShell title="Signaler annonce" eyebrow="Sécurité marketplace" subtitle="Aidez Fi Fow à garder une marketplace fiable sans exposer votre identité au vendeur." backTo="/products" backLabel="Retour aux annonces">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="space-y-5 p-5 sm:p-7">
          <HumanSectionHeader title="Pourquoi cette annonce pose problème ?" description="Soyez factuel : prix incohérent, demande d’avance, produit interdit ou comportement suspect." />
          <Select defaultValue="Produit suspect">
            <option>Produit suspect</option>
            <option>Prix trompeur</option>
            <option>Fausse annonce</option>
            <option>Contenu interdit</option>
            <option>Vendeur abusif</option>
          </Select>
          <Textarea placeholder="Expliquez pourquoi vous signalez cette annonce..." />
          <Button variant="danger" icon={Flag}>Envoyer le signalement</Button>
        </Card>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <Card className="h-max border-red-100 bg-red-50 p-5">
          <ShieldAlert className="h-10 w-10 text-fifow-red" />
          <h2 className="mt-4 text-xl font-black text-fifow-dark">Signalement confidentiel</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Le vendeur ne verra pas votre identité. L’équipe vérifie le contenu avant toute action.</p>
        </Card>
          <HumanTrustPanel title="Signaux suspects" items={['Prix trop bas sans explication', 'Demande de paiement hors Fi Fow', 'Photos floues ou copiées', 'Refus de répondre aux questions simples']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
