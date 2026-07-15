import { httpClient } from '@/services/http/client'
import type {
  Program,
  ProgramAcademicProfileInput,
  ProgramPagination,
  ProgramUpdatePayload,
} from '../types'

export const programService = {
  list: async (params?: { page?: number; page_size?: number; search?: string }) => {
    const response = await httpClient.get<ProgramPagination>('/admin/programs', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await httpClient.get<Program>(`/admin/programs/${id}`)
    return response.data
  },

  update: async (id: string, payload: ProgramUpdatePayload) => {
    const response = await httpClient.put<Program>(`/admin/programs/${id}`, payload)
    return response.data
  },

  getAcademicProfile: async (id: string) => {
    const response = await httpClient.get<ProgramAcademicProfileInput>(
      `/admin/programs/${id}/academic-profile`,
    )
    return response.data
  },

  updateAcademicProfile: async (id: string, payload: ProgramAcademicProfileInput) => {
    const response = await httpClient.put(
      `/admin/programs/${id}/academic-profile`,
      payload,
    )
    return response.data
  },
}
