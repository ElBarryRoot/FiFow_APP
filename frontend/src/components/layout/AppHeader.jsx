import { ArrowLeft, Bell, Heart, MapPin, MessageCircle, Plus, SlidersHorizontal } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import IconButton from '../ui/IconButton.jsx'
import Logo from '../ui/Logo.jsx'
import SearchBar from '../marketplace/SearchBar.jsx'
import { currentUser } from '../../data/user.js'

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
  return (
    <header className="sticky top-0 z-40 border-b border-fifow-border/80 bg-white/95 backdrop-blur-xl">
      <div className="marketplace-container">
        <div className="flex min-h-[72px] items-center gap-3 lg:gap-5">
          {showBack ? (
            <button onClick={onBack} aria-label="Retour" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-fifow-border bg-white text-fifow-dark transition hover:bg-slate-50 lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div className={title ? 'hidden sm:block' : ''}><Logo /></div>
          {title ? <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold text-fifow-dark sm:hidden">{title}</h1> : null}

          <nav className="hidden shrink-0 items-center gap-1 lg:flex">
            <NavLink to="/products" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold transition hover:bg-slate-100 hover:text-fifow-dark ${isActive ? 'bg-fifow-lavender text-fifow-primary' : 'text-fifow-secondary'}`}>Explorer</NavLink>
            <NavLink to="/products/new" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold transition hover:bg-slate-100 hover:text-fifow-dark ${isActive ? 'bg-fifow-lavender text-fifow-primary' : 'text-fifow-secondary'}`}>Vendre</NavLink>
          </nav>

          {showSearch ? (
            <div className="hidden min-w-0 flex-1 lg:block">
              <SearchBar compact className="mx-auto max-w-2xl" defaultValue={searchDefaultValue} onSubmit={onSearch} />
            </div>
          ) : <div className="hidden flex-1 lg:block" />}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link to="/products?location=Conakry" className="hidden h-11 items-center gap-2 rounded-lg border border-fifow-border bg-white px-3 text-sm font-bold text-fifow-dark transition hover:border-violet-200 hover:bg-fifow-lavender sm:flex">
              <MapPin className="h-4 w-4 text-fifow-primary" />
              <span className="hidden xl:inline">Conakry</span>
            </Link>

            {connected ? (
              <>
                <IconButton as={Link} to="/favorites" icon={Heart} label="Favoris" className="hidden sm:inline-flex" />
                <IconButton as={Link} to="/messages" icon={MessageCircle} label="Messages" badge={currentUser.messagesCount} />
                <IconButton as={Link} to="/notifications" icon={Bell} label="Notifications" badge={currentUser.notificationsCount} className="hidden sm:inline-flex" />
                {showPublish ? (
                  <Button as={Link} to="/products/new" size="sm" icon={Plus} className="hidden xl:inline-flex">Publier</Button>
                ) : null}
                <Link to="/profile" aria-label="Ouvrir le profil" className="flex h-11 items-center gap-2 rounded-lg border border-fifow-border bg-white p-1.5 pr-2.5 transition hover:border-violet-200">
                  <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full" />
                  <span className="hidden text-sm font-extrabold text-fifow-dark xl:inline">{currentUser.name}</span>
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
      </div>
    </header>
  )
}
