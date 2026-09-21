import { Eye, MousePointerClick } from 'lucide-react'

const icons = {
  impressions: Eye,
  clicks: MousePointerClick,
}

export default function BoostMetricItem({ type, label, value, growth }) {
  const Icon = icons[type] ?? Eye

  return (
    <div className="flex items-center gap-3">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-fifow-lavender text-fifow-primary">
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <p className="text-sm font-bold text-fifow-secondary">{label}</p>
        <p className="text-xl font-black text-fifow-dark">{value}</p>
        <p className="text-sm font-black text-fifow-green">↗ {growth}%</p>
      </div>
    </div>
  )
}
