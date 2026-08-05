import { ShieldCheck } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Textarea from '../../components/ui/Textarea.jsx'

export default function AccountRecovery() {
  return (
    <AuthLayout title="Récupération compte" subtitle="Aucune récupération automatique si l’identité n’est pas vérifiable.">
      <div className="space-y-4">
        <Card className="border-violet-100 bg-fifow-lavender/60 p-4">
          <p className="text-sm font-semibold leading-6 text-fifow-secondary">
            Donnez plusieurs preuves fortes : dernier produit publié, prix approximatif, quartier, dernière activité ou photo de profil connue.
          </p>
        </Card>
        <Input placeholder="Nom complet utilisé sur le compte" />
        <Input placeholder="Téléphone du compte" />
        <Input placeholder="Commune / quartier" />
        <Textarea placeholder="Donnez des preuves : dernier produit publié, prix approximatif, dernière activité..." />
        <Button className="w-full" icon={ShieldCheck}>Envoyer la demande</Button>
      </div>
    </AuthLayout>
  )
}
