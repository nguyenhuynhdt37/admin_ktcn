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
    const response = await httpClient.get('/departments/stats')
    return response.data
  },

  /** Lấy danh sách bộ môn */
  list: async (params?: DepartmentListParams): Promise<DepartmentPagination> => {
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.search === null) delete cleanedParams.search
    if (cleanedParams.is_active === null) delete cleanedParams.is_active

    const response = await httpClient.get('/departments', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết bộ môn theo ID */
  getDetail: async (id: string): Promise<Department> => {
    const response = await httpClient.get(`/departments/${id}`)
    return response.data
  },

  /** Tạo bộ môn mới */
  create: async (payload: CreateDepartmentPayload): Promise<Department> => {
    const response = await httpClient.post('/departments', payload)
    return response.data
  },

  /** Cập nhật chi tiết bộ môn */
  update: async (id: string, payload: UpdateDepartmentPayload): Promise<Department> => {
    const response = await httpClient.put(`/departments/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái bật/tắt hoạt động */
  updateStatus: async (id: string, payload: UpdateDepartmentStatusPayload): Promise<Department> => {
    const response = await httpClient.patch(`/departments/${id}/status`, payload)
    return response.data
  },

  /** Xóa mềm bộ môn */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/departments/${id}`)
  },
}
