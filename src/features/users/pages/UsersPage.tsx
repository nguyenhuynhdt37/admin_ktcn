import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  User,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { DataTable } from '@/shared/components/DataTable'

import { useAuthStore } from '@/stores/authStore'
import { usersService } from '../services/usersService'
import type { UserData, RoleData } from '../types/users.types'

export function UsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const isAdmin = !!currentUser?.is_admin || !!currentUser?.roles?.includes('super_admin')
  const isCallerSuperAdmin = currentUser?.roles?.includes('super_admin') || false

  // Permissions check
  const canView = isAdmin
  const canCreate = isAdmin
  const canUpdate = isAdmin
  const canDelete = isAdmin

  // Query Params from URL
  const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
  const pageSize = 10
  const roleFilter = searchParams.get('role_code') || 'all'
  const isDeletedFilter = searchParams.get('is_deleted') === 'true'
  const statusFilter = isDeletedFilter ? 'deleted' : (searchParams.get('is_active') === 'true' ? 'active' : (searchParams.get('is_active') === 'false' ? 'inactive' : 'all'))

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Sync search input with URL search params
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1') // reset trang khi tìm kiếm
    setSearchParams(params)
  }, [debouncedSearch])

  const handleRoleFilterChange = (val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val !== 'all') {
      params.set('role_code', val)
    } else {
      params.delete('role_code')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleStatusFilterChange = (val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val === 'active') {
      params.set('is_active', 'true')
      params.delete('is_deleted')
    } else if (val === 'inactive') {
      params.set('is_active', 'false')
      params.delete('is_deleted')
    } else if (val === 'deleted') {
      params.set('is_deleted', 'true')
      params.delete('is_active')
    } else {
      params.delete('is_active')
      params.delete('is_deleted')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage + 1))
    setSearchParams(params)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, statusFilter, page, isDeletedFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page + 1), // API expects 1-indexed page
        page_size: String(pageSize),
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (roleFilter !== 'all') params.role_code = roleFilter
      if (isDeletedFilter) {
        params.is_deleted = 'true'
      } else if (statusFilter !== 'all') {
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
      toast.success('Tài khoản đã được xóa mềm. Bạn có thể chuyển sang bộ lọc "Đã xóa" để khôi phục.')
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

  // Restore User Mutation
  const restoreMutation = useMutation({
    mutationFn: usersService.restore,
    onSuccess: () => {
      toast.success('Khôi phục tài khoản thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      const errorData = err?.response?.data?.error
      toast.error(errorData?.message || 'Không thể khôi phục tài khoản')
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
        const roles = (row.getValue('roles') || []) as RoleData[]
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
        if (isDeletedFilter) {
          return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 font-medium">
              Đã xóa
            </Badge>
          )
        }
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

        const isTargetSuperAdmin = user.roles?.some((r) => r.code === 'super_admin') || false
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
              {isDeletedFilter ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/20"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn khôi phục thành viên "${user.full_name}"?`)) {
                        restoreMutation.mutate(user.id)
                      }
                    }}
                  >
                    Khôi phục tài khoản
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {(isAdmin || user.id === currentUser?.id) && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/users/${user.id}/activity`)}>
                      Xem hoạt động
                    </DropdownMenuItem>
                  )}
                  {canUpdate && canModify && (isAdmin || user.id === currentUser?.id) && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate(`/users/${user.id}/edit`)}
                    >
                      Chỉnh sửa
                    </DropdownMenuItem>
                  )}
                  {canDelete && canModify && user.id !== currentUser?.id && isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${user.full_name}"?`)) {
                            deleteMutation.mutate(user.id)
                          }
                        }}
                      >
                        Xóa thành viên
                      </DropdownMenuItem>
                    </>
                  )}
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
            onValueChange={handleRoleFilterChange}
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
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm khóa</SelectItem>
              <SelectItem value="deleted">Đã xóa</SelectItem>
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
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default UsersPage
