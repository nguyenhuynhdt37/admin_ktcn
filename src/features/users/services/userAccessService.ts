import { httpClient } from '@/services/http/client'
import type { UserAccessOverview } from '@/features/users/types/accessOverview.types'

export const userAccessService = {
  getAccessOverview: async (userId: string): Promise<UserAccessOverview> => {
    const { data } = await httpClient.get<UserAccessOverview>(
      `/users/${userId}/access-overview`
    )
    return data
  },
}
