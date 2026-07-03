import { httpClient } from '@/services/http/client'
import type { AuditLogListResponse } from '../types/auditLogs.types'

export const auditLogsService = {
  list: async (params?: Record<string, string>): Promise<AuditLogListResponse> => {
    const { data } = await httpClient.get<AuditLogListResponse>('/admin/audit-logs', { params })
    return data
  },
}
