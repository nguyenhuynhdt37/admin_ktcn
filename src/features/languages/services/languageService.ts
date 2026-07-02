import { httpClient } from '@/services/http/client'
import type { Language, LanguageCreateInput, LanguageUpdateInput } from '../types'

export const languageService = {
  /** Lấy danh sách ngôn ngữ cho portal (public) */
  getPortalLanguages: async (): Promise<Language[]> => {
    const response = await httpClient.get<Language[]>('/portal/languages')
    return response.data
  },

  /** Lấy danh sách tất cả ngôn ngữ (Admin) */
  getLanguages: async (showDeleted = false): Promise<Language[]> => {
    const response = await httpClient.get<Language[]>('/admin/languages', {
      params: { show_deleted: showDeleted }
    })
    return response.data
  },

  getLanguageById: async (id: string): Promise<Language> => {
    const response = await httpClient.get<Language>(`/admin/languages/${id}`)
    return response.data
  },

  createLanguage: async (data: LanguageCreateInput): Promise<Language> => {
    const response = await httpClient.post<Language>('/admin/languages', data)
    return response.data
  },

  updateLanguage: async (id: string, data: LanguageUpdateInput): Promise<Language> => {
    const response = await httpClient.put<Language>(`/admin/languages/${id}`, data)
    return response.data
  },

  enableLanguage: async (id: string): Promise<Language> => {
    const response = await httpClient.patch<Language>(`/admin/languages/${id}/enable`)
    return response.data
  },

  disableLanguage: async (id: string): Promise<Language> => {
    const response = await httpClient.patch<Language>(`/admin/languages/${id}/disable`)
    return response.data
  },

  setDefaultLanguage: async (id: string): Promise<Language> => {
    const response = await httpClient.patch<Language>(`/admin/languages/${id}/set-default`)
    return response.data
  },

  deleteLanguage: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/languages/${id}`)
  },

  restoreLanguage: async (id: string): Promise<Language> => {
    const response = await httpClient.patch<Language>(`/admin/languages/${id}/restore`)
    return response.data
  },

  reorderLanguages: async (payload: { id: string; sort_order: number }[]): Promise<{ success: boolean; reordered: number }> => {
    const response = await httpClient.put('/admin/languages/reorder', { items: payload })
    return response.data
  },

  uploadFlag: async (file: File): Promise<{ id: string; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await httpClient.post<{ id: string; name: string }>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const urlRes = await httpClient.get<{ url: string }>(`/admin/media/${uploadRes.data.id}/url`)
    return {
      id: uploadRes.data.id,
      url: urlRes.data.url
    }
  }
}
export default languageService
