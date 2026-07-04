import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
import { Activity, Globe, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { profileService } from '../services/profileService'
import type { ActivityItem } from '../types/profile.types'

/** Mapping tất cả action types trong hệ thống → label hiển thị + color */
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  // ─── Auth ─────────────────────────────────────────────────
  AUTH_LOGIN:         { label: 'Đăng nhập', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  AUTH_LOGOUT:        { label: 'Đăng xuất', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400' },
  AUTH_LOGOUT_ALL:    { label: 'Đăng xuất tất cả', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  PASSWORD_CHANGED:   { label: 'Đổi mật khẩu', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  PROFILE_UPDATED:    { label: 'Cập nhật hồ sơ', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  DEVICE_REVOKED:     { label: 'Thu hồi phiên', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },

  // ─── User Management ─────────────────────────────────────
  USER_CREATED:       { label: 'Tạo thành viên', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  USER_UPDATED:       { label: 'Sửa thành viên', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  USER_DELETED:       { label: 'Xóa thành viên', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  USER_LOCKED:        { label: 'Khóa tài khoản', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  USER_UNLOCKED:      { label: 'Mở khóa TK', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  ROLE_UPDATED:       { label: 'Sửa vai trò', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  ROLE_PERMISSIONS_CHANGED: { label: 'Đổi quyền vai trò', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },

  // ─── Article ──────────────────────────────────────────────
  ARTICLE_CREATED:        { label: 'Tạo bài viết', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  ARTICLE_UPDATED:        { label: 'Sửa bài viết', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  ARTICLE_DELETED:        { label: 'Xóa bài viết', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  ARTICLE_PUBLISHED:      { label: 'Đăng bài viết', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  ARTICLE_AUTO_PUBLISHED: { label: 'Tự động đăng bài', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  ARTICLE_ARCHIVED:       { label: 'Lưu trữ bài viết', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  ARTICLE_RESTORED:       { label: 'Khôi phục bài viết', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },

  // ─── Category ─────────────────────────────────────────────
  CATEGORY_CREATED:    { label: 'Tạo danh mục', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  CATEGORY_UPDATED:    { label: 'Sửa danh mục', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  CATEGORY_DELETED:    { label: 'Xóa danh mục', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  CATEGORY_RESTORED:   { label: 'Khôi phục danh mục', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  CATEGORIES_REORDERED: { label: 'Sắp xếp danh mục', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400' },

  // ─── Tag ──────────────────────────────────────────────────
  TAG_CREATED:        { label: 'Tạo thẻ', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400' },
  TAG_UPDATED:        { label: 'Sửa thẻ', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400' },
  TAG_DELETED:        { label: 'Xóa thẻ', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  TAG_STATUS_TOGGLED: { label: 'Đổi trạng thái thẻ', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },

  // ─── Menu ─────────────────────────────────────────────────
  MENU_CREATED:           { label: 'Tạo menu', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  MENU_ITEM_CREATED:      { label: 'Tạo mục menu', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  MENU_ITEM_UPDATED:      { label: 'Sửa mục menu', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  MENU_ITEM_DELETED:      { label: 'Xóa mục menu', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  MENU_ITEMS_REORDERED:   { label: 'Sắp xếp menu', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400' },

  // ─── Department ───────────────────────────────────────────
  DEPARTMENT_CREATED:        { label: 'Tạo phòng ban', color: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400' },
  DEPARTMENT_UPDATED:        { label: 'Sửa phòng ban', color: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400' },
  DEPARTMENT_DELETED:        { label: 'Xóa phòng ban', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  DEPARTMENT_STATUS_UPDATED: { label: 'Đổi TT phòng ban', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },

  // ─── Position ─────────────────────────────────────────────
  POSITION_CREATED:        { label: 'Tạo chức vụ', color: 'bg-lime-500/10 text-lime-700 dark:text-lime-400' },
  POSITION_UPDATED:        { label: 'Sửa chức vụ', color: 'bg-lime-500/10 text-lime-700 dark:text-lime-400' },
  POSITION_DELETED:        { label: 'Xóa chức vụ', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  POSITION_STATUS_UPDATED: { label: 'Đổi TT chức vụ', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },

  // ─── Staff ────────────────────────────────────────────────
  STAFF_CREATED:        { label: 'Tạo nhân sự', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  STAFF_UPDATED:        { label: 'Sửa nhân sự', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  STAFF_DELETED:        { label: 'Xóa nhân sự', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  STAFF_STATUS_UPDATED: { label: 'Đổi TT nhân sự', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },

  // ─── Language ─────────────────────────────────────────────
  LANGUAGE_CREATED:    { label: 'Tạo ngôn ngữ', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  LANGUAGE_UPDATED:    { label: 'Sửa ngôn ngữ', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  LANGUAGE_DELETED:    { label: 'Xóa ngôn ngữ', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  LANGUAGE_ENABLED:    { label: 'Bật ngôn ngữ', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  LANGUAGE_DISABLED:   { label: 'Tắt ngôn ngữ', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400' },
  LANGUAGE_SET_DEFAULT: { label: 'Đặt NN mặc định', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  LANGUAGE_RESTORED:   { label: 'Khôi phục NN', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  LANGUAGES_REORDERED: { label: 'Sắp xếp ngôn ngữ', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400' },

  // ─── Banner ───────────────────────────────────────────────
  BANNER_CREATED: { label: 'Tạo banner', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  BANNER_UPDATED: { label: 'Sửa banner', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  BANNER_DELETED: { label: 'Xóa banner', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },

  // ─── Media ────────────────────────────────────────────────
  MEDIA_UPLOADED: { label: 'Tải lên media', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },

  // ─── AI Settings ──────────────────────────────────────────
  AI_SETTINGS_UPDATED: { label: 'Cập nhật AI', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const meta = ACTION_LABELS[item.action] ?? {
    label: item.action,
    color: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary/10 p-1.5">
        <Activity className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={`text-[11px] font-medium ${meta.color}`}>
            {meta.label}
          </Badge>
          {item.target_type && (
            <span className="text-xs text-muted-foreground">→ {item.target_type}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>
          <span>({dayjs(item.created_at).fromNow()})</span>
          {item.ip_address && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {item.ip_address}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProfileActivityTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-profile-activity'],
    queryFn: () => profileService.getActivity(50),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Hoạt động gần đây</span>
          {data && <Badge variant="secondary">{data.total} tổng cộng</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.items.length ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <Activity className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          {data.items.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
