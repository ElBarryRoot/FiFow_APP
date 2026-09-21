import { useQuery } from '@tanstack/react-query'
import { catalogueApi } from '../api/catalogue.js'
import { queryKeys } from '../api/queryKeys.js'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: catalogueApi.categories,
    staleTime: 30 * 60_000,
  })
}

