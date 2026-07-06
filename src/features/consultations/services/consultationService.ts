import { httpClient } from '@/services/http/client'
import type { Consultation, ConsultationPagination, ConsultationUpdatePayload } from '../types'

export const consultationService = {
  /** Lấy danh sách yêu cầu tư vấn phân trang, tìm kiếm, lọc */
  listConsultations: async (params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
    sort_by?: string
    order?: string
  }): Promise<ConsultationPagination> => {
    const response = await httpClient.get('/admin/consultations', { params })
    return response.data
  },

  /** Cập nhật trạng thái, ghi chú và người xử lý */
  updateConsultation: async (id: string, payload: ConsultationUpdatePayload): Promise<Consultation> => {
    const response = await httpClient.patch(`/admin/consultations/${id}`, payload)
    return response.data
  },

  /** Tạo URL để tải file CSV xuất dữ liệu */
  getExportUrl: (search?: string, status?: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    const queryParams = new URLSearchParams()
    if (search) queryParams.append('search', search)
    if (status) queryParams.append('status', status)
    return `${baseUrl}/admin/consultations/export?${queryParams.toString()}`
  }
}
