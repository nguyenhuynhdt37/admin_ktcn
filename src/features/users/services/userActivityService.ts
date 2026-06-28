import { httpClient } from '@/services/http/client'
import type {
  UserSession,
  LoginHistoryResponse,
  LockUnlockResponse,
  RevokeAllResponse,
  AnomaliesResponse,
} from '@/features/users/types/userActivity.types'

const BASE = (id: string) => `/users/${id}`

export const userActivityService = {
  getSessions: (userId: string): Promise<UserSession[]> =>
    httpClient.get(`${BASE(userId)}/sessions`).then((r) => r.data),

  getLoginHistory: (
    userId: string,
    params: { page?: number; page_size?: number; status?: string }
  ): Promise<LoginHistoryResponse> =>
    httpClient.get(`${BASE(userId)}/login-history`, { params }).then((r) => r.data),

  revokeSession: (userId: string, sessionId: string): Promise<{ success: boolean }> =>
    httpClient.post(`${BASE(userId)}/sessions/${sessionId}/revoke`).then((r) => r.data),

  revokeAllSessions: (userId: string): Promise<RevokeAllResponse> =>
    httpClient.post(`${BASE(userId)}/sessions/revoke-all`).then((r) => r.data),

  lockUser: (userId: string): Promise<LockUnlockResponse> =>
    httpClient.post(`${BASE(userId)}/lock`).then((r) => r.data),

  unlockUser: (userId: string): Promise<LockUnlockResponse> =>
    httpClient.post(`${BASE(userId)}/unlock`).then((r) => r.data),

  getAnomalies: (userId: string): Promise<AnomaliesResponse> =>
    httpClient.get(`${BASE(userId)}/anomalies`).then((r) => r.data),
}
