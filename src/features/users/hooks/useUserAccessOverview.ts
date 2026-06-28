import { useQuery } from '@tanstack/react-query'
import { userAccessService } from '@/features/users/services/userAccessService'

export function useUserAccessOverview(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['users', userId, 'access-overview'],
    queryFn: () => userAccessService.getAccessOverview(userId),
    enabled: !!userId && enabled,
    staleTime: 30_000,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 403/404
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404) return false
      return failureCount < 2
    },
  })
}
