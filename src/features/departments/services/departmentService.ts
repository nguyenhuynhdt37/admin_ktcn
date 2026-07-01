import { httpClient } from '@/services/http/client'
import type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  UpdateDepartmentStatusPayload,
  DepartmentListParams,
  DepartmentPagination,
  DepartmentStats,
} from '../types'

export const departmentService = {
  /** Lấy dữ liệu thống kê bộ môn */
  getStats: async (): Promise<DepartmentStats> => {
    const response = await httpClient.get('/admin/departments/stats')
    return response.data
  },

  /** Lấy danh sách bộ môn */
  list: async (params?: DepartmentListParams): Promise<DepartmentPagination> => {
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.search === null) delete cleanedParams.search
    if (cleanedParams.is_active === null) delete cleanedParams.is_active

    const response = await httpClient.get('/admin/departments', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết bộ môn theo ID */
  getDetail: async (id: string): Promise<Department> => {
    const response = await httpClient.get(`/admin/departments/${id}`)
    return response.data
  },

  /** Tạo bộ môn mới */
  create: async (payload: CreateDepartmentPayload): Promise<Department> => {
    const response = await httpClient.post('/admin/departments', payload)
    return response.data
  },

  /** Cập nhật chi tiết bộ môn */
  update: async (id: string, payload: UpdateDepartmentPayload): Promise<Department> => {
    const response = await httpClient.put(`/admin/departments/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái bật/tắt hoạt động */
  updateStatus: async (id: string, payload: { is_active: boolean }): Promise<Department> => {
    const response = await httpClient.put(`/admin/departments/${id}`, payload)
    return response.data
  },

  /** Xóa mềm bộ môn */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/departments/${id}`)
  },

  /** Lấy danh sách giảng viên sẽ bị xóa liên đới khi xóa bộ môn */
  getStaffsToDelete: async (ids: string[]): Promise<{ id: string; full_name: string; avatar_object_key: string | null; position_name: string; department_id: string }[]> => {
    const response = await httpClient.get('/admin/departments/staffs-to-delete', {
      params: { department_ids: ids.join(',') }
    })
    return response.data
  },
}
