import { Check, Loader2, RotateCcw, Key, LayoutDashboard, FileText, Folder, Tag, Image as ImageIcon, BookOpen, Menu as MenuIcon, Sliders, Users, Layers, Settings as SettingsIcon, User as UserIcon, Clock, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import type { SystemPermission, RoleDetail } from '../types/roles.types'

const MODULE_CONFIGS: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: 'Bảng điều khiển', icon: LayoutDashboard },
  article: { label: 'Bài viết', icon: FileText },
  category: { label: 'Danh mục', icon: Folder },
  tag: { label: 'Thẻ (Tag)', icon: Tag },
  media: { label: 'Thư viện Media', icon: ImageIcon },
  page: { label: 'Trang tĩnh', icon: BookOpen },
  menu: { label: 'Menu điều hướng', icon: MenuIcon },
  banner: { label: 'Banner quảng cáo', icon: Sliders },
  user: { label: 'Thành viên / Người dùng', icon: Users },
  role: { label: 'Vai trò', icon: ShieldIcon }, // wait, Shield is ShieldIcon below
  permission: { label: 'Quyền hạn', icon: Key },
  feature: { label: 'Tính năng', icon: Layers },
  settings: { label: 'Cài đặt hệ thống', icon: SettingsIcon },
  profile: { label: 'Trang cá nhân', icon: UserIcon },
  login_history: { label: 'Lịch sử đăng nhập', icon: Clock },
  audit_log: { label: 'Nhật ký hoạt động', icon: FileSpreadsheet },
}

// Custom Shield icon import mapping because Shield is imported from lucide-react as ShieldIcon here
import { Shield as ShieldIcon } from 'lucide-react'

const ACTION_LABELS: Record<string, string> = {
  view: 'Xem',
  view_own: 'Xem cá nhân',
  create: 'Tạo mới',
  update: 'Cập nhật',
  update_own: 'Cập nhật cá nhân',
  delete: 'Xóa',
  delete_own: 'Xóa cá nhân',
  publish: 'Xuất bản',
  unpublish: 'Gỡ xuất bản',
  force_delete: 'Xóa vĩnh viễn',
  upload: 'Tải lên',
  download: 'Tải xuống',
  lock: 'Khóa',
  unlock: 'Mở khóa',
  assign_role: 'Gán vai trò',
  reset_password: 'Đặt lại mật khẩu',
  sort: 'Sắp xếp',
  copy_url: 'Sao chép liên kết',
  enable: 'Kích hoạt',
  disable: 'Vô hiệu hóa',
  preview: 'Xem trước',
  schedule: 'Đặt lịch',
  restore: 'Khôi phục',
  export: 'Xuất dữ liệu',
  change_password: 'Đổi mật khẩu',
  change_avatar: 'Đổi ảnh đại diện',
  assign_permission: 'Gán quyền',
}

interface RolePermissionGridProps {
  permissionsByModule: Record<string, SystemPermission[]>
  selectedPermIds: string[]
  onTogglePermission: (id: string) => void
  onToggleModule: (perms: SystemPermission[]) => void
  isSuperAdminRole: boolean
  canAssign: boolean
  isLoadingPerms: boolean
  roleDetail?: RoleDetail
  onSavePermissions: () => void
  onRestore: () => void
  isSaving: boolean
}

export function RolePermissionGrid({
  permissionsByModule,
  selectedPermIds,
  onTogglePermission,
  onToggleModule,
  isSuperAdminRole,
  canAssign,
  isLoadingPerms,
  roleDetail,
  onSavePermissions,
  onRestore,
  isSaving,
}: RolePermissionGridProps) {
  if (isLoadingPerms) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (Object.keys(permissionsByModule).length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="text-center py-10 text-muted-foreground">
          Không tìm thấy quyền hạn nào trong hệ thống.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="text-base">Bảng phân quyền hạn</CardTitle>
          <CardDescription>Tích chọn các quyền được phép gán cho vai trò này.</CardDescription>
        </div>
        {!isSuperAdminRole && canAssign && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 cursor-pointer"
              onClick={onRestore}
              disabled={isSaving}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Khôi phục
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              onClick={onSavePermissions}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Lưu quyền hạn
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-6">
          {Object.entries(permissionsByModule)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([moduleName, perms]) => {
              const config = MODULE_CONFIGS[moduleName] || { label: moduleName, icon: Key }
              const moduleIds = perms.map((p) => p.id)
              const isAllChecked = moduleIds.every((id) => selectedPermIds.includes(id))
              const isSomeChecked = moduleIds.some((id) => selectedPermIds.includes(id)) && !isAllChecked
              const IconComp = config.icon

              return (
                <div
                  key={moduleName}
                  className={cn(
                    'border rounded-lg p-4 transition-all duration-200 bg-muted/20 hover:bg-muted/30',
                    isAllChecked && 'border-primary/20 bg-primary/[0.01]'
                  )}
                >
                  {/* Module Header card */}
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <div className="flex items-center gap-2">
                      <IconComp className="h-4.5 w-4.5 text-muted-foreground" />
                      <span className="font-semibold text-sm text-foreground capitalize">
                        {config.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {perms.filter((p) => selectedPermIds.includes(p.id)).length} / {perms.length}
                      </Badge>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={isAllChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeChecked
                        }}
                        onChange={() => onToggleModule(perms)}
                        disabled={isSuperAdminRole || !canAssign}
                        className="rounded border-muted-foreground/30 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>Chọn tất cả</span>
                    </label>
                  </div>

                  {/* Permissions List Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {perms
                      .sort((a, b) => a.action.localeCompare(b.action))
                      .map((perm) => {
                        const isChecked = selectedPermIds.includes(perm.id)
                        const label = ACTION_LABELS[perm.action] ?? perm.action

                        return (
                          <TooltipProvider key={perm.id} delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <label
                                  className={cn(
                                    'flex items-start gap-2.5 border rounded-lg p-2.5 bg-card hover:shadow-sm cursor-pointer select-none transition-all',
                                    isChecked && 'border-primary/30 bg-primary/[0.02]',
                                    (isSuperAdminRole || !canAssign) && 'cursor-default opacity-85'
                                  )}
                                  onClick={() => {
                                    if (!isSuperAdminRole && canAssign) {
                                      onTogglePermission(perm.id)
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // handled by click container
                                    disabled={isSuperAdminRole || !canAssign}
                                    className="rounded border-muted-foreground/30 text-primary focus:ring-primary h-3.5 w-3.5 mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <p className={cn('text-xs font-semibold truncate', isChecked && 'text-primary')}>
                                      {label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                                      {perm.code}
                                    </p>
                                    {perm.description && (
                                      <p className="text-[10px] text-muted-foreground/80 mt-1 leading-snug line-clamp-2">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-mono text-xs font-semibold">{perm.code}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                  </div>
                </div>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )
}
