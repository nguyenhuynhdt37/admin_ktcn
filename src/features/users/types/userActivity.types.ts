// ─── Session ───────────────────────────────────────────────────────────────

export interface UserSession {
  id: string
  ip_address: string
  user_agent: string | null
  created_at: string
  expires_at: string
  is_revoked: boolean
}

// ─── Login History ──────────────────────────────────────────────────────────

export type LoginStatus = 'success' | 'failed'

export interface LoginHistoryItem {
  id: string
  ip_address: string
  user_agent: string | null
  status: LoginStatus
  failure_reason: string | null
  created_at: string
}

export interface LoginHistoryResponse {
  items: LoginHistoryItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ─── Lock / Unlock ──────────────────────────────────────────────────────────

export interface LockUnlockResponse {
  success: boolean
  message: string
  user_id: string
  is_active: boolean
}

export interface RevokeAllResponse {
  success: boolean
  revoked_count: number
}

// ─── Anomalies ──────────────────────────────────────────────────────────────

export type AnomalyType = 'BRUTE_FORCE' | 'NEW_LOCATION' | 'UNUSUAL_HOUR' | 'MULTI_SESSION'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Anomaly {
  type: AnomalyType
  description: string
  severity: Severity
  detected_at: string
}

export interface AnomaliesResponse {
  user_id: string
  risk_level: RiskLevel
  anomalies: Anomaly[]
  active_session_count: number
  failed_login_count_24h: number
  generated_at: string
}
