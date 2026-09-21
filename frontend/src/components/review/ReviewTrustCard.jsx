import { ShieldCheck } from 'lucide-react'
import Card from '../ui/Card.jsx'

export default function ReviewTrustCard() {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <ShieldCheck className="h-10 w-10 shrink-0 text-fifow-primary" />
        <p className="font-semibold leading-6 text-fifow-secondary">
          <span className="font-black text-fifow-dark">Votre avis aide la communauté Fi Fow</span> à acheter en toute confiance. Merci pour votre contribution !
        </p>
      </div>
    </Card>
  )
}
