import { httpClient } from '@/services/http/client'
import type {
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
  TagListParams,
  TagPagination,
} from '../types'

export const tagService = {
  /** Lấy danh sách tag (phân trang) */
  list: async (params?: TagListParams): Promise<TagPagination> => {
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.search === null) delete cleanedParams.search
    if (cleanedParams.is_active === null) delete cleanedParams.is_active

    const response = await httpClient.get('/admin/tags', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết tag theo ID */
  getDetail: async (id: string): Promise<Tag> => {
    const response = await httpClient.get(`/admin/tags/${id}`)
    return response.data
  },

  /** Tạo tag mới */
  create: async (payload: CreateTagPayload): Promise<Tag> => {
    const response = await httpClient.post('/admin/tags', payload)
    return response.data
  },

  /** Cập nhật chi tiết tag */
  update: async (id: string, payload: UpdateTagPayload): Promise<Tag> => {
    const response = await httpClient.put(`/admin/tags/${id}`, payload)
    return response.data
  },

  /** Bật/tắt trạng thái hoạt động */
  updateStatus: async (id: string, payload: { is_active: boolean }): Promise<Tag> => {
    const response = await httpClient.patch(`/admin/tags/${id}/status`, payload)
    return response.data
  },

  /** Xóa tag */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/tags/${id}`)
  },

  /** Kiểm tra trùng lặp slug */
  checkSlug: async (slug: string, excludeId?: string | null, lang: string = 'vi'): Promise<{ exists: boolean; suggested_slug: string }> => {
    const response = await httpClient.get('/admin/tags/check-slug', {
      params: {
        slug,
        exclude_id: excludeId || undefined,
        lang,
      },
    })
    return response.data
  },
}
