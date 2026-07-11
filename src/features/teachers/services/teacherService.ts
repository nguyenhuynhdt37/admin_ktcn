import { httpClient } from '@/services/http/client'
import type {
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload,
  UpdateStaffStatusPayload,
  StaffListParams,
  StaffPagination,
  StaffStats,
  AcademicTitle,
  Degree,
} from '../types'

export const teacherService = {
  /** Lấy dữ liệu thống kê giảng viên */
  getStats: async (): Promise<StaffStats> => {
    const response = await httpClient.get<StaffStats>('/admin/staffs/stats')
    return response.data
  },

  /** Lấy danh sách giảng viên (Phân trang & Lọc nâng cao) */
  list: async (params?: StaffListParams): Promise<StaffPagination> => {
    const cleanedParams = params ? { ...params } : {}
    // Clean null/undefined values to prevent sending them as string
    if (cleanedParams.search === null || cleanedParams.search === '') delete cleanedParams.search
    if (cleanedParams.department_id === null || cleanedParams.department_id === '') delete cleanedParams.department_id
    if (cleanedParams.position_id === null || cleanedParams.position_id === '') delete cleanedParams.position_id
    if (cleanedParams.academic_title_id === null || cleanedParams.academic_title_id === 'all') delete cleanedParams.academic_title_id
    if (cleanedParams.degree_id === null || cleanedParams.degree_id === 'all') delete cleanedParams.degree_id
    if (cleanedParams.is_active === null) delete cleanedParams.is_active
    if (cleanedParams.profile_status === null) delete cleanedParams.profile_status
    if (cleanedParams.is_visible === null) delete cleanedParams.is_visible

    const response = await httpClient.get<StaffPagination>('/admin/staffs', { params: cleanedParams })
    const data = response.data as StaffPagination & { total?: number }
    return {
      ...data,
      total_items: data.total_items ?? data.total ?? 0,
      has_next: data.has_next ?? data.page < data.total_pages,
      has_previous: data.has_previous ?? data.page > 1,
    }
  },

  /** Lấy chi tiết giảng viên theo ID */
  getDetail: async (id: string): Promise<Staff> => {
    const response = await httpClient.get<Staff>(`/admin/staffs/${id}`)
    return response.data
  },

  /** Lấy chi tiết giảng viên theo Slug (Portal) */
  getBySlug: async (slug: string): Promise<Staff> => {
    const response = await httpClient.get<Staff>(`/portal/staffs/${slug}`)
    return response.data
  },

  /** Tạo mới hồ sơ giảng viên */
  create: async (payload: CreateStaffPayload): Promise<Staff> => {
    const response = await httpClient.post<Staff>('/admin/staffs', payload)
    return response.data
  },

  /** Cập nhật hồ sơ giảng viên */
  update: async (id: string, payload: UpdateStaffPayload): Promise<Staff> => {
    const response = await httpClient.put<Staff>(`/admin/staffs/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái hoạt động */
  updateStatus: async (id: string, payload: UpdateStaffStatusPayload): Promise<Staff> => {
    const response = await httpClient.put<Staff>(`/admin/staffs/${id}`, payload)
    return response.data
  },

  /** Xóa mềm giảng viên */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/staffs/${id}`)
  },

  /** Tải ảnh đại diện lên máy chủ media */
  uploadAvatar: async (file: File): Promise<{ object_key: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{ object_key: string }>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  /** Lấy danh sách Học hàm cho Admin */
  getAcademicTitles: async (): Promise<AcademicTitle[]> => {
    const response = await httpClient.get<AcademicTitle[]>('/admin/academic-titles')
    return response.data
  },

  /** Lấy danh sách Học vị cho Admin */
  getDegrees: async (): Promise<Degree[]> => {
    const response = await httpClient.get<Degree[]>('/admin/degrees')
    return response.data
  },
}
