import { httpClient } from '@/services/http/client'
import type {
  Position,
  CreatePositionPayload,
  UpdatePositionPayload,
  UpdatePositionStatusPayload,
  PositionListParams,
  PositionPagination,
  PositionStats,
} from '../types'

export const positionService = {
  /** Lấy dữ liệu thống kê chức vụ */
  getStats: async (): Promise<PositionStats> => {
    const response = await httpClient.get('/positions/stats')
    return response.data
  },

  /** Lấy danh sách chức vụ */
  list: async (params?: PositionListParams): Promise<PositionPagination> => {
    // Chuyển đổi các tham số null sang undefined trước khi gửi
    const cleanedParams = params ? { ...params } : {}
    if (cleanedParams.search === null) delete cleanedParams.search
    if (cleanedParams.is_active === null) delete cleanedParams.is_active
    
    const response = await httpClient.get('/positions', { params: cleanedParams })
    return response.data
  },

  /** Lấy chi tiết chức vụ theo ID */
  getDetail: async (id: string): Promise<Position> => {
    const response = await httpClient.get(`/positions/${id}`)
    return response.data
  },

  /** Tạo chức vụ mới */
  create: async (payload: CreatePositionPayload): Promise<Position> => {
    const response = await httpClient.post('/positions', payload)
    return response.data
  },

  /** Cập nhật chi tiết chức vụ */
  update: async (id: string, payload: UpdatePositionPayload): Promise<Position> => {
    const response = await httpClient.put(`/positions/${id}`, payload)
    return response.data
  },

  /** Cập nhật nhanh trạng thái bật/tắt hoạt động */
  updateStatus: async (id: string, payload: UpdatePositionStatusPayload): Promise<Position> => {
    const response = await httpClient.patch(`/positions/${id}/status`, payload)
    return response.data
  },

  /** Xóa mềm chức vụ */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/positions/${id}`)
  },
}
