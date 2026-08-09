import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (count, error) =>
        !(
          error instanceof Error &&
          'status' in error &&
          (error.status === 401 || error.status === 403 || error.status === 404)
        ) && count < 2,
      refetchOnWindowFocus: true,
    },
  },
})

export const jobKeys = {
  all: ['jobs'] as const,
  member: () => [...jobKeys.all, 'member'] as const,
  detail: (id: string) => [...jobKeys.member(), id] as const,
  admin: () => [...jobKeys.all, 'admin'] as const,
}

export const adminUserKeys = {
  all: ['admin-users'] as const,
  list: (search: string, field: 'email' | 'name', offset: number) =>
    [...adminUserKeys.all, search, field, offset] as const,
}

export function clearProtectedQueries() {
  queryClient.removeQueries({ queryKey: jobKeys.all })
  queryClient.removeQueries({ queryKey: adminUserKeys.all })
}
