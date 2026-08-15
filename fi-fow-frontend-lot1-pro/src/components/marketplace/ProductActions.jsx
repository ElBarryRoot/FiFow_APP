import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Heart, MessageCircle, ShoppingBag, ShoppingCart, ThumbsUp } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { cartApi } from '../../api/cart.js'
import { conversationsApi } from '../../api/conversations.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useFavorites } from '../../lib/favorites.jsx'
import { useToast } from '../../lib/toast.jsx'
import { cn } from '../../lib/utils.js'
import Button from '../ui/Button.jsx'
import ProductShareActions from './ProductShareActions.jsx'
import ProductShareMenu from './ProductShareMenu.jsx'

export default function ProductActions({ product }) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isFavorite, toggle } = useFavorites()
  const showToast = useToast()
  const favorite = isFavorite(product.id)
  const ownProduct = auth.user?.id === product.seller?.id
  const likesQuery = useQuery({ queryKey: queryKeys.likes, queryFn: catalogueApi.likes, enabled: auth.isAuthenticated })
  const liked = Boolean(likesQuery.data?.some((item) => item.id === product.id))

  const contactMutation = useMutation({
    mutationFn: () => conversationsApi.create(product.id, auth.user.id),
    onError: (error) => showToast(errorMessage(error, 'Conversation impossible.'), { type: 'error' }),
  })
  const likeMutation = useMutation({
    mutationFn: () => liked ? catalogueApi.unlike(product.id) : catalogueApi.like(product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.likes }),
    onError: (error) => showToast(errorMessage(error, 'Action impossible.'), { type: 'error' }),
  })
  const cartMutation = useMutation({
    mutationFn: () => cartApi.add(product.id),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart, cart)
      showToast('Annonce ajoutée au panier', { type: 'success' })
    },
    onError: (error) => showToast(errorMessage(error, 'Ajout au panier impossible.'), { type: 'error' }),
  })

  async function openConversation(intent) {
    if (!auth.isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    const conversation = await contactMutation.mutateAsync().catch(() => null)
    if (conversation) navigate(`/messages/${conversation.id}${intent ? `?intent=${intent}` : ''}`)
  }

  function startPurchase() {
    const destination = `/products/${product.slug || product.id}/buy`
    if (!auth.isAuthenticated) {
      navigate('/login', { state: { from: { pathname: destination }, product } })
      return
    }
    navigate(destination, { state: { product } })
  }

  function addToCart() {
    if (!auth.isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    cartMutation.mutate()
  }

  function toggleFavorite() {
    const added = toggle(product.id)
    if (added === null) return
    showToast(added ? 'Ajouté à vos favoris' : 'Retiré de vos favoris', { type: added ? 'success' : 'info' })
  }

  function shareFeedback(message, type = 'success') {
    showToast(message, { type })
  }

  if (ownProduct) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button as={Link} to="/profile/listings" size="lg" className="w-full sm:flex-1">Gérer mon annonce</Button>
        <ProductShareActions title={product.title} onFeedback={shareFeedback} className="justify-between sm:justify-end" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={startPurchase} icon={ShoppingBag} size="lg" className="w-full">Acheter</Button>
        <Button type="button" onClick={addToCart} loading={cartMutation.isPending} icon={ShoppingCart} size="lg" variant="secondary" className="w-full">Au panier</Button>
        <Button type="button" onClick={() => openConversation('contact')} loading={contactMutation.isPending} icon={MessageCircle} size="lg" variant="ghost" className="col-span-2 w-full border border-fifow-border">Contacter le vendeur</Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <SmallAction icon={Heart} label="Favori" active={favorite} onClick={toggleFavorite} />
        <SmallAction icon={ThumbsUp} label="J’aime" active={liked} onClick={() => auth.isAuthenticated ? likeMutation.mutate() : navigate('/login', { state: { from: location } })} />
        <ProductShareMenu title={product.title} onFeedback={shareFeedback} />
        <SmallAction
          as={Link}
          to={`/report/${product.id}`}
          state={{ product: { id: product.id, slug: product.slug, title: product.title, image: product.image } }}
          icon={Flag}
          label="Signaler"
          danger
        />
      </div>
    </div>
  )
}

function SmallAction({ as: Component = 'button', icon: Icon, label, danger, active, ...props }) {
  const nativeProps = Component === 'button' ? { type: 'button' } : {}
  return (
    <Component aria-label={label} className={cn('flex h-12 min-w-0 items-center justify-center gap-1 rounded-lg border bg-white px-2 text-xs font-extrabold transition-colors sm:text-sm', danger ? 'border-red-100 text-fifow-red hover:bg-red-50' : 'border-fifow-border text-fifow-primary hover:border-violet-200 hover:bg-fifow-lavender', active && 'border-fifow-primary bg-fifow-lavender')} {...nativeProps} {...props}>
      <Icon className={cn('h-5 w-5 shrink-0', active && 'fill-current')} /><span className="hidden xl:inline">{label}</span>
    </Component>
  )
}
