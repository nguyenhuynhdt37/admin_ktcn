import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
    staleTime: 60_000,        // Cache 1 phút
    refetchInterval: 120_000, // Auto-refresh mỗi 2 phút
  })
}
