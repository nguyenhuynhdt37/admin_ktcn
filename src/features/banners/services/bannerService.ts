import { httpClient } from '@/services/http/client'
import type {
  Banner,
  BannerPagination,
  BannerListParams,
  CreateBannerPayload,
  UpdateBannerPayload,
  UpdateBannerStatusPayload,
} from '../types'

export const bannerService = {
  /** Lấy danh sách banner cho Portal (Public, chỉ lấy các banner active & hiệu lực) */
  list: async (params?: { position?: string }): Promise<Banner[]> => {
    const response = await httpClient.get<Banner[]>('/banners', { params })
    return response.data
  },

  /** Lấy danh sách banner phân trang cho Admin (Có bộ lọc tìm kiếm & vị trí) */
  listAdmin: async (params?: BannerListParams): Promise<BannerPagination> => {
    // Làm sạch params
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.search === null || cleanedParams.search === '') delete cleanedParams.search
    if (cleanedParams.position === null || cleanedParams.position === '') delete cleanedParams.position
    
    const response = await httpClient.get<BannerPagination>('/banners/admin', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết banner */
  getDetail: async (id: string): Promise<Banner> => {
    const response = await httpClient.get<Banner>(`/banners/${id}`)
    return response.data
  },

  /** Tạo mới banner */
  create: async (payload: CreateBannerPayload): Promise<Banner> => {
    const response = await httpClient.post<Banner>('/banners', payload)
    return response.data
  },

  /** Cập nhật thông tin banner */
  update: async (id: string, payload: UpdateBannerPayload): Promise<Banner> => {
    const response = await httpClient.put<Banner>(`/banners/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái bật/tắt hoạt động của banner */
  updateStatus: async (id: string, payload: UpdateBannerStatusPayload): Promise<Banner> => {
    const response = await httpClient.patch<Banner>(`/banners/${id}/status`, payload)
    return response.data
  },

  /** Xóa mềm banner */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/banners/${id}`)
  },

  /** Tải ảnh banner (Desktop/Mobile) lên máy chủ media */
  uploadBannerImage: async (file: File): Promise<{ object_key: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await httpClient.post<{ object_key: string }>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
