export interface AuditLogItem {
  id: string
  actor_id: string | null
  actor_username: string
  action: string
  target_type: string
  target_id: string | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditLogListResponse {
  items: AuditLogItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AuditLogFiltersState {
  action: string
  target_type: string
  from_date: string
  to_date: string
  actor_id: string
}

// Color coding constants
export const ACTION_COLORS: Record<string, { label: string; className: string }> = {
  // Auth
  AUTH_LOGIN: { label: 'Đăng nhập', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  AUTH_LOGOUT: { label: 'Đăng xuất', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  AUTH_LOGOUT_ALL: { label: 'Đăng xuất tất cả', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DEVICE_REVOKED: { label: 'Thu hồi phiên', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  // User
  USER_CREATED: { label: 'Tạo thành viên', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  USER_UPDATED: { label: 'Cập nhật thành viên', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  USER_DELETED: { label: 'Xóa thành viên', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  USER_LOCKED: { label: 'Khóa tài khoản', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  USER_UNLOCKED: { label: 'Mở khóa tài khoản', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  // Role
  ROLE_CREATED: { label: 'Tạo vai trò', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ROLE_UPDATED: { label: 'Cập nhật vai trò', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ROLE_DELETED: { label: 'Xóa vai trò', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  ROLE_PERMISSIONS_CHANGED: { label: 'Đổi quyền vai trò', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  // Media
  MEDIA_FOLDER_CREATED: { label: 'Tạo thư mục', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  MEDIA_UPLOADED: { label: 'Upload file', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  MEDIA_RENAMED: { label: 'Đổi tên', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MEDIA_MOVED: { label: 'Di chuyển', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MEDIA_COPIED: { label: 'Sao chép', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MEDIA_DELETED: { label: 'Xóa file/thư mục', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const TARGET_TYPE_LABELS: Record<string, string> = {
  user: 'Thành viên',
  role: 'Vai trò',
  session: 'Phiên đăng nhập',
  media: 'Thư viện Media',
}

export const ALL_ACTIONS = Object.keys(ACTION_COLORS)
export const ALL_TARGET_TYPES = Object.keys(TARGET_TYPE_LABELS)
