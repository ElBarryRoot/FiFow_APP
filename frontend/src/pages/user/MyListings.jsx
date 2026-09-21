import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Plus, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import ListingManagementCard from '../../components/user/ListingManagementCard.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import { useToast } from '../../lib/toast.jsx'

export default function MyListings() {
  const queryClient = useQueryClient()
  const showToast = useToast()
  const listingsQuery = useQuery({ queryKey: queryKeys.myProducts, queryFn: catalogueApi.mine })
  const archiveMutation = useMutation({
    mutationFn: (productId) => catalogueApi.archive(productId),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProducts })
      showToast('Annonce archivée.')
    },
    onError: (error) => showToast(errorMessage(error, 'Archivage impossible.'), { type: 'error' }),
  })

  function archive(listing) {
    if (window.confirm(`Archiver « ${listing.title} » ?`)) archiveMutation.mutate(listing.id)
  }

  return (
    <UserPageShell title="Mes annonces" eyebrow="Espace vendeur" subtitle="Suivez la visibilité et l’état réel de chacune de vos annonces." actions={<div className="flex flex-wrap gap-2"><Button as={Link} to="/profile/boosts" variant="secondary" size="sm" icon={Rocket}>Boosts</Button><Button as={Link} to="/products/new" size="sm" icon={Plus}>Publier</Button></div>}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          {listingsQuery.isLoading ? <ListingsSkeleton /> : null}
          {listingsQuery.isError ? <Card className="p-6 text-center"><p className="font-bold text-fifow-red">Vos annonces ne peuvent pas être chargées.</p><Button className="mt-4" onClick={() => listingsQuery.refetch()}>Réessayer</Button></Card> : null}
          {listingsQuery.data?.map((listing) => <ListingManagementCard key={listing.id} listing={listing} onArchive={archive} archiving={archiveMutation.isPending && archiveMutation.variables === listing.id} />)}
          {!listingsQuery.isLoading && !listingsQuery.isError && !listingsQuery.data?.length ? <Card className="p-8 text-center"><h2 className="text-xl font-black text-fifow-dark">Aucune annonce</h2><p className="mt-2 font-semibold text-fifow-secondary">Votre première annonce peut être publiée en quelques étapes.</p><Button as={Link} to="/products/new" className="mt-5" icon={Plus}>Publier</Button></Card> : null}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><HumanTrustPanel title="Conseils vendeur" text="Une annonce complète rassure et vend plus vite." items={['Photo principale claire', 'Prix réaliste en GNF', 'Quartier précis', 'Réponse rapide aux messages']} /><Button as={Link} to="/seller-verification" variant="secondary" icon={BadgeCheck} className="w-full">Vérification vendeur</Button></aside>
      </div>
    </UserPageShell>
  )
}

function ListingsSkeleton() {
  return <>{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-lg border border-fifow-border bg-slate-100" />)}</>
}
