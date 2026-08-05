import { CalendarDays } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'
import BoostMetricItem from './BoostMetricItem.jsx'
import { formatGNF } from '../../lib/formatters.js'

export default function BoostPerformanceCard({ boost }) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <div className="relative">
          <img src={boost.image} alt={boost.product} className="h-44 w-full rounded-3xl object-cover sm:h-full" />
          <span className="absolute bottom-3 left-3 rounded-2xl bg-black/75 px-3 py-1.5 text-sm font-black text-white">{boost.photosCount} photos</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black tracking-[-0.04em] text-fifow-dark">{boost.plan}</h3>
              <p className="mt-1 font-semibold text-fifow-secondary">{boost.product}</p>
              <p className="mt-2 text-lg font-black text-fifow-primary">{formatGNF(boost.price)}</p>
            </div>
            <Badge variant="success">{boost.status}</Badge>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-b border-fifow-border pb-5">
            <div className="flex gap-3"><CalendarDays className="h-6 w-6 text-fifow-green" /><div><p className="text-sm font-bold text-fifow-secondary">Début</p><p className="font-black text-fifow-dark">{boost.startDate}</p></div></div>
            <div className="flex gap-3"><CalendarDays className="h-6 w-6 text-fifow-red" /><div><p className="text-sm font-bold text-fifow-secondary">Fin</p><p className="font-black text-fifow-dark">{boost.endDate}</p></div></div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <BoostMetricItem type="impressions" label="Impressions" value={boost.impressions.toLocaleString('fr-FR')} growth={boost.impressionGrowth} />
            <BoostMetricItem type="clicks" label="Clics" value={boost.clicks} growth={boost.clickGrowth} />
            <div className="h-14 min-w-28 rounded-[1.4rem] bg-gradient-to-r from-emerald-100 via-sky-100 to-violet-100 px-4 py-3 text-center font-black text-fifow-primary">
              ↗ {boost.performance}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
