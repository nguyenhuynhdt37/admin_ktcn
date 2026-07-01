import { httpClient } from '@/services/http/client'
import type {
  Position,
  CreatePositionPayload,
  UpdatePositionPayload,
  PositionListParams,
  PositionPagination,
  PositionStats,
} from '../types'

export const positionService = {
  /** Lấy dữ liệu thống kê chức vụ */
  getStats: async (): Promise<PositionStats> => {
    const response = await httpClient.get('/admin/positions/stats')
    return response.data
  },

  /** Lấy danh sách chức vụ */
  list: async (params?: PositionListParams): Promise<PositionPagination> => {
    // Chuyển đổi các tham số null sang undefined trước khi gửi
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.search === null) delete cleanedParams.search
    if (cleanedParams.is_active === null) delete cleanedParams.is_active
    
    const response = await httpClient.get('/admin/positions', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết chức vụ theo ID */
  getDetail: async (id: string): Promise<Position> => {
    const response = await httpClient.get(`/admin/positions/${id}`)
    return response.data
  },

  /** Tạo chức vụ mới */
  create: async (payload: CreatePositionPayload): Promise<Position> => {
    const response = await httpClient.post('/admin/positions', payload)
    return response.data
  },

  /** Cập nhật chi tiết chức vụ */
  update: async (id: string, payload: UpdatePositionPayload): Promise<Position> => {
    const response = await httpClient.put(`/admin/positions/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái bật/tắt hoạt động */
  updateStatus: async (id: string, payload: { is_active: boolean }): Promise<Position> => {
    const response = await httpClient.put(`/admin/positions/${id}`, payload)
    return response.data
  },

  /** Xóa mềm chức vụ */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/positions/${id}`)
  },

  /** Lấy danh sách giảng viên đang đảm nhiệm các chức vụ này (để cảnh báo trước khi xóa) */
  getStaffsToDelete: async (ids: string[]): Promise<{ id: string; full_name: string; avatar_object_key: string | null; department_name: string; position_id: string }[]> => {
    const response = await httpClient.get('/admin/positions/staffs-to-delete', {
      params: { position_ids: ids.join(',') }
    })
    return response.data
  },
}
