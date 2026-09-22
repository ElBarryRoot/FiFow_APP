import { Heart, Home, LogIn, Menu, MessageCircle, Plus, Search, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { cn } from '../../lib/utils.js'

const connectedItems = [
  { label: 'Accueil', to: '/connected', icon: Home },
  { label: 'Recherche', to: '/products', icon: Search },
  { label: 'Publier', to: '/products/new', icon: Plus, primary: true },
  { label: 'Messages', to: '/messages', icon: MessageCircle },
  { label: 'Profil', to: '/profile', icon: User },
]

const guestItems = [
  { label: 'Accueil', to: '/', icon: Home },
  { label: 'Recherche', to: '/products', icon: Search },
  { label: 'Publier', to: '/login', icon: Plus, primary: true },
  { label: 'Connexion', to: '/login', icon: LogIn },
  { label: 'Menu', to: '/menu', icon: Menu },
]

export default function BottomNav() {
  const auth = useAuth()
  const items = auth.isAuthenticated ? connectedItems : guestItems
  return (
    <nav aria-label="Navigation mobile" className="fixed inset-x-2 bottom-2 z-50 overflow-visible rounded-[22px] border border-white/80 bg-white/90 pb-[calc(var(--safe-bottom)+0.35rem)] pt-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:inset-x-4 lg:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-5 items-end px-1">
        {items.map((item) => (
          <NavLink key={item.label} to={item.to} className={({ isActive }) => cn('group flex min-h-12 flex-col items-center justify-end gap-0.5 rounded-xl pb-0.5 text-[10px] font-extrabold tracking-[-0.01em] transition duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200', isActive ? 'text-fifow-primary' : 'text-slate-500 active:text-fifow-primary')}>
            {item.primary ? (
              <span className="-mt-9 grid h-[62px] w-[62px] place-items-center rounded-[22px] border-[5px] border-fifow-bg bg-gradient-to-br from-[#7857ea] to-fifow-primary text-white shadow-[0_12px_24px_rgba(90,53,214,0.38)] transition duration-200 group-active:scale-95">
                <item.icon className="h-7 w-7 stroke-[2.5]" />
              </span>
            ) : (
              <span className="grid h-8 w-11 place-items-center rounded-xl transition duration-200 group-aria-[current=page]:bg-fifow-lavender">
                <item.icon className="h-[21px] w-[21px] transition duration-200 group-hover:scale-105" />
              </span>
            )}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
