import {
  BadgeCheck,
  Banknote,
  Boxes,
  ClipboardList,
  FileClock,
  Flag,
  FolderTree,
  Gauge,
  Headphones,
  LogOut,
  Menu,
  MessageSquareWarning,
  PackageSearch,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { canAdmin } from '../../auth/adminAccess.js'
import { toUserView } from '../../api/adapters.js'
import { cn } from '../../lib/utils.js'
import Logo from '../ui/Logo.jsx'

const navigation = [
  {
    label: 'Pilotage',
    items: [
      { label: 'Tableau de bord', to: '/admin', icon: Gauge, end: true },
      { label: 'Signalements', to: '/admin/reports', icon: Flag },
      { label: 'Vérifications', to: '/admin/verifications', icon: BadgeCheck },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Annonces', to: '/admin/products', icon: PackageSearch },
      { label: 'Utilisateurs', to: '/admin/users', icon: Users },
      { label: 'Commandes', to: '/admin/orders', icon: ClipboardList },
      { label: 'Avis', to: '/admin/reviews', icon: Star },
      { label: 'Conversations', to: '/admin/conversations', icon: MessageSquareWarning },
      { label: 'Support', to: '/admin/support', icon: Headphones },
    ],
  },
  {
    label: 'Finance',
    capability: 'manageFinance',
    items: [
      { label: 'Paiements', to: '/admin/payments', icon: WalletCards },
      { label: 'Reversements', to: '/admin/payouts', icon: Banknote },
      { label: 'Boosts', to: '/admin/boosts', icon: Zap },
    ],
  },
  {
    label: 'Configuration',
    capability: 'manageCatalogue',
    items: [
      { label: 'Catégories', to: '/admin/categories', icon: FolderTree },
      { label: 'Réglages', to: '/admin/settings', icon: Settings, capability: 'manageSettings' },
      { label: 'Journal d’audit', to: '/admin/logs', icon: FileClock },
    ],
  },
]

const pageNames = {
  '/admin': 'Tableau de bord',
  '/admin/reports': 'Signalements',
  '/admin/verifications': 'Vérifications vendeur',
  '/admin/products': 'Annonces',
  '/admin/users': 'Utilisateurs',
  '/admin/orders': 'Commandes',
  '/admin/reviews': 'Avis',
  '/admin/conversations': 'Conversations signalées',
  '/admin/support': 'Support',
  '/admin/payments': 'Paiements',
  '/admin/payouts': 'Reversements',
  '/admin/boosts': 'Boosts',
  '/admin/categories': 'Catégories',
  '/admin/settings': 'Réglages',
  '/admin/logs': 'Journal d’audit',
}

export default function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const user = toUserView(auth.user)
  const pageName = useMemo(() => {
    const exact = pageNames[location.pathname]
    if (exact) return exact
    const root = Object.keys(pageNames)
      .filter((path) => path !== '/admin')
      .find((path) => location.pathname.startsWith(`${path}/`))
    return pageNames[root] || 'Administration'
  }, [location.pathname])

  async function logout() {
    await auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-fifow-bg text-fifow-dark">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-fifow-border bg-white transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="flex h-[72px] items-center justify-between border-b border-fifow-border px-5">
          <Logo />
          <button type="button" aria-label="Fermer" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg text-fifow-secondary hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-fifow-border px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-fifow-bg p-3">
            <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{user.fullName}</p>
              <p className="truncate text-xs font-bold text-fifow-primary">{roleLabel(user.role)}</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Administration">
          {navigation.map((section) => {
            if (section.capability && !canAdmin(auth.user, section.capability)) return null
            const visibleItems = section.items.filter((item) => !item.capability || canAdmin(auth.user, item.capability))
            if (!visibleItems.length) return null
            return (
              <div key={section.label} className="mb-5">
                <p className="mb-2 px-3 text-[11px] font-black uppercase text-fifow-muted">{section.label}</p>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => cn(
                        'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors',
                        isActive
                          ? 'bg-fifow-lavender text-fifow-primary'
                          : 'text-fifow-secondary hover:bg-slate-100 hover:text-fifow-dark',
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-fifow-border p-3">
          <Link to="/" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-bold text-fifow-secondary hover:bg-slate-100 hover:text-fifow-dark">
            <Store className="h-[18px] w-[18px]" /> Marketplace
          </Link>
          <button type="button" onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-fifow-secondary hover:bg-red-50 hover:text-fifow-red">
            <LogOut className="h-[18px] w-[18px]" /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-fifow-border bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" aria-label="Ouvrir la navigation" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-fifow-border text-fifow-secondary lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase text-fifow-primary">Administration FiFow</p>
            <h1 className="truncate text-lg font-black sm:text-xl">{pageName}</h1>
          </div>
          <span className="hidden items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 sm:inline-flex">
            <ShieldCheck className="h-4 w-4" /> Session sécurisée
          </span>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function roleLabel(role) {
  if (role === 'SUPER_ADMIN') return 'Super administrateur'
  if (role === 'ADMIN') return 'Administrateur'
  return 'Modérateur'
}

