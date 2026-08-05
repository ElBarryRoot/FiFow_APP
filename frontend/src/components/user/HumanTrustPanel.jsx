import { CheckCircle2, ShieldCheck } from 'lucide-react'
import Card from '../ui/Card.jsx'

export default function HumanTrustPanel({ title = 'Pourquoi c’est rassurant', text, items = [] }) {
  return (
    <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-white via-fifow-lavender/50 to-white p-5">
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-fifow-primary shadow-card">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <div>
          <h3 className="font-black text-fifow-dark">{title}</h3>
          {text ? <p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{text}</p> : null}
        </div>
      </div>
      {items.length ? (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div key={item.label ?? item} className="flex items-center gap-2 text-sm font-bold text-fifow-secondary">
              <CheckCircle2 className="h-4 w-4 text-fifow-green" />
              <span>{item.label ?? item}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
