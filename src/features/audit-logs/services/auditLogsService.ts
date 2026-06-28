import { httpClient } from '@/services/http/client'
import type { AuditLogListResponse } from '../types/auditLogs.types'

export const auditLogsService = {
  list: async (params?: Record<string, string>): Promise<AuditLogListResponse> => {
    const { data } = await httpClient.get<AuditLogListResponse>('/audit-logs', { params })
    return data
  },
}
