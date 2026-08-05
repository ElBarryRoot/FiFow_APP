import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import IconButton from '../ui/IconButton.jsx'
import { cn } from '../../lib/utils.js'

export default function SearchBar({
  placeholder = 'Rechercher un produit, une marque...',
  actionIcon: ActionIcon,
  onAction,
  onSubmit,
  value,
  defaultValue = '',
  onChange,
  className,
  compact = false,
}) {
  const navigate = useNavigate()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const query = value ?? internalValue

  useEffect(() => {
    if (value === undefined) setInternalValue(defaultValue)
  }, [defaultValue, value])

  function updateValue(nextValue) {
    if (value === undefined) setInternalValue(nextValue)
    onChange?.(nextValue)
  }

  function submit(event) {
    event.preventDefault()
    const normalized = query.trim()
    if (onSubmit) {
      onSubmit(normalized)
      return
    }
    navigate(normalized ? `/products?q=${encodeURIComponent(normalized)}` : '/products')
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-fifow-border bg-white px-3 transition duration-200 focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100',
        compact ? 'h-11' : 'h-14 shadow-card',
        className,
      )}
    >
      <button type="submit" aria-label="Lancer la recherche" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-fifow-muted transition hover:bg-fifow-lavender hover:text-fifow-primary">
        <Search className="h-5 w-5" />
      </button>
      <input
        value={query}
        onChange={(event) => updateValue(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-fifow-dark outline-none placeholder:text-fifow-muted"
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {ActionIcon ? (
        <>
          <span className="h-7 w-px bg-fifow-border" />
          <IconButton
            icon={ActionIcon}
            label="Ouvrir les filtres"
            onClick={onAction}
            className="h-9 w-9 border-0 bg-transparent shadow-none"
          />
        </>
      ) : null}
    </form>
  )
}
