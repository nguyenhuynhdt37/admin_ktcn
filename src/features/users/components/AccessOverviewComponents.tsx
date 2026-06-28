import { ExternalLink, KeyRound, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import type { GrantedPermission, AccessibleFeature } from '@/features/users/types/accessOverview.types'

export const ACTION_CLASSES: Record<string, string> = {
  view:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  view_own:      'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  create:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  update:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  update_own:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  delete:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  delete_own:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  publish:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  unpublish:     'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  force_delete:  'bg-red-900 text-red-100 dark:bg-red-950 dark:text-red-200',
  upload:        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  download:      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  lock:          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  unlock:        'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  assign_role:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  reset_password:'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  sort:          'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  copy_url:      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  enable:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  disable:       'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300',
  preview:       'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  schedule:      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  restore:       'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  export:        'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  change_password:  'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  change_avatar: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  assign_permission: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
}

export const ACTION_LABELS: Record<string, string> = {
  view:              'Xem',
  view_own:          'Xem cá nhân',
  create:            'Tạo mới',
  update:            'Cập nhật',
  update_own:        'Cập nhật cá nhân',
  delete:            'Xóa',
  delete_own:        'Xóa cá nhân',
  publish:           'Xuất bản',
  unpublish:         'Gỡ xuất bản',
  force_delete:      'Xóa vĩnh viễn',
  upload:            'Tải lên',
  download:          'Tải xuống',
  lock:              'Khóa',
  unlock:            'Mở khóa',
  assign_role:       'Gán vai trò',
  reset_password:    'Đặt lại mật khẩu',
  sort:              'Sắp xếp',
  copy_url:          'Sao chép liên kết',
  enable:            'Kích hoạt',
  disable:           'Vô hiệu hóa',
  preview:           'Xem trước',
  schedule:          'Đặt lịch',
  restore:           'Khôi phục',
  export:            'Xuất dữ liệu',
  change_password:   'Đổi mật khẩu',
  change_avatar:     'Đổi ảnh đại diện',
  assign_permission: 'Gán quyền',
}

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Bảng điều khiển',
  article: 'Bài viết',
  category: 'Danh mục',
  tag: 'Thẻ (Tag)',
  media: 'Thư viện Media',
  page: 'Trang tĩnh',
  menu: 'Menu điều hướng',
  banner: 'Banner quảng cáo',
  user: 'Thành viên / Người dùng',
  role: 'Vai trò',
  permission: 'Quyền hạn',
  feature: 'Tính năng',
  settings: 'Cài đặt hệ thống',
  profile: 'Trang cá nhân',
  login_history: 'Lịch sử đăng nhập',
  audit_log: 'Nhật ký hoạt động',
}

export const FEATURE_LABELS: Record<string, string> = {
  'Dashboard': 'Bảng điều khiển',
  'Articles': 'Bài viết',
  'Categories': 'Danh mục',
  'Tags': 'Thẻ (Tag)',
  'Media Library': 'Thư viện Media',
  'Pages': 'Trang tĩnh',
  'Menus': 'Menu điều hướng',
  'Banners': 'Banner quảng cáo',
  'Users': 'Thành viên',
  'Roles': 'Vai trò',
  'Permissions': 'Quyền hạn',
  'Features': 'Tính năng hệ thống',
  'Settings': 'Cài đặt hệ thống',
  'Profile': 'Hồ sơ cá nhân',
  'Login History': 'Lịch sử đăng nhập',
  'Audit Logs': 'Nhật ký hoạt động',
}

export function getPermissionLabel(code: string): string {
  const parts = code.split('.')
  if (parts.length < 2) return code
  const module = parts[0]
  const action = parts.slice(1).join('.')

  const moduleName = MODULE_LABELS[module] ?? module
  const actionName = ACTION_LABELS[action] ?? action

  // Custom Phrasings for natural Vietnamese reading
  if (action === 'view_own') return `Xem ${moduleName.toLowerCase()} cá nhân`
  if (action === 'update_own') return `Cập nhật ${moduleName.toLowerCase()} cá nhân`
  if (action === 'delete_own') return `Xóa ${moduleName.toLowerCase()} cá nhân`

  return `${actionName} ${moduleName.toLowerCase()}`
}

export function getActionClass(action: string) {
  return ACTION_CLASSES[action] ?? 'bg-muted text-muted-foreground'
}

/** Group permission_codes by their module prefix */
export function groupByModule(codes: string[]): Record<string, string[]> {
  return codes.reduce<Record<string, string[]>>((acc, code) => {
    const [module] = code.split('.')
    ;(acc[module] ??= []).push(code)
    return acc
  }, {})
}

export function PermissionBadge({ perm }: { perm: GrantedPermission }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium cursor-default',
              getActionClass(perm.action)
            )}
          >
            {ACTION_LABELS[perm.action] ?? perm.action}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="font-mono text-xs font-semibold">{perm.code}</p>
          {perm.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function FeatureCard({ feature }: { feature: AccessibleFeature }) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {FEATURE_LABELS[feature.name] ?? feature.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{feature.code}</p>
        </div>
        {feature.route && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground font-mono flex-shrink-0">
            {feature.route}
            <ExternalLink className="size-3" />
          </span>
        )}
      </div>

      {feature.granted_permissions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {feature.granted_permissions.map((p) => (
            <PermissionBadge key={p.id} perm={p} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Không có quyền cụ thể</p>
      )}
    </div>
  )
}
