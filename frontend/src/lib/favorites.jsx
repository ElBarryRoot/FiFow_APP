import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { favoriteListings } from '../data/clientPortal.js'

const FavoritesContext = createContext(null)

const initialIds = favoriteListings.map((item) => item.id)

function getInitialFavorites() {
  try {
    const stored = window.localStorage.getItem('fifow:favorites')
    return new Set(stored ? JSON.parse(stored) : initialIds)
  } catch {
    return new Set(initialIds)
  }
}

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(getInitialFavorites)

  useEffect(() => {
    window.localStorage.setItem('fifow:favorites', JSON.stringify([...ids]))
  }, [ids])

  const toggle = useCallback((id) => {
    let added = true
    setIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
        added = false
      } else {
        next.add(id)
      }
      return next
    })
    return added
  }, [])

  const isFavorite = useCallback((id) => ids.has(id), [ids])

  const value = useMemo(() => ({ ids, toggle, isFavorite }), [ids, toggle, isFavorite])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
