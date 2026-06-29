import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SortingState, RowSelectionState, PaginationState } from '@tanstack/react-table'
import {
  Building2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Users,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'
import { DataTable } from '@/shared/components/DataTable'
import { DepartmentForm } from '../components/DepartmentForm'
import { getDepartmentColumns } from '../components/departmentColumns'
import { departmentService } from '../services/departmentService'
import { toast } from 'sonner'

export function DepartmentsPage() {
  const queryClient = useQueryClient()
  
  // UI states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  
  // Table states (Server-side pagination & sorting)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'sort_order', desc: false }
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // 1. Query: Fetch department list (Server-side paginated & sorted)
  const listParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    sort_by: sorting[0]?.id as 'sort_order' | 'name' | 'created_at' || 'sort_order',
    order: sorting[0]?.desc ? 'desc' as const : 'asc' as const,
  }), [pagination, sorting])

  const {
    data: departmentData = { items: [], total_items: 0, total_pages: 1 },
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['departments', listParams],
    queryFn: () => departmentService.list(listParams),
  })

  const departments = departmentData.items

  // 2. Query: Fetch stats from Backend API
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['departments-stats'],
    queryFn: () => departmentService.getStats(),
  })

  // 3. Query: Fetch details for the editing department
  const { data: editingDepartment = null, isFetching: isFetchingDetail } = useQuery({
    queryKey: ['departments', editingDepartmentId],
    queryFn: () => departmentService.getDetail(editingDepartmentId!),
    enabled: !!editingDepartmentId,
  })

  // 4. Mutation: Create a new department
  const createMutation = useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => {
      toast.success('Thêm bộ môn mới thành công!')
      setIsFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const errorCode = errorData?.error_code || errorData?.code
      const msg = errorData?.message
 
      if (errorCode === 'DUPLICATE_DEPARTMENT_NAME') {
        toast.error('Tên bộ môn đã tồn tại trong hệ thống. Vui lòng chọn tên khác.')
      } else {
        toast.error(msg || 'Không thể tạo bộ môn. Vui lòng thử lại.')
      }
    },
  })

  // 5. Mutation: Update an existing department
  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      departmentService.update(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật bộ môn thành công!')
      setEditingDepartmentId(null)
      setIsFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const errorCode = errorData?.error_code || errorData?.code
      const msg = errorData?.message
 
      if (errorCode === 'DUPLICATE_DEPARTMENT_NAME') {
        toast.error('Tên bộ môn đã tồn tại trong hệ thống. Vui lòng chọn tên khác.')
      } else {
        toast.error(msg || 'Không thể cập nhật bộ môn. Vui lòng thử lại.')
      }
    },
  })

  // 6. Mutation: Toggle active status (Switch)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      departmentService.updateStatus(id, { is_active }),
    onSuccess: (data) => {
      toast.success(`Đã ${data.is_active ? 'bật' : 'tắt'} hoạt động bộ môn "${data.name}"`)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể thay đổi trạng thái bộ môn.'
      toast.error(msg)
    },
  })

  // 7. Mutation: Soft delete department
  const deleteMutation = useMutation({
    mutationFn: departmentService.delete,
    onSuccess: () => {
      toast.success('Xóa bộ môn thành công!')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const errorCode = errorData?.error_code || errorData?.code
      const msg = errorData?.message
 
      if (errorCode === 'CANNOT_DELETE_ACTIVE_DEPARTMENT') {
        toast.error(msg || 'Không thể xóa bộ môn này vì hiện có giảng viên đang sinh hoạt.')
      } else {
        toast.error(msg || 'Không thể xóa bộ môn. Vui lòng thử lại.')
      }
    },
  })

  // 8. Bulk Mutations (Client-side Promise.all wrapper)
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      return Promise.all(ids.map((id) => departmentService.updateStatus(id, { is_active })))
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái hàng loạt thành công!')
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái hàng loạt.'
      toast.error(msg)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => departmentService.delete(id)))
    },
    onSuccess: () => {
      toast.success('Xóa hàng loạt bộ môn thành công!')
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const msg = errorData?.message || 'Có lỗi xảy ra hoặc một số bộ môn đang chứa nhân sự nên không thể xóa.'
      toast.error(msg)
    },
  })

  // Handlers (useCallback to prevent unnecessary table/form re-renders)
  const handleEditClick = useCallback((id: string) => {
    setEditingDepartmentId(id)
    setIsFormOpen(true)
  }, [])

  const handleAddClick = useCallback(() => {
    setEditingDepartmentId(null)
    setIsFormOpen(true)
  }, [])

  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingDepartmentId(null)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = useCallback((values: any) => {
    if (editingDepartmentId) {
      updateMutation.mutate({ id: editingDepartmentId, payload: values })
    } else {
      createMutation.mutate(values)
    }
  }, [editingDepartmentId, updateMutation, createMutation])

  const handleToggleStatus = useCallback((id: string, active: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: active })
  }, [toggleStatusMutation])

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])

  // Get selected UUIDs from React Table index
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((index) => departments[Number(index)]?.id)
      .filter(Boolean)
  }, [rowSelection, departments])

  // Bulk Handlers
  const handleBulkStatusChange = (active: boolean) => {
    if (selectedIds.length === 0) return
    bulkStatusMutation.mutate({ ids: selectedIds, is_active: active })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    
    // Check if any selected department has staff linked to it (safeguard)
    const hasLinkedStaff = Object.keys(rowSelection).some((index) => {
      const dept = departments[Number(index)]
      return dept && dept.staff_count > 0
    })
 
    if (hasLinkedStaff) {
      toast.error('Một hoặc nhiều bộ môn được chọn đang chứa giảng viên. Vui lòng bỏ chọn để thực hiện xóa.')
      return
    }
 
    if (confirm(`Bạn có chắc chắn muốn xóa hàng loạt ${selectedIds.length} bộ môn đã chọn?`)) {
      bulkDeleteMutation.mutate(selectedIds)
    }
  }

  // Columns definition using memo
  const columns = useMemo(() => getDepartmentColumns({
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
  }), [handleEditClick, handleDelete, handleToggleStatus])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Quản lý bộ môn
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Danh sách các bộ môn đào tạo thuộc Trường Kỹ thuật và Công nghệ.
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          className="cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-start sm:self-auto text-xs h-9 font-semibold"
        >
          Thêm bộ môn mới
        </Button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isStatsLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card text-card-foreground animate-pulse border shadow-2xs">
              <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-6 w-8 bg-muted rounded mt-1" />
              </div>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng số bộ môn</CardTitle>
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono">{stats.total}</div>
              </CardContent>
            </Card>
 
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đang hoạt động</CardTitle>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono text-emerald-600">{stats.active}</div>
              </CardContent>
            </Card>
 
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Không hoạt động</CardTitle>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono text-amber-600">{stats.inactive}</div>
              </CardContent>
            </Card>
 
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng số giảng viên</CardTitle>
                <Users className="h-3.5 w-3.5 text-blue-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono text-blue-600">{stats.total_staff}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* DataTable Container */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-left">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách bộ môn</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Đã xảy ra lỗi khi kết nối đến máy chủ để lấy dữ liệu. Vui lòng kiểm tra lại.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-2xs">
          <DataTable
            columns={columns}
            data={departments}
            pageSize={pagination.pageSize}
            totalCount={departmentData.total_items}
            pageCount={departmentData.total_pages}
            pageIndex={pagination.pageIndex}
            onPageChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
            isLoading={isLoading || isFetching}
            sorting={sorting}
            onSortingChange={setSorting}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 }))}
          />
        </div>
      )}

      {/* Floating Bulk Actions Toolbar (Notion & Vercel Style) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 border-r border-background/20 pr-4">
            <Sparkles className="h-4.5 w-4.5 text-amber-400" />
            <span className="text-sm font-semibold whitespace-nowrap">
              Đã chọn <span className="text-amber-400 font-mono">{selectedIds.length}</span> bộ môn
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 cursor-pointer hover:bg-background/10 text-emerald-400 font-semibold"
              onClick={() => handleBulkStatusChange(true)}
              disabled={bulkStatusMutation.isPending}
            >
              Kích hoạt loạt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 cursor-pointer hover:bg-background/10 text-amber-400 font-semibold"
              onClick={() => handleBulkStatusChange(false)}
              disabled={bulkStatusMutation.isPending}
            >
              Tắt hoạt động loạt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 cursor-pointer hover:bg-destructive/20 text-rose-400 font-semibold"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Xóa hàng loạt
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-background/60 hover:text-background cursor-pointer"
              onClick={() => setRowSelection({})}
              title="Hủy chọn"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Form (Add/Edit Modal) */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCancelForm()}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border">
          {editingDepartmentId && isFetchingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải thông tin bộ môn...</p>
            </div>
          ) : (
            <DepartmentForm
              initialData={editingDepartmentId ? editingDepartment : null}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
