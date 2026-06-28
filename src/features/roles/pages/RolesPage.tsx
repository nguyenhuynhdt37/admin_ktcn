import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Shield, Search, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAuth } from '@/app/providers/AuthProvider'
import { rolesService } from '../services/rolesService'
import type { SystemPermission } from '../types/roles.types'

import { RoleCreateDialog } from '../components/RoleCreateDialog'
import { RoleInfoForm } from '../components/RoleInfoForm'
import { RolePermissionGrid } from '../components/RolePermissionGrid'
import { AssignWarningDialog } from '../components/AssignWarningDialog'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupPermissionsByModule(permissions: SystemPermission[]): Record<string, SystemPermission[]> {
  return permissions.reduce<Record<string, SystemPermission[]>>((acc, perm) => {
    const module = perm.module
    ;(acc[module] ??= []).push(perm)
    return acc
  }, {})
}

function slugifyCode(str: string): string {
  const from = "áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ"
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"
  let res = str.toLowerCase()
  for (let i = 0; i < from.length; i++) {
    res = res.replaceAll(from[i], to[i])
  }
  return res
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
}

export function RolesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()

  // Permissions gate
  const canView = hasPermission('role.view')
  const canCreate = hasPermission('role.create')
  const canUpdate = hasPermission('role.update')
  const canDelete = hasPermission('role.delete')
  const canAssign = hasPermission('role.assign_permission')

  // UI States
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newRoleOpen, setNewRoleOpen] = useState(false)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])
  const [assignWarningOpen, setAssignWarningOpen] = useState(false)
  const [assignWarningMessage, setAssignWarningMessage] = useState('')

  // New Role Form States
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleCode, setNewRoleCode] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')

  // Edit Role Form States (for selected role)
  const [editRoleName, setEditRoleName] = useState('')
  const [editRoleDesc, setEditRoleDesc] = useState('')

  // ─── Queries ───────────────────────────────────────────────────────────────

  // 1. Roles list
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesService.list,
    enabled: canView,
  })

  // 2. All system permissions
  const { data: allPermissions = [], isLoading: isLoadingPerms } = useQuery({
    queryKey: ['permissions-all'],
    queryFn: rolesService.listAllPermissions,
    enabled: canView,
  })

  // 3. Selected role detail
  const { data: roleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['roles', selectedRoleId],
    queryFn: () => rolesService.getDetail(selectedRoleId!),
    enabled: !!selectedRoleId && canView,
  })

  // Sync edit form and selected permissions when detail changes
  useEffect(() => {
    if (roleDetail) {
      setEditRoleName(roleDetail.name)
      setEditRoleDesc(roleDetail.description || '')
      setSelectedPermIds(roleDetail.permissions.map((p) => p.id))
    }
  }, [roleDetail])

  // Select first role automatically if none selected
  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles])

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Create Role
  const createMutation = useMutation({
    mutationFn: rolesService.create,
    onSuccess: (newRole) => {
      toast.success('Tạo vai trò thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles'], exact: true })
      setSelectedRoleId(newRole.id)
      setNewRoleOpen(false)
      // Reset form
      setNewRoleName('')
      setNewRoleCode('')
      setNewRoleDesc('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể tạo vai trò'
      toast.error(msg)
    },
  })

  // Update Role info (Name & Desc)
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string } }) =>
      rolesService.update(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật thông tin vai trò thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles'], exact: true })
      queryClient.invalidateQueries({ queryKey: ['roles', selectedRoleId] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Cập nhật thất bại'
      toast.error(msg)
    },
  })

  // Delete Role
  const deleteMutation = useMutation({
    mutationFn: rolesService.delete,
    onSuccess: (_, deletedId) => {
      // 1. Xóa cache chi tiết của vai trò đã xóa để tránh refetch tự động
      queryClient.removeQueries({ queryKey: ['roles', deletedId] })
      
      // 2. Tìm vai trò tiếp theo để chọn trước khi danh sách được reload
      const remainingRoles = roles.filter((r) => r.id !== deletedId)
      const nextSelectedId = remainingRoles.length > 0 ? remainingRoles[0].id : null
      setSelectedRoleId(nextSelectedId)

      // 3. Chỉ làm mới duy nhất danh sách vai trò
      queryClient.invalidateQueries({ queryKey: ['roles'], exact: true })
      toast.success('Đã xóa vai trò thành công!')
    },
    onError: (err: any) => {
      const errorData = err?.response?.data?.error
      if (errorData?.code === 'ROLE_HAS_ASSIGNED_USERS') {
        setAssignWarningMessage(errorData.message)
        setAssignWarningOpen(true)
      } else if (errorData?.code === 'SYSTEM_ROLE_PROTECTED') {
        toast.error('Không thể xóa vai trò hệ thống cố định')
      } else {
        const msg = errorData?.message || 'Không thể xóa vai trò'
        toast.error(msg)
      }
    },
  })

  // Assign Permissions
  const assignMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesService.assignPermissions(roleId, permissionIds),
    onSuccess: () => {
      toast.success('Lưu cấu hình phân quyền thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles', selectedRoleId] })
      queryClient.invalidateQueries({ queryKey: ['roles'], exact: true })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể gán quyền hạn'
      toast.error(msg)
    },
  })

  // ─── Actions handlers ──────────────────────────────────────────────────────

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim() || !newRoleCode.trim()) {
      toast.error('Vui lòng nhập đầy đủ tên và mã vai trò')
      return
    }
    createMutation.mutate({
      name: newRoleName,
      code: newRoleCode.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      description: newRoleDesc,
    })
  }

  const handleUpdateRoleInfo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoleId) return
    updateMutation.mutate({
      id: selectedRoleId,
      payload: { name: editRoleName, description: editRoleDesc },
    })
  }

  const handleDeleteRole = () => {
    if (!selectedRoleId) return
    if (confirm('Bạn có chắc chắn muốn xóa vai trò này? Tất cả thành viên thuộc vai trò này sẽ bị ảnh hưởng.')) {
      deleteMutation.mutate(selectedRoleId)
    }
  }

  const handleSavePermissions = () => {
    if (!selectedRoleId) return
    assignMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: selectedPermIds,
    })
  }

  const handleTogglePermission = (id: string) => {
    if (roleDetail?.code === 'super_admin') return // protected
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleModule = (modulePerms: SystemPermission[]) => {
    if (roleDetail?.code === 'super_admin') return // protected
    const moduleIds = modulePerms.map((p) => p.id)
    const hasAll = moduleIds.every((id) => selectedPermIds.includes(id))

    if (hasAll) {
      setSelectedPermIds((prev) => prev.filter((id) => !moduleIds.includes(id)))
    } else {
      setSelectedPermIds((prev) => {
        const others = prev.filter((id) => !moduleIds.includes(id))
        return [...others, ...moduleIds]
      })
    }
  }

  // ─── UI Render Logic ───────────────────────────────────────────────────────

  if (!canView) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Shield className="h-12 w-12 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">Từ chối truy cập</h3>
        <p className="text-muted-foreground">Bạn không có quyền quản trị vai trò & quyền hạn.</p>
      </div>
    )
  }

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const permissionsByModule = groupPermissionsByModule(allPermissions)
  const isSuperAdminRole = roleDetail?.code === 'super_admin'
  const isSystemRole = roleDetail && ['super_admin', 'admin', 'editor', 'author'].includes(roleDetail.code)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vai trò & Quyền hạn</h2>
          <p className="text-muted-foreground">Cấu hình phân quyền hệ thống theo nhóm vai trò quản trị (RBAC).</p>
        </div>
        <RoleCreateDialog
          open={newRoleOpen}
          onOpenChange={setNewRoleOpen}
          newRoleName={newRoleName}
          setNewRoleName={setNewRoleName}
          newRoleCode={newRoleCode}
          setNewRoleCode={setNewRoleCode}
          newRoleDesc={newRoleDesc}
          setNewRoleDesc={setNewRoleDesc}
          onSubmit={handleCreateRole}
          isSaving={createMutation.isPending}
          slugifyCode={slugifyCode}
          canCreate={canCreate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Roles List (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Danh sách vai trò</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {filteredRoles.length} vai trò
                </Badge>
              </CardTitle>
              <CardDescription>Chọn vai trò để quản lý cấu hình chi tiết.</CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-2.5 top-5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm vai trò..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingRoles ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Không tìm thấy vai trò nào.
                </div>
              ) : (
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                  {filteredRoles.map((role) => {
                    const isSelected = selectedRoleId === role.id
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={cn(
                          'w-full text-left p-4 transition-all flex items-start justify-between gap-3 hover:bg-muted/50 cursor-pointer border-l-2',
                          isSelected
                            ? 'bg-primary/5 border-l-primary hover:bg-primary/10'
                            : 'border-l-transparent text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <div className="min-w-0">
                          <p className={cn('font-semibold text-sm', isSelected && 'text-primary')}>
                            {role.name}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                            {role.code}
                          </p>
                          {role.description && (
                            <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0 font-mono text-xs">
                          {role.permissions_count} quyền
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Details & Permissions (col-span-8) */}
        <div className="lg:col-span-8">
          {!selectedRoleId ? (
            <Card className="bg-card">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <Shield className="h-12 w-12 text-muted-foreground/30" />
                <div>
                  <p className="font-semibold text-sm">Chưa có vai trò nào được chọn</p>
                  <p className="text-xs text-muted-foreground">
                    Chọn hoặc tạo một vai trò mới từ danh sách bên trái để cấu hình.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isLoadingDetail ? (
            <Card className="bg-card">
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {[1, 2, 3].map((i) => (
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
          ) : (
            <div className="space-y-6">
              {/* Form Info Card */}
              <RoleInfoForm
                roleDetail={roleDetail}
                isSuperAdminRole={isSuperAdminRole}
                isSystemRole={isSystemRole}
                canUpdate={canUpdate}
                canDelete={canDelete}
                editRoleName={editRoleName}
                setEditRoleName={setEditRoleName}
                editRoleDesc={editRoleDesc}
                setEditRoleDesc={setEditRoleDesc}
                onUpdateRoleInfo={handleUpdateRoleInfo}
                onDeleteRole={handleDeleteRole}
                isUpdating={updateMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />

              {/* Protection Alert for Super Admin */}
              {isSuperAdminRole && (
                <div className="rounded-lg border bg-primary/5 p-4 flex items-start gap-3 text-sm text-primary">
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bảo vệ quyền Super Admin</p>
                    <p className="text-xs mt-0.5 opacity-90">
                      Tài khoản thuộc vai trò <span className="font-semibold">Super Admin</span> tự động có toàn bộ quyền hệ thống. Backend không cho phép sửa đổi hoặc gán quyền hạn thủ công cho vai trò này để tránh các lỗi bảo mật nghiêm trọng.
                    </p>
                  </div>
                </div>
              )}

              {/* Checkbox Grid Card */}
              <RolePermissionGrid
                permissionsByModule={permissionsByModule}
                selectedPermIds={selectedPermIds}
                onTogglePermission={handleTogglePermission}
                onToggleModule={handleToggleModule}
                isSuperAdminRole={isSuperAdminRole}
                canAssign={canAssign}
                isLoadingPerms={isLoadingPerms}
                roleDetail={roleDetail}
                onSavePermissions={handleSavePermissions}
                onRestore={() => setSelectedPermIds(roleDetail?.permissions.map((p) => p.id) || [])}
                isSaving={assignMutation.isPending}
              />
            </div>
          )}
        </div>
      </div>

      <AssignWarningDialog
        open={assignWarningOpen}
        onOpenChange={setAssignWarningOpen}
        message={assignWarningMessage}
      />
    </div>
  )
}

export default RolesPage
