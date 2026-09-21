import Card from '../ui/Card.jsx'

export default function HumanStatCard({ label, value, helper, tone = 'violet' }) {
  const tones = {
    violet: 'from-fifow-lavender to-white text-fifow-primary',
    orange: 'from-orange-50 to-white text-fifow-orange',
    green: 'from-emerald-50 to-white text-fifow-green',
    blue: 'from-blue-50 to-white text-fifow-blue',
  }

  return (
    <Card className={`bg-gradient-to-br ${tones[tone]} p-4`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-black text-fifow-dark">{label}</p>
      {helper ? <p className="mt-1 text-xs font-bold text-fifow-secondary">{helper}</p> : null}
    </Card>
  )
}
