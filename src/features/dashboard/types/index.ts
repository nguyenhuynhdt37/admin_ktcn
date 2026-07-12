// =====================================================
// Dashboard Types — API Response Interfaces
// GET /api/v1/admin/dashboard
// =====================================================

export interface DashboardVisitors {
  online_count: number
  total_visits: number
}

export interface DashboardArticles {
  total: number
  published: number
  draft: number
  scheduled: number
  archived: number
  trash: number
  total_views: number
}

export interface DashboardUsers {
  total: number
  active: number
  locked: number
  deleted: number
}

export interface DashboardConsultations {
  total: number
  new: number
  contacted: number
  consulting: number
  completed: number
  not_qualified: number
}

export interface DashboardContent {
  departments: number
  categories: number
  banners: number
  media_count: number
  media_storage_bytes: number
}

export interface DashboardLogins {
  today: number
  last_7_days: number
  failed_today: number
}

export interface TopArticleItem {
  id: string
  title: string
  view_count: number
  published_at: string | null
  category_name: string | null
}

export interface RecentActivityItem {
  actor_username: string
  action: string
  target_type: string
  created_at: string
}

export interface DashboardResponse {
  visitors: DashboardVisitors
  articles: DashboardArticles
  users: DashboardUsers
  consultations: DashboardConsultations
  content: DashboardContent
  logins: DashboardLogins
  top_articles: TopArticleItem[]
  recent_activities: RecentActivityItem[]
}

// =====================================================
// Action Labels — Mapping mã action → Tên tiếng Việt
// =====================================================
export const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN: 'Đăng nhập',
  AUTH_LOGOUT: 'Đăng xuất',
  USER_CREATED: 'Tạo tài khoản',
  USER_UPDATED: 'Cập nhật tài khoản',
  USER_DELETED: 'Xóa tài khoản',
  USER_LOCKED: 'Khóa tài khoản',
  USER_UNLOCKED: 'Mở khóa tài khoản',
  PROFILE_UPDATED: 'Cập nhật hồ sơ',
  PASSWORD_CHANGED: 'Đổi mật khẩu',
  ARTICLE_CREATED: 'Tạo bài viết',
  ARTICLE_UPDATED: 'Sửa bài viết',
  ARTICLE_DELETED: 'Xóa bài viết',
  BANNER_CREATED: 'Tạo banner',
  BANNER_UPDATED: 'Sửa banner',
  BANNER_DELETED: 'Xóa banner',
  CATEGORY_CREATED: 'Tạo danh mục',
  CATEGORY_UPDATED: 'Sửa danh mục',
  CATEGORY_DELETED: 'Xóa danh mục',
  MEDIA_UPLOADED: 'Upload file',
  DEPARTMENT_CREATED: 'Tạo đơn vị',
  DEPARTMENT_UPDATED: 'Sửa đơn vị',
}

// =====================================================
// Action Colors — Mapping mã action → màu badge
// =====================================================
export const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  AUTH_LOGIN: { bg: 'bg-blue-50', text: 'text-blue-700' },
  AUTH_LOGOUT: { bg: 'bg-slate-50', text: 'text-slate-600' },
  USER_CREATED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  USER_UPDATED: { bg: 'bg-amber-50', text: 'text-amber-700' },
  USER_DELETED: { bg: 'bg-red-50', text: 'text-red-700' },
  USER_LOCKED: { bg: 'bg-red-50', text: 'text-red-600' },
  USER_UNLOCKED: { bg: 'bg-teal-50', text: 'text-teal-700' },
  PROFILE_UPDATED: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  PASSWORD_CHANGED: { bg: 'bg-violet-50', text: 'text-violet-700' },
  ARTICLE_CREATED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  ARTICLE_UPDATED: { bg: 'bg-sky-50', text: 'text-sky-700' },
  ARTICLE_DELETED: { bg: 'bg-red-50', text: 'text-red-700' },
  BANNER_CREATED: { bg: 'bg-orange-50', text: 'text-orange-700' },
  BANNER_UPDATED: { bg: 'bg-amber-50', text: 'text-amber-700' },
  BANNER_DELETED: { bg: 'bg-red-50', text: 'text-red-700' },
  CATEGORY_CREATED: { bg: 'bg-purple-50', text: 'text-purple-700' },
  CATEGORY_UPDATED: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
  CATEGORY_DELETED: { bg: 'bg-red-50', text: 'text-red-700' },
  MEDIA_UPLOADED: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  DEPARTMENT_CREATED: { bg: 'bg-lime-50', text: 'text-lime-700' },
  DEPARTMENT_UPDATED: { bg: 'bg-green-50', text: 'text-green-700' },
}
