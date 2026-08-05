import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import ListingManagementCard from '../../components/user/ListingManagementCard.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { myListings } from '../../data/clientPortal.js'

export default function MyListings() {
  return (
    <UserPageShell title="Mes annonces" eyebrow="Espace vendeur" subtitle="Pilotez vos annonces comme un vrai tableau de vente : visibilité, messages, favoris et boost." actions={<Button as={Link} to="/products/new" size="sm" icon={Plus}>Publier</Button>} tone="warm">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <HumanSectionHeader eyebrow="Vos produits" title="Annonces actives et en validation" description="Priorisez les annonces qui reçoivent des messages ou qui méritent un boost." />
          {myListings.map((listing) => <ListingManagementCard key={listing.id} listing={listing} />)}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <HumanTrustPanel title="Conseils vendeur" text="Une annonce complète rassure et vend plus vite." items={['Photo principale claire', 'Prix réaliste en GNF', 'Quartier précis', 'Réponse rapide aux messages']} />
          <HumanTrustPanel title="Boost utile quand..." items={['Beaucoup de vues mais peu de messages', 'Produit urgent à vendre', 'Annonce en concurrence forte']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
