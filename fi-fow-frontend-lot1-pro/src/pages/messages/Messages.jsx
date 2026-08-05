import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Search } from 'lucide-react'
import { conversationsApi } from '../../api/conversations.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import ConversationListItem from '../../components/user/ConversationListItem.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

export default function Messages() {
  const auth = useAuth()
  const [query, setQuery] = useState('')
  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversationList,
    queryFn: () => conversationsApi.list({ limit: 50, userId: auth.user.id }),
  })
  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr')
    const conversations = conversationsQuery.data?.items || []
    if (!normalized) return conversations
    return conversations.filter((conversation) => `${conversation.seller} ${conversation.productTitle} ${conversation.lastMessage}`.toLocaleLowerCase('fr').includes(normalized))
  }, [conversationsQuery.data, query])

  return (
    <UserPageShell title="Messages" eyebrow="Négociations" subtitle="Retrouvez vos échanges, offres et photos au même endroit.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <HumanSectionHeader title="Discussions actives" description={`${conversationsQuery.data?.unreadCount || 0} message(s) non lu(s)`} />
          <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fifow-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-12" placeholder="Rechercher une conversation…" /></div>
          {conversationsQuery.isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-lg bg-slate-100" />) : null}
          {conversationsQuery.isError ? <Card className="p-6 text-center"><p className="font-bold text-fifow-red">Les conversations sont indisponibles.</p><Button className="mt-4" onClick={() => conversationsQuery.refetch()}>Réessayer</Button></Card> : null}
          {visibleConversations.map((conversation) => <ConversationListItem key={conversation.id} conversation={conversation} />)}
          {!conversationsQuery.isLoading && !conversationsQuery.isError && !visibleConversations.length ? <Card className="p-8 text-center"><MessageCircle className="mx-auto h-9 w-9 text-fifow-muted" /><p className="mt-3 font-extrabold text-fifow-dark">Aucune conversation</p><p className="mt-1 text-sm font-semibold text-fifow-secondary">Contactez un vendeur depuis une annonce.</p></Card> : null}
        </aside>
        <section className="hidden space-y-5 lg:block"><Card className="grid min-h-[430px] place-items-center p-10 text-center"><div><MessageCircle className="mx-auto h-12 w-12 text-fifow-primary" /><h2 className="mt-4 text-3xl font-black text-fifow-dark">Sélectionnez une conversation</h2><p className="mt-3 max-w-md font-semibold leading-7 text-fifow-secondary">Le détail de l’échange s’ouvrira ici avec l’annonce associée.</p></div></Card><HumanTrustPanel title="Rappel sécurité" items={['Gardez la discussion sur Fi Fow', 'Confirmez le lieu avant déplacement', 'Ne partagez jamais votre mot de passe']} /></section>
      </div>
    </UserPageShell>
  )
}
