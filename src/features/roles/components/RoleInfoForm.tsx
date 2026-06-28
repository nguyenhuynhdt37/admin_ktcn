import { Trash2, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import type { RoleDetail } from '../types/roles.types'

interface RoleInfoFormProps {
  roleDetail?: RoleDetail
  isSuperAdminRole: boolean
  isSystemRole: boolean
  canUpdate: boolean
  canDelete: boolean
  editRoleName: string
  setEditRoleName: (val: string) => void
  editRoleDesc: string
  setEditRoleDesc: (val: string) => void
  onUpdateRoleInfo: (e: React.FormEvent) => void
  onDeleteRole: () => void
  isUpdating: boolean
  isDeleting: boolean
}

export function RoleInfoForm({
  roleDetail,
  isSuperAdminRole,
  isSystemRole,
  canUpdate,
  canDelete,
  editRoleName,
  setEditRoleName,
  editRoleDesc,
  setEditRoleDesc,
  onUpdateRoleInfo,
  onDeleteRole,
  isUpdating,
  isDeleting,
}: RoleInfoFormProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {roleDetail?.name}
              {isSuperAdminRole && (
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary">
                  Bảo vệ
                </Badge>
              )}
              {isSystemRole && !isSuperAdminRole && (
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-muted-foreground/30">
                  Hệ thống
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1">
              Mã vai trò (code): {roleDetail?.code}
            </CardDescription>
          </div>
          {canDelete && !isSystemRole && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 cursor-pointer gap-1"
              onClick={onDeleteRole}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              Xóa vai trò
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onUpdateRoleInfo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Tên vai trò *</label>
              <Input
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                disabled={isSuperAdminRole || !canUpdate}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Mô tả</label>
              <Input
                value={editRoleDesc}
                onChange={(e) => setEditRoleDesc(e.target.value)}
                disabled={isSuperAdminRole || !canUpdate}
              />
            </div>
          </div>
          {canUpdate && !isSuperAdminRole && (
            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" className="gap-1.5 cursor-pointer" disabled={isUpdating}>
                <Save className="h-3.5 w-3.5" />
                {isUpdating ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
