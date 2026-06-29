import { httpClient } from '@/services/http/client'
import type {
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload,
  UpdateStaffStatusPayload,
  StaffListParams,
  StaffPagination,
  StaffStats,
} from '../types'

export const teacherService = {
  /** Lấy dữ liệu thống kê giảng viên */
  getStats: async (): Promise<StaffStats> => {
    const response = await httpClient.get<StaffStats>('/staffs/stats')
    return response.data
  },

  /** Lấy danh sách giảng viên (Phân trang & Lọc nâng cao) */
  list: async (params?: StaffListParams): Promise<StaffPagination> => {
    const cleanedParams = params ? { ...params } : {}
    // Clean null/undefined values to prevent sending them as string
    if (cleanedParams.search === null || cleanedParams.search === '') delete cleanedParams.search
    if (cleanedParams.department_id === null || cleanedParams.department_id === '') delete cleanedParams.department_id
    if (cleanedParams.position_id === null || cleanedParams.position_id === '') delete cleanedParams.position_id
    if (cleanedParams.academic_title === null || cleanedParams.academic_title === 'all') delete cleanedParams.academic_title
    if (cleanedParams.degree === null || cleanedParams.degree === 'all') delete cleanedParams.degree
    if (cleanedParams.is_active === null) delete cleanedParams.is_active

    const response = await httpClient.get<StaffPagination>('/staffs', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết giảng viên theo ID */
  getDetail: async (id: string): Promise<Staff> => {
    const response = await httpClient.get<Staff>(`/staffs/${id}`)
    return response.data
  },

  /** Lấy chi tiết giảng viên theo Slug */
  getBySlug: async (slug: string): Promise<Staff> => {
    const response = await httpClient.get<Staff>(`/staffs/slug/${slug}`)
    return response.data
  },

  /** Tạo mới hồ sơ giảng viên */
  create: async (payload: CreateStaffPayload): Promise<Staff> => {
    const response = await httpClient.post<Staff>('/staffs', payload)
    return response.data
  },

  /** Cập nhật hồ sơ giảng viên */
  update: async (id: string, payload: UpdateStaffPayload): Promise<Staff> => {
    const response = await httpClient.put<Staff>(`/staffs/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái hoạt động */
  updateStatus: async (id: string, payload: UpdateStaffStatusPayload): Promise<Staff> => {
    const response = await httpClient.patch<Staff>(`/staffs/${id}/status`, payload)
    return response.data
  },

  /** Xóa mềm giảng viên */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/staffs/${id}`)
  },

  /** Tải ảnh đại diện lên máy chủ media */
  uploadAvatar: async (file: File): Promise<{ object_key: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{ object_key: string }>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },
}
