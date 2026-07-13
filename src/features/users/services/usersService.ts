import { httpClient } from '@/services/http/client'
import type { UserDetail, UserCreatePayload } from '../types/users.types'

export const usersService = {
  list: async (params?: Record<string, any>) => {
    const { data } = await httpClient.get('/users', { params })
    return data
  },

  getDetail: async (id: string): Promise<UserDetail> => {
    const { data } = await httpClient.get<UserDetail>(`/users/${id}`)
    return data
  },

  create: async (payload: UserCreatePayload): Promise<UserDetail> => {
    const { data } = await httpClient.post<UserDetail>('/users', payload)
    return data
  },

  update: async (id: string, payload: Partial<UserCreatePayload>): Promise<UserDetail> => {
    const { data } = await httpClient.put<UserDetail>(`/users/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await httpClient.delete<{ success: boolean }>(`/users/${id}`)
    return data
  },

  restore: async (id: string): Promise<UserDetail> => {
    const { data } = await httpClient.post<UserDetail>(`/users/${id}/restore`)
    return data
  },

  uploadAvatar: async (file: File): Promise<{ id: string; name: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{ id: string; name: string }>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  getMediaUrl: async (mediaId: string): Promise<string> => {
    const { data } = await httpClient.get<{ url: string }>(`/admin/media/${mediaId}/url`)
    return data.url
  },

  checkEmail: async (email: string): Promise<{ exists: boolean }> => {
    const { data } = await httpClient.get<{ exists: boolean }>('/users/check-email', {
      params: { email },
    })
    return data
  },

  checkUsername: async (username: string): Promise<{ exists: boolean }> => {
    const { data } = await httpClient.get<{ exists: boolean }>('/users/check-username', {
      params: { username },
    })
    return data
  },
}
