import { httpClient } from '@/services/http/client'
import type {
  AISettings,
  AISettingsUpdatePayload,
  AITestConnectionPayload,
  AITestConnectionResponse,
  AIModelPricing,
  AIUsageLog,
  SEOGeneratePayload,
  SEOGenerateResponse,
  AISpendingByModelResponse,
} from '../types'

export const aiSettingsService = {
  // Lấy cấu hình AI hiện tại (theo setting_type)
  getSettings: async (settingType: string = 'text'): Promise<AISettings> => {
    const response = await httpClient.get('/ai/settings', {
      params: { setting_type: settingType },
    })
    return response.data
  },

  // Cập nhật cấu hình AI (payload chứa setting_type)
  updateSettings: async (payload: AISettingsUpdatePayload): Promise<AISettings> => {
    const response = await httpClient.put('/ai/settings', payload)
    return response.data
  },

  // Kiểm thử kết nối AI (payload chứa setting_type)
  testConnection: async (payload: AITestConnectionPayload): Promise<AITestConnectionResponse> => {
    const response = await httpClient.post('/ai/test-connection', payload)
    return response.data
  },

  // Lấy bảng đơn giá Model
  getPricing: async (settingType?: string): Promise<AIModelPricing[]> => {
    const response = await httpClient.get('/ai/pricing', {
      params: settingType ? { setting_type: settingType } : {}
    })
    return response.data
  },

  // Lấy Nhật ký sử dụng AI (chung)
  getUsageLogs: async (params?: { limit?: number; offset?: number }): Promise<AIUsageLog[]> => {
    const response = await httpClient.get('/ai/usage-logs', { params })
    return response.data
  },

  // Lấy thống kê chi phí theo từng Model AI (theo setting_type)
  getSpendingByModel: async (settingType: string = 'text'): Promise<AISpendingByModelResponse[]> => {
    const response = await httpClient.get('/ai/spending-by-model', {
      params: { setting_type: settingType },
    })
    return response.data
  },

  // Gọi trợ lý sinh SEO (luôn dùng setting_type=text ở BE)
  generateSEO: async (payload: SEOGeneratePayload): Promise<SEOGenerateResponse> => {
    const response = await httpClient.post('/ai/generate-seo', payload)
    return response.data
  },
}
