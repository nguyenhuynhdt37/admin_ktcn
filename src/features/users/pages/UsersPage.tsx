import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { DataTable } from '@/shared/components/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { MoreHorizontal, ArrowUpDown, Plus, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import dayjs from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@/services/http/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { usersService } from '@/features/users/services/usersService'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

interface RoleData {
  id: string
  name: string
  code: string
}

interface UserData {
  id: string
  username: string
  email: string
  phone: string | null
  full_name: string
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  roles: RoleData[]
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()

  const canView = hasPermission('user.view')
  const canCreate = hasPermission('user.create')
  const canUpdate = hasPermission('user.update')
  const canDelete = hasPermission('user.delete')
  const isCallerSuperAdmin = currentUser?.roles?.includes('super_admin')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0) // Reset to first page when search changes
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page + 1), // API expects 1-indexed page
        page_size: String(pageSize),
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (roleFilter !== 'all') params.role_code = roleFilter
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active' ? 'true' : 'false'
      }

      return usersService.list(params)
    },
    enabled: canView,
  })

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: usersService.delete,
    onSuccess: () => {
      toast.success('Tài khoản đã được xóa mềm. Liên hệ quản trị viên nếu cần khôi phục.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      const errorData = err?.response?.data?.error
      const code = errorData?.code
      if (code === 'SELF_DELETION_DENIED') {
        toast.error('Không thể thực hiện: Bạn không thể tự xóa chính tài khoản đang đăng nhập của mình.')
      } else if (code === 'SUPERADMIN_DELETION_DENIED') {
        toast.error('Lỗi bảo mật: Không thể xóa tài khoản của người quản trị tối cao (Super Admin).')
      } else {
        toast.error(errorData?.message || 'Không thể xóa thành viên')
      }
    },
  })

  if (!canView) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-2">
        <h3 className="text-xl font-semibold text-destructive">Truy cập bị từ chối</h3>
        <p className="text-muted-foreground">Bạn không có quyền truy cập chức năng Quản lý thành viên.</p>
      </div>
    )
  }

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: 'username',
      header: 'Tên đăng nhập',
      cell: ({ row }) => <span className="font-medium">{row.getValue('username')}</span>
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 cursor-pointer"
          >
            Họ tên
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="aspect-square h-full w-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium text-foreground">{user.full_name}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'roles',
      header: 'Vai trò',
      cell: ({ row }) => {
        const roles = row.getValue('roles') as RoleData[]
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="text-xs font-normal">
                {role.name}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'destructive'}>
            {isActive ? 'Hoạt động' : 'Tạm khóa'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Ngày tạo',
      cell: ({ row }) => {
        return dayjs(row.getValue('created_at')).format('DD/MM/YYYY')
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original

        const isTargetSuperAdmin = user.roles.some((r) => r.code === 'super_admin')
        const canModify = !isTargetSuperAdmin || isCallerSuperAdmin

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Mở menu thao tác</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigator.clipboard.writeText(user.id)}>
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/users/${user.id}/activity`)}>
                Xem hoạt động
              </DropdownMenuItem>
              {canUpdate && canModify && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}/edit`)}
                >
                  Chỉnh sửa
                </DropdownMenuItem>
              )}
              {canDelete && canModify && user.id !== currentUser?.id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${user.full_name}"? Hành động này không thể hoàn tác.`)) {
                        deleteMutation.mutate(user.id)
                      }
                    }}
                  >
                    Xóa thành viên
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Thành viên</h2>
          <p className="text-muted-foreground">Quản lý danh sách thành viên trong hệ thống.</p>
        </div>
        {canCreate && (
          <Button
            className="cursor-pointer gap-1.5"
            onClick={() => navigate('/users/create')}
          >
            <Plus className="h-4 w-4" />
            Thêm thành viên
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 w-full sm:w-auto gap-4 flex-wrap">
          <Input
            placeholder="Tìm kiếm thành viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
              <SelectItem value="editor">Biên tập viên (Editor)</SelectItem>
              <SelectItem value="author">Tác giả (Author)</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[35vh] flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Đang tải danh sách thành viên...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          pageSize={pageSize}
          totalCount={data?.total || 0}
          pageCount={data?.total_pages || 0}
          pageIndex={page}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

export default UsersPage
