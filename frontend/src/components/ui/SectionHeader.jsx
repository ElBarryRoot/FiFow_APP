import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SectionHeader({ title, to = '/products', icon: Icon, showAll = true }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="section-title flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-fifow-primary" /> : null}
        {title}
      </h2>
      {showAll ? <Link to={to} className="inline-flex items-center gap-1 text-sm font-extrabold text-fifow-primary sm:text-base">
        Voir tout <ChevronRight className="h-4 w-4" />
      </Link> : null}
    </div>
  )
}
