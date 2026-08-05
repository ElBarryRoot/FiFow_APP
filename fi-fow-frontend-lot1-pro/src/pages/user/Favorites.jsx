import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import CompactProductRow from '../../components/user/CompactProductRow.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { useFavorites } from '../../lib/favorites.jsx'

export default function Favorites() {
  const favorites = useFavorites()
  return (
    <UserPageShell title="Favoris" eyebrow="Votre sélection" subtitle="Les annonces que vous surveillez avant de discuter, négocier ou acheter.">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <HumanSectionHeader eyebrow="À revoir" title="Produits gardés de côté" description="Comparez les vendeurs, les quartiers et les conditions avant de lancer la discussion." />
          {favorites.loading ? <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-lg bg-slate-100" />)}</div> : null}
          {favorites.error ? <Card className="p-6 text-center"><p className="font-bold text-fifow-red">Vos favoris sont momentanément indisponibles.</p><Button onClick={() => favorites.refetch()} className="mt-4">Réessayer</Button></Card> : null}
          {!favorites.loading && !favorites.error ? <div className="grid gap-4 xl:grid-cols-2">{favorites.products.map((item) => <CompactProductRow key={item.id} item={item} />)}</div> : null}
          {!favorites.loading && !favorites.error && !favorites.products.length ? <Card className="p-8 text-center"><h2 className="text-xl font-black text-fifow-dark">Aucun favori</h2><p className="mt-2 font-semibold text-fifow-secondary">Ajoutez les annonces que vous souhaitez retrouver facilement.</p></Card> : null}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start"><HumanTrustPanel title="Astuce achat" text="Un favori n’est pas une réservation. Contactez vite le vendeur si le prix est bon." items={['Vérifiez le quartier', 'Demandez une photo récente', 'Évitez les avances hors Fi Fow']} /></aside>
      </div>
    </UserPageShell>
  )
}
