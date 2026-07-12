import { httpClient } from '@/services/http/client'
import type { DashboardResponse } from '../types'

export const dashboardService = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const { data } = await httpClient.get<DashboardResponse>('/admin/dashboard')
    return data
  },
}
