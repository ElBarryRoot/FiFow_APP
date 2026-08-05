import CompactProductRow from '../../components/user/CompactProductRow.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { favoriteListings } from '../../data/clientPortal.js'

export default function Favorites() {
  return (
    <UserPageShell title="Favoris" eyebrow="Votre sélection" subtitle="Les annonces que vous surveillez avant de discuter, négocier ou acheter." tone="warm">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <HumanSectionHeader eyebrow="À revoir" title="Produits gardés de côté" description="Comparez les vendeurs, les quartiers et les conditions avant de lancer la discussion." />
          <div className="grid gap-4 xl:grid-cols-2">
            {favoriteListings.map((item) => <CompactProductRow key={item.id} item={item} />)}
          </div>
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <HumanTrustPanel title="Astuce achat" text="Un favori n’est pas une réservation. Contactez vite le vendeur si le prix est bon." items={['Vérifiez le quartier', 'Demandez une photo récente', 'Évitez les avances hors Fi Fow']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
