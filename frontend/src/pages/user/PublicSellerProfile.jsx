import { useMutation, useQuery } from '@tanstack/react-query'
import { Flag, MapPin, ShieldCheck, Star, ThumbsUp } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { defaultAvatar, formatRelativeDate } from '../../api/adapters.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { reviewsApi } from '../../api/reviews.js'
import { usersApi } from '../../api/users.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProductCard from '../../components/marketplace/ProductCard.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanStatCard from '../../components/user/HumanStatCard.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { useToast } from '../../lib/toast.jsx'

export default function PublicSellerProfile() {
  const { id } = useParams()
  const auth = useAuth()
  const showToast = useToast()
  const sellerQuery = useQuery({ queryKey: queryKeys.publicUser(id), queryFn: () => usersApi.publicProfile(id), enabled: Boolean(id) })
  const productsQuery = useQuery({ queryKey: queryKeys.products({ sellerId: id }), queryFn: () => catalogueApi.list({ sellerId: id, limit: 24 }), enabled: Boolean(id) })
  const reviewsQuery = useQuery({ queryKey: queryKeys.userReviews(id), queryFn: () => reviewsApi.forUser(id, { limit: 5 }), enabled: Boolean(id) })
  const blockMutation = useMutation({
    mutationFn: () => usersApi.block(id, 'Bloqué depuis le profil public'),
    onSuccess: () => showToast('Utilisateur bloqué.', { type: 'info' }),
    onError: (error) => showToast(errorMessage(error, 'Blocage impossible.'), { type: 'error' }),
  })

  if (sellerQuery.isLoading) return <UserPageShell title="Profil vendeur"><div className="h-[520px] animate-pulse rounded-lg bg-slate-100" /></UserPageShell>
  if (sellerQuery.isError) return <UserPageShell title="Profil vendeur" backTo="/products" backLabel="Retour aux annonces"><Card className="p-8 text-center"><h2 className="text-xl font-black text-fifow-dark">Profil introuvable</h2><p className="mt-2 font-semibold text-fifow-secondary">Ce vendeur n’est plus accessible.</p></Card></UserPageShell>
  const seller = sellerQuery.data
  const products = productsQuery.data?.items || []
  const reviews = reviewsQuery.data?.items || []

  return (
    <UserPageShell title="Profil vendeur" eyebrow="Vendeur public" subtitle="Consultez uniquement les signaux de confiance vérifiés par Fi Fow." backTo="/products" backLabel="Retour aux annonces">
      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="h-24 bg-fifow-dark" />
            <div className="-mt-12 p-6 pt-0">
              <div className="flex gap-4"><img src={seller.avatarUrl || defaultAvatar} alt={seller.fullName} className="h-24 w-24 rounded-full object-cover ring-4 ring-white" /><div className="pt-12"><h2 className="text-2xl font-black text-fifow-dark">{seller.fullName}</h2><p className="mt-1 flex items-center gap-1 text-sm font-semibold text-fifow-secondary"><MapPin className="h-4 w-4 text-fifow-primary" /> {seller.commune || 'Guinée'}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2">{seller.verifiedSeller ? <Badge variant="success" icon={ShieldCheck}>Vendeur vérifié</Badge> : null}<Badge icon={Star}>{Number(seller.averageRating).toFixed(1)}/5</Badge></div>
              <div className="mt-6 grid grid-cols-3 gap-3"><HumanStatCard label="Annonces" value={seller.activeProducts} helper="actives" /><HumanStatCard label="Avis" value={seller.totalReviews} helper="publiés" tone="orange" /><HumanStatCard label="Confiance" value={`${seller.trustScore}%`} helper="Fi Fow" tone="green" /></div>
              {auth.isAuthenticated && auth.user.id !== seller.id ? <Button type="button" variant="ghost" icon={Flag} loading={blockMutation.isPending} onClick={() => window.confirm(`Bloquer ${seller.fullName} ?`) && blockMutation.mutate()} className="mt-5 w-full text-fifow-red">Bloquer cet utilisateur</Button> : null}
            </div>
          </Card>
          <HumanTrustPanel title="Signaux vendeur" items={[`Membre depuis ${new Intl.DateTimeFormat('fr-GN', { month: 'long', year: 'numeric' }).format(new Date(seller.memberSince))}`, `${seller.totalReviews} avis publiés`, `Score de confiance ${seller.trustScore}/100`]} />
          <Card className="p-5"><h3 className="text-xl font-black text-fifow-dark">Avis récents</h3><div className="mt-4 space-y-3">{reviews.map((review) => <div key={review.id} className="rounded-lg bg-slate-50 p-4"><p className="flex items-center gap-2 font-black text-fifow-dark"><ThumbsUp className="h-4 w-4 text-fifow-green" /> {review.author.fullName} • {review.rating}/5</p><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{review.comment}</p><p className="mt-2 text-xs font-bold text-fifow-muted">{formatRelativeDate(review.createdAt)}</p></div>)}{reviewsQuery.isError ? <InlineError message="Les avis sont indisponibles." onRetry={reviewsQuery.refetch} /> : null}{!reviewsQuery.isLoading && !reviewsQuery.isError && !reviews.length ? <p className="text-sm font-semibold text-fifow-secondary">Aucun avis publié.</p> : null}</div></Card>
        </aside>
        <section><HumanSectionHeader eyebrow="Catalogue vendeur" title="Annonces disponibles" description="Ces annonces sont actives et approuvées par la marketplace." />{productsQuery.isLoading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-lg bg-slate-100" />)}</div> : null}{productsQuery.isError ? <Card className="p-8 text-center"><InlineError message="Les annonces de ce vendeur sont indisponibles." onRetry={productsQuery.refetch} /></Card> : null}{!productsQuery.isLoading && !productsQuery.isError ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : null}{!productsQuery.isLoading && !productsQuery.isError && !products.length ? <Card className="p-8 text-center"><p className="font-bold text-fifow-secondary">Aucune annonce disponible.</p></Card> : null}</section>
      </div>
    </UserPageShell>
  )
}

function InlineError({ message, onRetry }) {
  return <div role="alert"><p className="text-sm font-bold text-fifow-red">{message}</p><button type="button" onClick={onRetry} className="mt-2 text-sm font-black text-fifow-primary hover:underline">Réessayer</button></div>
}
