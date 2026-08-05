import { Link } from 'react-router-dom'

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-3 text-fifow-dark">
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fifow-primary to-violet-700 shadow-float">
        <span className="text-3xl font-black italic leading-none text-white">F</span>
        <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-fifow-orange ring-2 ring-white" />
      </span>
      {!compact ? <span className="text-[32px] font-black tracking-[-0.05em]">Fi Fow</span> : null}
    </Link>
  )
}
