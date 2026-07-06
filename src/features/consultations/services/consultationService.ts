import { httpClient } from '@/services/http/client'
import type {
  ConsultationLead,
  ConsultationListParams,
  ConsultationPagination,
  ConsultationStatus,
} from '../types'

export const consultationService = {
  list: async (params: ConsultationListParams): Promise<ConsultationPagination> => {
    const response = await httpClient.get<ConsultationPagination>('/admin/consultations', {
      params,
    })
    return response.data
  },

  update: async (
    id: string,
    payload: { status?: ConsultationStatus; assigned_to_id?: string | null; note?: string }
  ): Promise<ConsultationLead> => {
    const response = await httpClient.patch<ConsultationLead>(
      `/admin/consultations/${id}`,
      payload
    )
    return response.data
  },

  export: async (params: Omit<ConsultationListParams, 'page' | 'page_size'>): Promise<void> => {
    const response = await httpClient.get('/admin/consultations/export', {
      params,
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'danh-sach-tu-van-tuyen-sinh.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  },
}
