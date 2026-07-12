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
  // Auth & Profile
  AUTH_LOGIN: { label: 'Đăng nhập', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  AUTH_LOGOUT: { label: 'Đăng xuất', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  AUTH_LOGOUT_ALL: { label: 'Đăng xuất tất cả', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  PASSWORD_CHANGED: { label: 'Đổi mật khẩu', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PROFILE_UPDATED: { label: 'Cập nhật hồ sơ', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  DEVICE_REVOKED: { label: 'Thu hồi phiên', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },

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
  ROLE_PERMISSIONS_CHANGED: { label: 'Đổi quyền vai trò', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },

  // Article
  ARTICLE_CREATED: { label: 'Tạo bài viết', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ARTICLE_UPDATED: { label: 'Sửa bài viết', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ARTICLE_DELETED: { label: 'Xóa bài viết', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  ARTICLE_PUBLISHED: { label: 'Đăng bài viết', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ARTICLE_AUTO_PUBLISHED: { label: 'Tự động đăng bài', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ARTICLE_ARCHIVED: { label: 'Lưu trữ bài viết', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ARTICLE_RESTORED: { label: 'Khôi phục bài viết', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },

  // Category
  CATEGORY_CREATED: { label: 'Tạo danh mục', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  CATEGORY_UPDATED: { label: 'Sửa danh mục', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  CATEGORY_DELETED: { label: 'Xóa danh mục', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CATEGORY_RESTORED: { label: 'Khôi phục danh mục', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  CATEGORIES_REORDERED: { label: 'Sắp xếp danh mục', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },

  // Tag
  TAG_CREATED: { label: 'Tạo thẻ', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  TAG_UPDATED: { label: 'Sửa thẻ', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  TAG_DELETED: { label: 'Xóa thẻ', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  TAG_STATUS_TOGGLED: { label: 'Đổi trạng thái thẻ', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },

  // Menu
  MENU_CREATED: { label: 'Tạo menu', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  MENU_UPDATED: { label: 'Sửa menu', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  MENU_DELETED: { label: 'Xóa menu', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  MENU_ITEM_CREATED: { label: 'Tạo mục menu', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  MENU_ITEM_UPDATED: { label: 'Sửa mục menu', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  MENU_ITEM_DELETED: { label: 'Xóa mục menu', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  MENU_ITEMS_REORDERED: { label: 'Sắp xếp menu', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },

  // Department
  DEPARTMENT_CREATED: { label: 'Tạo phòng ban', className: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' },
  DEPARTMENT_UPDATED: { label: 'Sửa phòng ban', className: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' },
  DEPARTMENT_DELETED: { label: 'Xóa phòng ban', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  DEPARTMENT_STATUS_UPDATED: { label: 'Đổi TT phòng ban', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },

  // Position
  POSITION_CREATED: { label: 'Tạo chức vụ', className: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' },
  POSITION_UPDATED: { label: 'Sửa chức vụ', className: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' },
  POSITION_DELETED: { label: 'Xóa chức vụ', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  POSITION_STATUS_UPDATED: { label: 'Đổi TT chức vụ', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },

  // Staff / Teacher
  STAFF_CREATED: { label: 'Tạo nhân sự', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  STAFF_UPDATED: { label: 'Sửa nhân sự', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  STAFF_DELETED: { label: 'Xóa nhân sự', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  STAFF_STATUS_UPDATED: { label: 'Đổi TT nhân sự', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  TEACHER_CREATED: { label: 'Tạo giảng viên', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  TEACHER_UPDATED: { label: 'Sửa giảng viên', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  TEACHER_DELETED: { label: 'Xóa giảng viên', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  TEACHER_STATUS_UPDATED: { label: 'Đổi TT giảng viên', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },

  // Language
  LANGUAGE_CREATED: { label: 'Tạo ngôn ngữ', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  LANGUAGE_UPDATED: { label: 'Sửa ngôn ngữ', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  LANGUAGE_DELETED: { label: 'Xóa ngôn ngữ', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  LANGUAGE_ENABLED: { label: 'Bật ngôn ngữ', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  LANGUAGE_DISABLED: { label: 'Tắt ngôn ngữ', className: 'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-400' },
  LANGUAGE_SET_DEFAULT: { label: 'Đặt NN mặc định', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  LANGUAGE_RESTORED: { label: 'Khôi phục NN', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  LANGUAGES_REORDERED: { label: 'Sắp xếp ngôn ngữ', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },

  // Banner
  BANNER_CREATED: { label: 'Tạo banner', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  BANNER_UPDATED: { label: 'Sửa banner', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  BANNER_DELETED: { label: 'Xóa banner', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },

  // Media
  MEDIA_FOLDER_CREATED: { label: 'Tạo thư mục', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  MEDIA_UPLOADED: { label: 'Tải lên media', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  MEDIA_RENAMED: { label: 'Đổi tên', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MEDIA_MOVED: { label: 'Di chuyển', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MEDIA_COPIED: { label: 'Sao chép', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MEDIA_DELETED: { label: 'Xóa file/thư mục', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },

  // AI Settings
  AI_SETTINGS_UPDATED: { label: 'Cập nhật AI', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },

  // Gallery / Album
  GALLERY_CREATED: { label: 'Tạo album ảnh', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  GALLERY_UPDATED: { label: 'Sửa album ảnh', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  GALLERY_DELETED: { label: 'Xóa album ảnh', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  GALLERY_STATUS_UPDATED: { label: 'Đổi TT album', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  
  ALBUM_CREATED: { label: 'Tạo album ảnh', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ALBUM_UPDATED: { label: 'Sửa album ảnh', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ALBUM_DELETED: { label: 'Xóa album ảnh', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  ALBUM_STATUS_UPDATED: { label: 'Đổi TT album', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export const TARGET_TYPE_LABELS: Record<string, string> = {
  user: 'Thành viên',
  role: 'Vai trò',
  session: 'Phiên đăng nhập',
  media: 'Thư viện Media',
  article: 'Bài viết',
  category: 'Danh mục bài viết',
  tag: 'Thẻ bài viết',
  menu: 'Menu',
  menu_item: 'Mục menu',
  department: 'Ủy ban/Khoa/Bộ môn',
  position: 'Chức vụ',
  staff: 'Giảng viên/Nhân sự',
  teacher: 'Giảng viên/Nhân sự',
  language: 'Ngôn ngữ',
  banner: 'Banner',
  ai_settings: 'Cấu hình AI',
  gallery: 'Album ảnh',
  gallery_album: 'Album ảnh',
  album: 'Album ảnh',
}

export const ALL_ACTIONS = Object.keys(ACTION_COLORS)
export const ALL_TARGET_TYPES = Object.keys(TARGET_TYPE_LABELS)
