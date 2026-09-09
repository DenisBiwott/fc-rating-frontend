import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export interface CurrentUser {
  id: string
  name: string
  role: 'admin' | 'recorder' | 'viewer'
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data, response } = await apiClient.GET('/auth/me')
  if (response.status === 401) return null
  if (!data) throw new Error(`GET /auth/me failed with status ${response.status}`)
  return data.user
}

export const currentUserQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: fetchCurrentUser,
  staleTime: 5 * 60 * 1000,
})

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (password: string) => {
      // openapi.json only documents login's 200 response, so openapi-fetch types this as
      // always-succeeds and narrows `error`/`response` to `never` on any other branch. Cast to a
      // permissive shape rather than fight that — a real 401/422 (wrong password, bad body) still
      // happens at runtime; the contract just doesn't model it yet.
      const result = (await apiClient.POST('/auth/login', { body: { password } })) as {
        data?: { user: CurrentUser }
        error?: { detail?: string; title?: string }
        response: Response
      }
      if (!result.data) {
        throw new Error(
          result.error?.detail ??
            result.error?.title ??
            `Login failed (${result.response.status})`,
        )
      }
      return result.data.user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryOptions.queryKey, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.POST('/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryOptions.queryKey, null)
    },
  })
}
