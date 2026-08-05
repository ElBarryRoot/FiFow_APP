import { CheckCircle2, Send } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import TransactionHeader from '../../components/payment/TransactionHeader.jsx'
import DetailedRatingRow from '../../components/review/DetailedRatingRow.jsx'
import RatingStars from '../../components/review/RatingStars.jsx'
import ReviewProductCard from '../../components/review/ReviewProductCard.jsx'
import ReviewSellerCard from '../../components/review/ReviewSellerCard.jsx'
import ReviewTextarea from '../../components/review/ReviewTextarea.jsx'
import ReviewTrustCard from '../../components/review/ReviewTrustCard.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import { detailedRatingItems, reviewTarget } from '../../data/reviews.js'

export default function CreateReview() {
  const [globalRating, setGlobalRating] = useState(0)
  const [details, setDetails] = useState({})
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  function submitReview() {
    if (!globalRating) {
      setError('Veuillez sélectionner une note globale avant d’envoyer votre avis.')
      return
    }
    setError('')
  }

  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <TransactionHeader title="Laisser un avis" secure={false} backTo="/orders" />
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <aside className="space-y-5">
          <ReviewSellerCard seller={reviewTarget.seller} />
          <ReviewProductCard product={reviewTarget.product} />
        </aside>
        <div className="space-y-6">
          <HumanSectionHeader eyebrow="Retour d’expérience" title="Votre avis aide les prochains acheteurs" description="Soyez précis, simple et juste. Un bon avis parle de communication, conformité et remise." />
          <section>
            <h2 className="text-2xl font-black text-fifow-dark">Votre note globale</h2>
            <p className="mt-2 font-semibold text-fifow-secondary">Comment évaluez-vous votre expérience globale ?</p>
            <div className="mt-5">
              <RatingStars value={globalRating} onChange={(value) => { setGlobalRating(value); setError('') }} label={globalRating ? `${globalRating}/5` : 'Sélectionnez une note'} />
              {error ? <p className="mt-3 text-center text-sm font-bold text-fifow-red">{error}</p> : null}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-fifow-dark">Notes détaillées <span className="font-semibold text-fifow-secondary">(optionnel)</span></h2>
            <Card className="mt-4 p-5">
              {detailedRatingItems.map((item) => (
                <DetailedRatingRow
                  key={item.id}
                  item={item}
                  value={details[item.id] ?? 0}
                  onChange={(value) => setDetails((previous) => ({ ...previous, [item.id]: value }))}
                />
              ))}
            </Card>
          </section>

          <ReviewTextarea value={comment} onChange={setComment} />
          <ReviewTrustCard />
          {globalRating ? (
            <Card className="border-emerald-100 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 font-black text-fifow-green"><CheckCircle2 className="h-5 w-5" /> Note globale prête : {globalRating}/5</p>
            </Card>
          ) : null}
          <Button size="lg" className="w-full" icon={Send} onClick={submitReview}>Envoyer l’avis</Button>
        </div>
      </section>
    </main>
  )
}
