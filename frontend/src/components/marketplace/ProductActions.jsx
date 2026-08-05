import { useState } from 'react'
import { CalendarCheck, CalendarDays, Flag, Heart, MessageCircle, Share2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { cn } from '../../lib/utils.js'
import { useFavorites } from '../../lib/favorites.jsx'
import { useToast } from '../../lib/toast.jsx'

export default function ProductActions({ product }) {
  const { isFavorite, toggle } = useFavorites()
  const showToast = useToast()
  const [reserved, setReserved] = useState(false)
  const favorite = isFavorite(product.id)

  function toggleFavorite() {
    const added = toggle(product.id)
    showToast(added ? 'Ajouté à vos favoris' : 'Retiré de vos favoris', { type: added ? 'success' : 'info' })
  }

  function toggleReservation() {
    setReserved((current) => !current)
    showToast(reserved ? 'Réservation annulée' : 'Demande de réservation enregistrée', { type: reserved ? 'info' : 'success' })
  }

  async function shareProduct() {
    const shareData = { title: product.title, text: `${product.title} sur Fi Fow`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else await navigator.clipboard.writeText(window.location.href)
      showToast(navigator.share ? 'Partage ouvert' : 'Lien copié')
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Impossible de partager ce produit', { type: 'error' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button as={Link} to="/messages/conv-1" icon={MessageCircle} size="lg" variant="secondary" className="w-full">
          Contacter
        </Button>
        <Button as={Link} to="/messages/conv-1?intent=buy" icon={ShoppingBag} size="lg" className="w-full">
          Acheter
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <SmallAction icon={Heart} label="Favori" active={favorite} onClick={toggleFavorite} />
        <SmallAction icon={reserved ? CalendarCheck : CalendarDays} label={reserved ? 'Réservé' : 'Réserver'} active={reserved} onClick={toggleReservation} />
        <SmallAction icon={Share2} label="Partager" onClick={shareProduct} />
        <SmallAction as={Link} to={`/report/${product.id}`} icon={Flag} label="Signaler" danger />
      </div>
    </div>
  )
}

function SmallAction({ as: Component = 'button', icon: Icon, label, danger, active, ...props }) {
  const nativeProps = Component === 'button' ? { type: 'button' } : {}
  return (
    <Component
      aria-label={label}
      className={cn(
        'flex h-12 min-w-0 items-center justify-center gap-1 rounded-lg border bg-white px-2 text-xs font-extrabold transition-colors sm:text-sm',
        danger ? 'border-red-100 text-fifow-red hover:bg-red-50' : 'border-fifow-border text-fifow-primary hover:border-violet-200 hover:bg-fifow-lavender',
        active && 'border-fifow-primary bg-fifow-lavender',
      )}
      {...nativeProps}
      {...props}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active && label === 'Favori' && 'fill-fifow-red text-fifow-red')} />
      <span className="hidden xl:inline">{label}</span>
    </Component>
  )
}
