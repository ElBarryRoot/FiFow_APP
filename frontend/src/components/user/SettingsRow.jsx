import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'

export default function SettingsRow({ icon: Icon, title, description, to = '#' }) {
  return (
    <Card as={Link} to={to} className="block p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fifow-lavender text-fifow-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-fifow-dark">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-fifow-secondary">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-fifow-muted" />
      </div>
    </Card>
  )
}
