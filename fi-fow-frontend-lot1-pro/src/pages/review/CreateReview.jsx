import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { defaultAvatar } from '../../api/adapters.js'
import { errorMessage } from '../../api/errors.js'
import { ordersApi } from '../../api/orders.js'
import { queryKeys } from '../../api/queryKeys.js'
import { reviewsApi } from '../../api/reviews.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import DetailedRatingRow from '../../components/review/DetailedRatingRow.jsx'
import RatingStars from '../../components/review/RatingStars.jsx'
import ReviewProductCard from '../../components/review/ReviewProductCard.jsx'
import ReviewSellerCard from '../../components/review/ReviewSellerCard.jsx'
import ReviewTextarea from '../../components/review/ReviewTextarea.jsx'
import ReviewTrustCard from '../../components/review/ReviewTrustCard.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { formatDateTime, orderCounterpart, orderProduct } from '../../lib/commerce.js'
import { useToast } from '../../lib/toast.jsx'

const detailedRatingItems = [
  { id: 'communicationRating', title: 'Communication', description: 'Clarté et réactivité pendant la transaction' },
  { id: 'productAccuracyRating', title: 'Conformité', description: 'Correspondance entre le produit et l’annonce' },
  { id: 'behaviorRating', title: 'Comportement', description: 'Respect des engagements et de la remise' },
]

export default function CreateReview() {
  const { id: orderId } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const [globalRating, setGlobalRating] = useState(0)
  const [details, setDetails] = useState({})
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  const orderQuery = useQuery({ queryKey: queryKeys.order(orderId), queryFn: () => ordersApi.detail(orderId, { userId: auth.user.id }), enabled: Boolean(orderId) })
  const reviewMutation = useMutation({
    mutationFn: (input) => reviewsApi.create(input),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      if (review.subjectId) queryClient.invalidateQueries({ queryKey: queryKeys.userReviews(review.subjectId) })
      showToast('Votre avis a été publié.')
      navigate(`/orders/${orderId}`, { replace: true })
    },
  })

  function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!globalRating) nextErrors.rating = 'Sélectionnez une note globale.'
    if (comment.trim().length < 3) nextErrors.comment = 'Décrivez votre expérience en au moins 3 caractères.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    reviewMutation.mutate({
      orderId,
      rating: globalRating,
      ...(details.communicationRating ? { communicationRating: details.communicationRating } : {}),
      ...(details.productAccuracyRating ? { productAccuracyRating: details.productAccuracyRating } : {}),
      ...(details.behaviorRating ? { behaviorRating: details.behaviorRating } : {}),
      comment: comment.trim(),
    })
  }

  const order = orderQuery.data
  const canReview = order && (order.availableActions?.includes('REVIEW') ?? (order.status === 'COMPLETED' && !order.myReview))
  const counterpart = order ? orderCounterpart(order, auth.user.id) : null
  const product = order ? orderProduct(order) : null
  const subject = counterpart ? {
    name: counterpart.name,
    avatar: order.counterpart?.avatarUrl || counterpart.avatar || defaultAvatar,
    verified: order.role === 'buyer' ? Boolean(order.seller?.verified) : false,
    rating: order.counterpart?.averageRating,
    totalReviews: order.counterpart?.totalReviews,
  } : null

  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Laisser un avis" secure={false} backTo={`/orders/${orderId}`} />
      <section className="marketplace-container py-6">
        {orderQuery.isLoading ? <LoadingBlock label="Chargement de l’avis" rows={3} /> : null}
        {orderQuery.isError ? <ErrorBlock title="Avis indisponible" message={errorMessage(orderQuery.error)} onRetry={orderQuery.refetch} /> : null}
        {order && !canReview ? <EmptyBlock title={order.myReview ? 'Avis déjà publié' : 'Avis pas encore disponible'} message={order.myReview ? 'Un seul avis peut être publié par personne pour cette commande.' : 'L’avis devient disponible une fois la commande terminée.'} action={<Button as={Link} to={`/orders/${orderId}`} variant="secondary">Voir la commande</Button>} /> : null}
        {order && canReview ? (
          <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-24"><ReviewSellerCard seller={subject} label={order.role === 'buyer' ? 'Vendeur évalué' : 'Acheteur évalué'} /><ReviewProductCard product={{ ...product, orderedAt: formatDateTime(order.createdAt, { dateOnly: true }) }} /></aside>
            <div className="space-y-6">
              <div><p className="text-xs font-black uppercase text-fifow-primary">Expérience vérifiée</p><h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">Votre avis aide la communauté</h1><p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Évaluez uniquement cette transaction et restez factuel.</p></div>
              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-black text-fifow-dark">Note globale</h2>
                <div className="mt-4"><RatingStars value={globalRating} onChange={(value) => { setGlobalRating(value); setErrors((current) => ({ ...current, rating: '' })) }} label={globalRating ? `${globalRating}/5` : 'Sélectionnez une note'} /></div>
                {errors.rating ? <p className="mt-3 text-center text-sm font-bold text-fifow-red" role="alert">{errors.rating}</p> : null}
              </Card>
              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-black text-fifow-dark">Notes détaillées <span className="font-semibold text-fifow-secondary">(optionnel)</span></h2>
                <div className="mt-2">{detailedRatingItems.map((item) => <DetailedRatingRow key={item.id} item={item} value={details[item.id] ?? 0} onChange={(value) => setDetails((current) => ({ ...current, [item.id]: value }))} />)}</div>
              </Card>
              <ReviewTextarea value={comment} onChange={(value) => { setComment(value); setErrors((current) => ({ ...current, comment: '' })) }} error={errors.comment} />
              <ReviewTrustCard />
              {reviewMutation.isError ? <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-fifow-red" role="alert">{errorMessage(reviewMutation.error, 'Votre avis ne peut pas être publié.')}</p> : null}
              <Button type="submit" size="lg" className="w-full" icon={Send} loading={reviewMutation.isPending}>Publier l’avis</Button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  )
}
