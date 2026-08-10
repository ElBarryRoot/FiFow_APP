import { ArrowLeft, Bell, Heart, MailWarning, MapPin, MessageCircle, Plus, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { conversationsApi } from '../../api/conversations.js'
import { notificationsApi } from '../../api/notifications.js'
import { queryKeys } from '../../api/queryKeys.js'
import { toUserView } from '../../api/adapters.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { authApi } from '../../api/auth.js'
import { errorMessage } from '../../api/errors.js'
import { useToast } from '../../lib/toast.jsx'
import Button from '../ui/Button.jsx'
import IconButton from '../ui/IconButton.jsx'
import Logo from '../ui/Logo.jsx'
import SearchBar from '../marketplace/SearchBar.jsx'

export default function AppHeader({
  connected = false,
  showBack = false,
  title,
  onBack,
  showSearch = true,
  onFilters,
  searchDefaultValue = '',
  onSearch,
  mobileSearch = showSearch,
  showPublish = true,
}) {
  const auth = useAuth()
  const showToast = useToast()
  const [resending, setResending] = useState(false)
  const isConnected = auth.isAuthenticated
  const currentUser = toUserView(auth.user)
  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversationList,
    queryFn: () => conversationsApi.list({ limit: 20, userId: auth.user.id }),
    enabled: isConnected && !auth.requiresEmailVerification,
    staleTime: 15_000,
  })
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notificationList,
    queryFn: () => notificationsApi.list({ limit: 30 }),
    enabled: isConnected,
    staleTime: 15_000,
  })
  const messagesCount = conversationsQuery.data?.unreadCount || 0
  const notificationsCount = notificationsQuery.data?.unreadCount || 0

  async function resendVerification() {
    setResending(true)
    try {
      const response = await authApi.resendVerification()
      showToast(response.message)
    } catch (error) {
      showToast(errorMessage(error, 'Envoi impossible.'), { type: 'error' })
    } finally {
      setResending(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-fifow-border/80 bg-white/95 backdrop-blur-xl">
      <div className="marketplace-container">
        <div className="flex min-h-16 items-center gap-2.5 lg:min-h-[68px] lg:gap-4">
          {showBack ? (
            <button onClick={onBack} aria-label="Retour" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-fifow-border bg-white text-fifow-dark transition hover:bg-slate-50">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}

          {title ? (
            <div className="hidden sm:block"><Logo /></div>
          ) : (
            <>
              <div className="sm:hidden"><Logo compact /></div>
              <div className="hidden sm:block"><Logo /></div>
            </>
          )}
          {title ? <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold text-fifow-dark sm:hidden">{title}</h1> : null}

          <nav className="hidden shrink-0 items-center gap-1 lg:flex" aria-label="Navigation principale">
            <NavLink to="/products" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold transition hover:bg-slate-100 hover:text-fifow-dark ${isActive ? 'bg-fifow-lavender text-fifow-primary' : 'text-fifow-secondary'}`}>Explorer</NavLink>
            <NavLink to="/products/new" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold transition hover:bg-slate-100 hover:text-fifow-dark ${isActive ? 'bg-fifow-lavender text-fifow-primary' : 'text-fifow-secondary'}`}>Vendre</NavLink>
          </nav>

          {showSearch ? (
            <div className="hidden min-w-0 flex-1 lg:block">
              <SearchBar compact className="mx-auto max-w-2xl" defaultValue={searchDefaultValue} onSubmit={onSearch} />
            </div>
          ) : <div className="hidden flex-1 lg:block" />}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link to={currentUser?.commune ? `/products?location=${encodeURIComponent(currentUser.commune)}` : '/products'} className="hidden h-10 items-center gap-2 rounded-lg border border-fifow-border bg-white px-3 text-sm font-bold text-fifow-dark transition hover:border-violet-200 hover:bg-fifow-lavender sm:flex">
              <MapPin className="h-4 w-4 text-fifow-primary" />
              <span className="hidden xl:inline">{currentUser?.commune || 'Guinée'}</span>
            </Link>

            {isConnected ? (
              <>
                <IconButton as={Link} to="/favorites" icon={Heart} label="Favoris" className="hidden sm:inline-flex" />
                <IconButton as={Link} to="/messages" icon={MessageCircle} label="Messages" badge={messagesCount} />
                <IconButton as={Link} to="/notifications" icon={Bell} label="Notifications" badge={notificationsCount} />
                {showPublish ? (
                  <Button as={Link} to="/products/new" size="sm" icon={Plus} className="hidden xl:inline-flex">Publier</Button>
                ) : null}
                <Link to="/profile" aria-label="Ouvrir le profil" className="flex h-10 items-center gap-2 rounded-lg border border-fifow-border bg-white p-1 pr-2.5 transition hover:border-violet-200">
                  <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <span className="hidden text-sm font-extrabold text-fifow-dark xl:inline">{currentUser.shortName}</span>
                </Link>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Connexion</Button>
                <Button as={Link} to="/login" size="sm" icon={Plus} aria-label="Publier une annonce" className="w-11 px-0 sm:w-auto sm:px-4">
                  <span className="hidden sm:inline">Publier</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {showSearch && mobileSearch ? (
          <div className="pb-3 lg:hidden">
            <SearchBar actionIcon={SlidersHorizontal} onAction={onFilters} defaultValue={searchDefaultValue} onSubmit={onSearch} />
          </div>
        ) : null}
        {isConnected && auth.requiresEmailVerification ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 bg-amber-50 px-3 py-2.5 text-sm sm:px-4">
            <p className="flex items-center gap-2 font-bold text-amber-900"><MailWarning className="h-4 w-4" /> Vérifiez votre email pour publier, négocier et envoyer des messages.</p>
            <button type="button" onClick={resendVerification} disabled={resending} className="font-black text-fifow-primary hover:underline disabled:opacity-50">
              {resending ? 'Envoi…' : 'Renvoyer le lien'}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
