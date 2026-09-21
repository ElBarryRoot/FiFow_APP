import { Eye, MessageCircle, Star, TrendingUp } from 'lucide-react'
import Card from '../ui/Card.jsx'

const icons = [Eye, MessageCircle, TrendingUp, Star]

export default function BoostGainGrid({ gains }) {
  return (
    <Card className="p-5">
      <h3 className="text-xl font-black text-fifow-primary">Ce que vous gagnez</h3>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {gains.map((gain, index) => {
          const Icon = icons[index] ?? Star
          return (
            <div key={gain} className="rounded-3xl bg-slate-50 p-4 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fifow-lavender text-fifow-primary">
                <Icon className="h-7 w-7" />
              </span>
              <p className="mt-3 text-sm font-black leading-5 text-fifow-dark">{gain}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
