import { Clock, Headphones, Send } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { quickHelpCards, supportTopics } from '../../data/clientPortal.js'

export default function Support() {
  return (
    <UserPageShell title="Support / aide" eyebrow="Assistance Fi Fow" subtitle="Plus votre demande est précise, plus l’équipe peut vérifier et répondre rapidement." tone="trust">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="space-y-5 p-5 sm:p-7">
          <HumanSectionHeader title="Décrivez la situation" description="Ajoutez une référence si vous en avez une : commande, annonce, paiement ou conversation." />
          <Select defaultValue={supportTopics[0]}>
            {supportTopics.map((topic) => <option key={topic}>{topic}</option>)}
          </Select>
          <Input placeholder="Référence commande ou annonce si disponible" />
          <Textarea placeholder="Décrivez clairement le problème..." />
          <Button icon={Send}>Envoyer au support</Button>
        </Card>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <Card className="h-max p-5">
          <Headphones className="h-10 w-10 text-fifow-primary" />
          <h2 className="mt-4 text-xl font-black text-fifow-dark">Besoin d’aide ?</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Ajoutez les références et captures utiles. Une demande claire est traitée plus rapidement.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-fifow-lavender px-4 py-2 text-sm font-black text-fifow-primary"><Clock className="h-4 w-4" /> Réponse estimée : 24h</p>
        </Card>
          {quickHelpCards.map((card) => (
            <Card key={card.title} className="p-4">
              <h3 className="font-black text-fifow-dark">{card.title}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{card.text}</p>
            </Card>
          ))}
          <HumanTrustPanel title="À ne jamais envoyer" items={['Mot de passe', 'Code bancaire', 'Code de transfert', 'Photo de pièce non demandée']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
