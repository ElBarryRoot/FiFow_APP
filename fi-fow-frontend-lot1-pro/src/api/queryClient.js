import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 1
      },
    },
    mutations: { retry: false },
  },
})

