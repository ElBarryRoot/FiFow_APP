import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'

export default function ForgotPassword() {
  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Entrez votre téléphone ou votre email pour récupérer l’accès à votre compte.">
      <div className="space-y-4">
        <Input placeholder="Téléphone ou email" />
        <Button className="w-full" icon={Mail}>Envoyer le lien de récupération</Button>
        <Card className="border-violet-100 bg-fifow-lavender/60 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-fifow-primary" />
            <p className="text-sm font-semibold leading-6 text-fifow-secondary">Pour protéger votre compte, Fi Fow ne valide pas une récupération avec une seule information.</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex gap-3">
            <Phone className="h-6 w-6 shrink-0 text-fifow-primary" />
            <p className="text-sm font-semibold leading-6 text-fifow-secondary">Si vous n’avez pas ajouté d’email, lancez une récupération manuelle vérifiée par l’équipe Fi Fow.</p>
          </div>
        </Card>
        <Button as={Link} to="/account-recovery" variant="secondary" className="w-full">Récupération manuelle</Button>
        <Link to="/login" className="flex items-center justify-center gap-2 font-black text-fifow-primary"><ArrowLeft className="h-4 w-4" /> Retour connexion</Link>
      </div>
    </AuthLayout>
  )
}
