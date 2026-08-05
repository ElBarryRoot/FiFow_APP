import { Clock, MapPin, MessageCircle, ShieldCheck, Star, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProductCard from '../../components/marketplace/ProductCard.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanStatCard from '../../components/user/HumanStatCard.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { publicSeller, sellerReviews } from '../../data/clientPortal.js'
import { products } from '../../data/products.js'

export default function PublicSellerProfile() {
  return (
    <UserPageShell title="Profil vendeur" eyebrow="Vendeur public" subtitle="Avant d’acheter, regardez les signaux de confiance, l’activité et les avis réels du vendeur." backTo="/products" backLabel="Retour aux annonces">
      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="h-24 bg-gradient-to-r from-fifow-dark via-fifow-primary to-fifow-green" />
            <div className="-mt-12 p-6 pt-0">
            <div className="flex gap-4">
              <img src={publicSeller.avatar} alt={publicSeller.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white" />
              <div>
                <h2 className="text-2xl font-black text-fifow-dark">{publicSeller.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {publicSeller.location}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="success" icon={ShieldCheck}>Vérifié</Badge>
                  <Badge icon={Star}>{publicSeller.rating}/5</Badge>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <HumanStatCard label="Ventes" value={publicSeller.sales} helper="confirmées" />
              <HumanStatCard label="Avis" value={publicSeller.reviews} helper="acheteurs" tone="orange" />
              <HumanStatCard label="Réponse" value={publicSeller.responseRate} helper="rapide" tone="green" />
            </div>
            <p className="mt-5 rounded-3xl bg-fifow-lavender p-4 text-sm font-semibold leading-6 text-fifow-secondary">{publicSeller.trustLine}</p>
            <Button as={Link} to="/messages/conv-1" className="mt-5 w-full" icon={MessageCircle}>Contacter le vendeur</Button>
            </div>
          </Card>
          <HumanTrustPanel title="Signaux vendeur" items={[`Membre depuis ${publicSeller.memberSince}`, publicSeller.lastSeen, publicSeller.responseTime]} />
          <Card className="p-5">
            <h3 className="text-xl font-black text-fifow-dark">Avis récents</h3>
            <div className="mt-4 space-y-3">
              {sellerReviews.map((review) => (
                <div key={review.name} className="rounded-3xl bg-slate-50 p-4">
                  <p className="flex items-center gap-2 font-black text-fifow-dark"><ThumbsUp className="h-4 w-4 text-fifow-green" /> {review.name} • {review.note}/5</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{review.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <section>
          <HumanSectionHeader
            eyebrow="Catalogue vendeur"
            title="Annonces disponibles"
            description="Des produits actifs, localisés et prêts à être discutés directement avec le vendeur."
            action={<span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-fifow-secondary shadow-card"><Clock className="h-4 w-4 text-fifow-green" /> {publicSeller.lastSeen}</span>}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      </div>
    </UserPageShell>
  )
}
