import { httpClient } from '@/services/http/client'
import type {
  Gallery,
  CreateGalleryPayload,
  UpdateGalleryPayload,
  GalleryPagination,
} from '../types'

export interface GalleryListParams {
  page?: number
  page_size?: number
  department_id?: string
  search?: string
  is_active?: boolean
}

export const galleryService = {
  /** Lấy danh sách Album */
  list: async (params?: GalleryListParams): Promise<GalleryPagination> => {
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.department_id === 'all' || !cleanedParams.department_id) {
      delete cleanedParams.department_id
    }
    if (cleanedParams.search === null || cleanedParams.search === '') delete cleanedParams.search
    if (cleanedParams.is_active === undefined || cleanedParams.is_active === null) delete cleanedParams.is_active

    const response = await httpClient.get('/admin/galleries', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết Album */
  getDetail: async (id: string): Promise<Gallery> => {
    const response = await httpClient.get(`/admin/galleries/${id}`)
    return response.data
  },

  /** Tạo Album mới */
  create: async (payload: CreateGalleryPayload): Promise<Gallery> => {
    const response = await httpClient.post('/admin/galleries', payload)
    return response.data
  },

  /** Cập nhật Album */
  update: async (id: string, payload: UpdateGalleryPayload): Promise<Gallery> => {
    const response = await httpClient.put(`/admin/galleries/${id}`, payload)
    return response.data
  },

  /** Cập nhật trạng thái Album */
  updateStatus: async (id: string, payload: { is_active: boolean }): Promise<Gallery> => {
    const response = await httpClient.put(`/admin/galleries/${id}`, payload)
    return response.data
  },

  /** Xóa Album */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/galleries/${id}`)
  },
}
