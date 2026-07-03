// ─── Profile Response ───────────────────────────────────────────────────────

export interface MyProfileResponse {
  id: string
  username: string
  email: string
  phone: string | null
  full_name: string
  bio: string | null
  title: string | null
  avatar_url: string | null
  roles: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

// ─── Profile Update ─────────────────────────────────────────────────────────

export interface ProfileUpdateRequest {
  full_name?: string
  phone?: string
  bio?: string
  title?: string
  avatar_id?: string
}

// ─── Change Password ────────────────────────────────────────────────────────

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

// ─── Activity ───────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string
  actor_id: string
  actor_username: string
  action: string
  target_type: string
  target_id: string | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface ActivityResponse {
  items: ActivityItem[]
  total: number
}
