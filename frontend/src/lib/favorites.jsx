import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { catalogueApi } from '../api/catalogue.js'
import { queryKeys } from '../api/queryKeys.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { useToast } from './toast.jsx'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: catalogueApi.favorites,
    enabled: auth.isAuthenticated,
  })
  const [ids, setIds] = useState(() => new Set())

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setIds(new Set())
      return
    }
    if (favoritesQuery.data) setIds(new Set(favoritesQuery.data.map((product) => product.id)))
  }, [auth.isAuthenticated, favoritesQuery.data])

  const mutation = useMutation({
    mutationFn: ({ id, added }) => added ? catalogueApi.favorite(id) : catalogueApi.unfavorite(id),
    onError(_error, variables) {
      setIds((current) => {
        const next = new Set(current)
        if (variables.added) next.delete(variables.id)
        else next.add(variables.id)
        return next
      })
      showToast('Impossible de modifier ce favori.', { type: 'error' })
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites })
    },
  })

  const toggle = useCallback((id) => {
    if (!auth.isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return null
    }
    const added = !ids.has(id)
    setIds((current) => {
      const next = new Set(current)
      if (added) next.add(id)
      else next.delete(id)
      return next
    })
    mutation.mutate({ id, added })
    return added
  }, [auth.isAuthenticated, ids, location, mutation, navigate])

  const isFavorite = useCallback((id) => ids.has(id), [ids])
  const value = useMemo(() => ({
    ids,
    products: favoritesQuery.data || [],
    loading: favoritesQuery.isLoading,
    error: favoritesQuery.error,
    refetch: favoritesQuery.refetch,
    toggle,
    isFavorite,
  }), [ids, favoritesQuery.data, favoritesQuery.isLoading, favoritesQuery.error, favoritesQuery.refetch, toggle, isFavorite])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites doit être utilisé dans FavoritesProvider.')
  return context
}
