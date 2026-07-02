import { httpClient } from '@/services/http/client'
import type {
  AISettings,
  AIPlaygroundRequest,
  AIPlaygroundResponse,
  AILogListResponse,
  AISpendResponse,
  AIEmbeddingPlaygroundRequest,
  AIEmbeddingPlaygroundResponse,
} from '../types'

export const aiHubService = {
  getAISettings: async (): Promise<AISettings> => {
    const response = await httpClient.get<AISettings>('/ai-hub/models')
    return response.data
  },

  updateAISettings: async (
    activeModel?: string,
    activeEmbeddingModel?: string
  ): Promise<{ message: string }> => {
    const payload: Record<string, any> = {}
    if (activeModel !== undefined) payload.active_model = activeModel
    if (activeEmbeddingModel !== undefined) payload.active_embedding_model = activeEmbeddingModel

    const response = await httpClient.post<{ message: string }>('/ai-hub/settings', payload)
    return response.data
  },

  getAILogs: async (
    page = 1,
    pageSize = 10,
    model?: string,
    status?: string,
    userId?: string,
    modelType?: string
  ): Promise<AILogListResponse> => {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
    }
    if (model) params.model = model
    if (status) params.status = status
    if (userId) params.user_id = userId
    if (modelType) params.model_type = modelType

    const response = await httpClient.get<AILogListResponse>('/ai-hub/logs', { params })
    return response.data
  },

  getAISpend: async (period = 'day', modelType?: string): Promise<AISpendResponse> => {
    const params: Record<string, any> = { period }
    if (modelType) params.model_type = modelType

    const response = await httpClient.get<AISpendResponse>('/ai-hub/spend', { params })
    return response.data
  },

  callPlayground: async (payload: AIPlaygroundRequest): Promise<AIPlaygroundResponse> => {
    const response = await httpClient.post<AIPlaygroundResponse>('/ai-hub/playground', payload)
    return response.data
  },

  callEmbeddingPlayground: async (
    payload: AIEmbeddingPlaygroundRequest
  ): Promise<AIEmbeddingPlaygroundResponse> => {
    const response = await httpClient.post<AIEmbeddingPlaygroundResponse>(
      '/ai-hub/embedding-playground',
      payload
    )
    return response.data
  },
}
export default aiHubService
