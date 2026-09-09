import { QueryClient } from '@tanstack/vue-query'

/**
 * Created once here (rather than letting VueQueryPlugin construct its own) so the router's
 * auth guard can share the exact same cache via queryClient.ensureQueryData — a guard running
 * outside component setup has no other way to reach it.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})
