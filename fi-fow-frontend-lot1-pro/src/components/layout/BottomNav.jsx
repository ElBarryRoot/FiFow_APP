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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-fifow-border bg-white/95 pb-[calc(var(--safe-bottom)+0.35rem)] pt-2 shadow-[0_-12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-[430px] grid-cols-5 items-end px-3">
        {items.map((item) => (
          <NavLink key={item.label} to={item.to} className={({ isActive }) => cn('flex flex-col items-center justify-end gap-1 text-xs font-bold transition', isActive ? 'text-fifow-primary' : 'text-slate-500')}>
            {item.primary ? (
              <span className="-mt-8 grid h-16 w-16 place-items-center rounded-full border-[6px] border-white bg-fifow-primary text-white shadow-float">
                <item.icon className="h-8 w-8" />
              </span>
            ) : (
              <item.icon className="h-7 w-7" />
            )}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
