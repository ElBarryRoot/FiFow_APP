import { Eye, TrendingUp, Users } from 'lucide-react'

const icons = [TrendingUp, Eye, Users]

export default function BoostBenefitRow({ benefits }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {benefits.map((benefit, index) => {
        const Icon = icons[index] ?? TrendingUp
        return (
          <div key={benefit.label} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card">
            <Icon className="h-8 w-8 text-fifow-orange" />
            <div>
              <p className="font-black text-fifow-dark">{benefit.label}</p>
              <p className="text-sm font-semibold text-fifow-secondary">{benefit.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
