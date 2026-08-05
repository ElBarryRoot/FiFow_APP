import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Edit3, Heart, Megaphone, MessageCircle, PackageCheck, Rocket, Settings, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'
import { toUserView } from '../../api/adapters.js'
import { hasAdminRole } from '../../auth/adminAccess.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import ListingManagementCard from '../../components/user/ListingManagementCard.jsx'
import HumanStatCard from '../../components/user/HumanStatCard.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'

export default function Profile() {
  const auth = useAuth()
  const user = toUserView(auth.user)
  const listingsQuery = useQuery({ queryKey: queryKeys.myProducts, queryFn: catalogueApi.mine })
  const listings = listingsQuery.data || []
  const activeListings = listings.filter((item) => item.status === 'AVAILABLE')
  const totals = activeListings.reduce((result, item) => ({ views: result.views + item.views, favorites: result.favorites + item.favorites }), { views: 0, favorites: 0 })
  const completedSignals = [auth.user.emailVerified && 'Email vérifié', auth.user.phoneVerified && 'Téléphone vérifié', auth.user.avatarUrl && 'Photo de profil ajoutée', auth.user.quartier && 'Quartier renseigné'].filter(Boolean)

  return (
    <UserPageShell title="Mon profil" eyebrow="Votre activité Fi Fow" subtitle="Un espace clair pour vendre, répondre vite et inspirer confiance aux acheteurs.">
      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="h-24 bg-fifow-dark" />
            <div className="-mt-14 p-6 pt-0 text-center">
              <img src={user.avatar} alt={user.fullName} className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-card" />
              <h2 className="mt-4 text-2xl font-black text-fifow-dark">{user.fullName}</h2>
              <p className="mt-1 font-semibold text-fifow-secondary">{user.location || 'Localisation à compléter'}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {auth.user.emailVerified ? <Badge variant="success" icon={ShieldCheck}>Email vérifié</Badge> : <Badge variant="warning">Email à vérifier</Badge>}
                <Badge icon={Star}>{user.rating.toFixed(1)}/5</Badge>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-fifow-secondary">Score de confiance Fi Fow : {auth.user.trustScore}/100.</p>
              <Button as={Link} to="/profile/edit" className="mt-5 w-full" icon={Edit3}>Modifier mon profil</Button>
            </div>
          </Card>
          <div className="grid grid-cols-3 gap-3">
            <HumanStatCard label="En ligne" value={activeListings.length} helper="annonces" />
            <HumanStatCard label="Vues" value={totals.views} helper="cumulées" tone="orange" />
            <HumanStatCard label="Favoris" value={totals.favorites} helper="reçus" tone="green" />
          </div>
          <HumanTrustPanel title="Profil de confiance" text={`${completedSignals.length}/4 signaux complétés`} items={completedSignals} />
          <Card className="p-4"><div className="grid gap-2">{hasAdminRole(auth.user) ? <Button as={Link} to="/admin" icon={ShieldCheck}>Administration</Button> : null}<Button as={Link} to="/profile/listings" variant="secondary" icon={Megaphone}>Mes annonces</Button><Button as={Link} to="/profile/boosts" variant="secondary" icon={Rocket}>Mes boosts</Button><Button as={Link} to="/seller-verification" variant="secondary" icon={BadgeCheck}>Vérification vendeur</Button><Button as={Link} to="/favorites" variant="secondary" icon={Heart}>Favoris</Button><Button as={Link} to="/messages" variant="secondary" icon={MessageCircle}>Messages</Button><Button as={Link} to="/orders" variant="secondary" icon={PackageCheck}>Commandes</Button><Button as={Link} to="/settings" variant="secondary" icon={Settings}>Paramètres</Button></div></Card>
        </aside>
        <section className="space-y-5">
          <HumanSectionHeader eyebrow="Vente en cours" title="Vos annonces actives" description="Les vues, favoris et conversations proviennent directement de votre activité." action={<Button as={Link} to="/products/new" size="sm" icon={Megaphone}>Publier</Button>} />
          {listingsQuery.isLoading ? <div className="h-72 animate-pulse rounded-lg bg-slate-100" /> : null}
          {listingsQuery.isError ? <Card className="p-8 text-center" role="alert"><p className="font-bold text-fifow-red">Vos annonces sont indisponibles.</p><Button type="button" variant="secondary" className="mt-4" onClick={() => listingsQuery.refetch()}>Réessayer</Button></Card> : null}
          {!listingsQuery.isError ? activeListings.slice(0, 2).map((listing) => <ListingManagementCard key={listing.id} listing={listing} />) : null}
          {!listingsQuery.isLoading && !listingsQuery.isError && !activeListings.length ? <Card className="p-8 text-center"><p className="font-bold text-fifow-secondary">Aucune annonce en ligne pour le moment.</p></Card> : null}
        </section>
      </div>
    </UserPageShell>
  )
}
