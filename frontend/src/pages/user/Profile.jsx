import { Edit3, Heart, Megaphone, MessageCircle, PackageCheck, Settings, ShieldCheck, Star, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import ListingManagementCard from '../../components/user/ListingManagementCard.jsx'
import HumanStatCard from '../../components/user/HumanStatCard.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import { myListings, profileChecklist, userProfile } from '../../data/clientPortal.js'

export default function Profile() {
  return (
    <UserPageShell title="Mon profil" eyebrow="Votre activité Fi Fow" subtitle="Un espace clair pour vendre, répondre vite et inspirer confiance aux acheteurs." tone="trust">
      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="h-24 bg-gradient-to-r from-fifow-primary via-violet-500 to-fifow-orange" />
            <div className="-mt-14 p-6 pt-0 text-center">
              <img src={userProfile.avatar} alt={userProfile.name} className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-card" />
              <h2 className="mt-4 text-2xl font-black text-fifow-dark">{userProfile.name}</h2>
              <p className="mt-1 font-semibold text-fifow-secondary">{userProfile.location} • {userProfile.neighborhood}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge variant="success" icon={ShieldCheck}>Compte vérifié</Badge>
              <Badge icon={Star}>{userProfile.rating}/5</Badge>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-fifow-secondary">{userProfile.trustLine}</p>
              <Button as={Link} to="/profile/edit" className="mt-5 w-full" icon={Edit3}>Modifier mon profil</Button>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            {userProfile.stats.map((stat, index) => <HumanStatCard key={stat.label} {...stat} tone={['violet', 'orange', 'green'][index]} />)}
          </div>
          <HumanTrustPanel title="Profil complet" text={userProfile.responseTime} items={profileChecklist} />

          <Card className="p-4">
            <div className="grid gap-2">
              <Button as={Link} to="/profile/listings" variant="secondary" icon={Megaphone}>Mes annonces</Button>
              <Button as={Link} to="/favorites" variant="secondary" icon={Heart}>Favoris</Button>
              <Button as={Link} to="/messages" variant="secondary" icon={MessageCircle}>Messages</Button>
              <Button as={Link} to="/orders" variant="secondary" icon={PackageCheck}>Commandes</Button>
              <Button as={Link} to="/settings" variant="secondary" icon={Settings}>Paramètres</Button>
            </div>
          </Card>
        </aside>

        <section className="space-y-5">
          <HumanSectionHeader
            eyebrow="Vente en cours"
            title="Vos annonces qui travaillent pour vous"
            description="Surveillez les vues, les favoris et les messages pour décider quoi booster ou modifier."
            action={<Button as={Link} to="/products/new" size="sm" icon={Megaphone}>Publier</Button>}
          />
          <Card className="border-orange-100 bg-gradient-to-r from-orange-50 via-white to-fifow-lavender p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-fifow-orange shadow-card"><TrendingUp className="h-6 w-6" /></span>
                <div>
                  <h3 className="font-black text-fifow-dark">Conseil du jour</h3>
                  <p className="text-sm font-semibold text-fifow-secondary">Les annonces avec quartier précis reçoivent plus de messages à Conakry.</p>
                </div>
              </div>
              <Button as={Link} to="/profile/listings" variant="secondary" size="sm">Voir toutes</Button>
            </div>
          </Card>
          {myListings.slice(0, 2).map((listing) => <ListingManagementCard key={listing.id} listing={listing} />)}
        </section>
      </div>
    </UserPageShell>
  )
}
