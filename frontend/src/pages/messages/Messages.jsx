import { useMemo, useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import Input from '../../components/ui/Input.jsx'
import Card from '../../components/ui/Card.jsx'
import ConversationListItem from '../../components/user/ConversationListItem.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { conversations } from '../../data/clientPortal.js'

export default function Messages() {
  const [query, setQuery] = useState('')
  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return conversations
    return conversations.filter((conversation) => `${conversation.seller} ${conversation.product} ${conversation.lastMessage}`.toLowerCase().includes(normalized))
  }, [query])

  return (
    <UserPageShell title="Messages" eyebrow="Négociations" subtitle="Un bon échange aide à éviter les malentendus avant la rencontre ou le paiement." tone="trust">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <HumanSectionHeader title="Discussions actives" description="Priorisez les vendeurs disponibles et les produits qui vous intéressent vraiment." />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fifow-muted" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-12" placeholder="Rechercher une conversation..." />
          </div>
          {visibleConversations.map((conversation) => <ConversationListItem key={conversation.id} conversation={conversation} />)}
          {!visibleConversations.length ? (
            <Card className="p-8 text-center">
              <MessageCircle className="mx-auto h-9 w-9 text-fifow-muted" />
              <p className="mt-3 font-extrabold text-fifow-dark">Aucune conversation trouvée</p>
            </Card>
          ) : null}
        </aside>
        <section className="hidden space-y-5 lg:block">
          <Card className="min-h-[430px] overflow-hidden bg-gradient-to-br from-white via-fifow-lavender/60 to-blue-50 p-10">
            <div className="grid h-full place-items-center text-center">
          <div>
            <h2 className="text-3xl font-black text-fifow-dark">Sélectionnez une conversation</h2>
                <p className="mt-3 max-w-md font-semibold leading-7 text-fifow-secondary">Vos échanges avec les vendeurs s’afficheront ici pour négocier, confirmer un lieu et finaliser l’achat.</p>
              </div>
            </div>
          </Card>
          <HumanTrustPanel title="Rappel sécurité" items={['Gardez la discussion sur Fi Fow', 'Confirmez le lieu avant déplacement', 'Ne partagez pas votre mot de passe']} />
        </section>
          </div>
    </UserPageShell>
  )
}
