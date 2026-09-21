import { useQuery } from '@tanstack/react-query'
import { Rocket, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { boostsApi } from '../../api/boosts.js'
import { catalogueApi } from '../../api/catalogue.js'
import { queryKeys } from '../../api/queryKeys.js'
import BoostPlanCard from '../../components/boost/BoostPlanCard.jsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Select from '../../components/ui/Select.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

export default function BoostPlans() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedProductId = searchParams.get('productId') || ''
  const [productId, setProductId] = useState(requestedProductId)
  const plansQuery = useQuery({ queryKey: queryKeys.boostPlans, queryFn: boostsApi.plans })
  const listingsQuery = useQuery({ queryKey: queryKeys.myProducts, queryFn: catalogueApi.mine })
  const listings = (listingsQuery.data || []).filter((listing) => listing.status === 'AVAILABLE' && !listing.boosted)
  const selectedListing = listings.find((listing) => listing.id === productId)

  useEffect(() => {
    if (productId || !listings.length) return
    setProductId(listings[0].id)
  }, [listings, productId])

  function selectProduct(nextId) {
    setProductId(nextId)
    const next = new URLSearchParams(searchParams)
    if (nextId) next.set('productId', nextId)
    else next.delete('productId')
    setSearchParams(next, { replace: true })
  }

  return (
    <UserPageShell title="Booster une annonce" eyebrow="Visibilité vendeur" subtitle="Choisissez une annonce et un plan disponible. Le prix et la durée viennent directement de Fi Fow." backTo="/profile/listings" backLabel="Retour aux annonces" actions={<Button as={Link} to="/profile/boosts" variant="secondary" size="sm">Mes boosts</Button>}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <Card className="p-5">
            <label htmlFor="boost-product" className="text-sm font-black text-fifow-dark">Annonce à mettre en avant</label>
            {listingsQuery.isLoading ? <div className="mt-3 h-14 animate-pulse rounded-lg bg-slate-100" /> : null}
            {listingsQuery.isError ? <p className="mt-3 text-sm font-bold text-fifow-red">Vos annonces ne peuvent pas être chargées.</p> : null}
            {!listingsQuery.isLoading && !listingsQuery.isError && listings.length ? (
              <Select id="boost-product" value={productId} onChange={(event) => selectProduct(event.target.value)} className="mt-3">
                {listings.map((listing) => <option key={listing.id} value={listing.id}>{listing.title}</option>)}
              </Select>
            ) : null}
          </Card>

          {plansQuery.isLoading ? <LoadingBlock label="Chargement des plans" rows={3} /> : null}
          {plansQuery.isError ? <ErrorBlock title="Plans indisponibles" message="Fi Fow ne peut pas charger les plans actifs pour le moment." onRetry={plansQuery.refetch} /> : null}
          {!plansQuery.isLoading && !plansQuery.isError && !plansQuery.data?.length ? <EmptyBlock title="Aucun plan actif" message="Aucun boost n’est commercialisé actuellement." /> : null}
          {plansQuery.data?.length ? <div className="grid gap-4 xl:grid-cols-2">{plansQuery.data.map((plan) => <BoostPlanCard key={plan.id} plan={plan} productSlug={selectedListing?.slug} />)}</div> : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {!listingsQuery.isLoading && !listingsQuery.isError && !listings.length ? <EmptyBlock title="Aucune annonce éligible" message="Publiez une annonce disponible avant d’acheter un boost." action={<Button as={Link} to="/products/new" icon={Rocket}>Publier une annonce</Button>} /> : null}
          <Card className="border-emerald-100 bg-fifow-mint p-5">
            <ShieldCheck className="h-8 w-8 text-fifow-green" />
            <h2 className="mt-3 text-lg font-black text-fifow-dark">Données honnêtes</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Fi Fow affiche uniquement la durée, l’emplacement et les résultats réellement mesurés. Aucun volume de vues n’est garanti.</p>
          </Card>
        </aside>
      </div>
    </UserPageShell>
  )
}
