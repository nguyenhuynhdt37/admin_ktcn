import { env } from '@/app/config/env'
import { httpClient } from '@/services/http/client'
import type { AdminNotification, NotificationPagination } from '../types'

export const notificationService = {
  list: async (): Promise<NotificationPagination> => {
    const response = await httpClient.get<NotificationPagination>('/admin/notifications', {
      params: { page: 1, page_size: 10 },
    })
    return response.data
  },

  markRead: async (id: string): Promise<AdminNotification> => {
    const response = await httpClient.patch<AdminNotification>(`/admin/notifications/${id}/read`)
    return response.data
  },

  markAllRead: async (): Promise<void> => {
    await httpClient.post('/admin/notifications/read-all')
  },

  streamUrl: `${env.VITE_API_URL}/admin/notifications/stream`,
}
