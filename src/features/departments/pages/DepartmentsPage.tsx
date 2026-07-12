import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SortingState, RowSelectionState, PaginationState } from '@tanstack/react-table'
import { useNavigate, useSearchParams } from 'react-router'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { DataTable } from '@/shared/components/DataTable'
import { getDepartmentColumns } from '../components/departmentColumns'
import { departmentService } from '../services/departmentService'
import { toast } from 'sonner'
import { getMediaUrl } from '@/features/articles/utils/media'

export function DepartmentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // UI states
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[]
    staffs: { id: string; full_name: string; avatar_object_key: string | null; position_name: string; department_id: string }[]
    isLoading: boolean
  } | null>(null)
  
  // Table states (URL Search Params)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [searchParams, setSearchParams] = useSearchParams()

  const pageParam = Number(searchParams.get('page'))
  const pageIndex = (pageParam && pageParam > 0) ? pageParam - 1 : 0
  const pageSize = Number(searchParams.get('page_size')) || 10
  const sortBy = searchParams.get('sort_by') || 'sort_order'
  const sortDir = searchParams.get('sort_dir') || 'asc'

  // Chuẩn hóa trang nếu URL chứa page=0 hoặc nhỏ hơn 1
  useEffect(() => {
    const pParam = searchParams.get('page')
    if (pParam !== null) {
      const pageNum = Number(pParam)
      if (isNaN(pageNum) || pageNum < 1) {
        const params = new URLSearchParams(searchParams)
        params.set('page', '1')
        setSearchParams(params)
      }
    }
  }, [searchParams, setSearchParams])

  const pagination = useMemo<PaginationState>(() => ({
    pageIndex,
    pageSize,
  }), [pageIndex, pageSize])

  const sorting = useMemo<SortingState>(() => [{
    id: sortBy,
    desc: sortDir === 'desc',
  }], [sortBy, sortDir])

  const setPagination = useCallback((value: any) => {
    const params = new URLSearchParams(searchParams)
    if (typeof value === 'function') {
      const next = value({ pageIndex, pageSize })
      params.set('page', String(next.pageIndex + 1))
      params.set('page_size', String(next.pageSize))
    } else {
      params.set('page', String(value.pageIndex + 1))
      params.set('page_size', String(value.pageSize))
    }
    setSearchParams(params)
  }, [pageIndex, pageSize, searchParams, setSearchParams])

  const setSorting = useCallback((value: any) => {
    const params = new URLSearchParams(searchParams)
    const nextSorting = typeof value === 'function' ? value(sorting) : value
    if (nextSorting.length > 0) {
      params.set('sort_by', nextSorting[0].id)
      params.set('sort_dir', nextSorting[0].desc ? 'desc' : 'asc')
      params.set('page', '1')
    }
    setSearchParams(params)
  }, [sorting, searchParams, setSearchParams])

  // 1. Query: Fetch department list (Server-side paginated & sorted)
  const listParams = useMemo(() => ({
    page: pageIndex + 1,
    page_size: pageSize,
    sort_by: sortBy as 'sort_order' | 'name' | 'created_at',
    order: sortDir as 'asc' | 'desc',
  }), [pageIndex, pageSize, sortBy, sortDir])

  const {
    data: departmentData = { items: [], total: 0, total_pages: 1 },
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

  // 3. Mutation: Toggle active status (Switch)
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

  // 4. Mutation: Soft delete department
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

  // 5. Bulk Mutations
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

  // Handlers
  const handleEditClick = useCallback((id: string) => {
    navigate(`/departments/${id}/edit`)
  }, [navigate])

  const handleAddClick = useCallback(() => {
    navigate('/departments/create')
  }, [navigate])

  const handleToggleStatus = useCallback((id: string, active: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: active })
  }, [toggleStatusMutation])

  const handleDelete = useCallback(async (id: string) => {
    setDeleteTarget({ ids: [id], staffs: [], isLoading: true })
    try {
      const staffs = await departmentService.getStaffsToDelete([id])
      setDeleteTarget({ ids: [id], staffs, isLoading: false })
    } catch (err) {
      console.error('Lỗi lấy danh sách giảng viên để xóa:', err)
      setDeleteTarget({ ids: [id], staffs: [], isLoading: false })
    }
  }, [])

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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    setDeleteTarget({ ids: selectedIds, staffs: [], isLoading: true })
    try {
      const staffs = await departmentService.getStaffsToDelete(selectedIds)
      setDeleteTarget({ ids: selectedIds, staffs, isLoading: false })
    } catch (err) {
      console.error('Lỗi lấy danh sách giảng viên để xóa hàng loạt:', err)
      setDeleteTarget({ ids: selectedIds, staffs: [], isLoading: false })
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isStatsLoading || !stats ? (
          Array.from({ length: 3 }).map((_, i) => (
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
            totalCount={departmentData.total}
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

      {/* Custom Cascade Delete Warning Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px] p-6 border text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {deleteTarget && deleteTarget.ids.length > 1 ? 'Xác nhận xóa hàng loạt bộ môn' : 'Xác nhận xóa bộ môn'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hành động này sẽ thực hiện xóa mềm bộ môn khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget?.isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-[10px] text-muted-foreground font-medium animate-pulse">Đang tính toán giảng viên liên đới...</span>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {deleteTarget && deleteTarget.staffs.length > 0 ? (
                <>
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="text-xs leading-relaxed font-medium">
                      CẢNH BÁO: Phát hiện <strong className="text-destructive font-bold">{deleteTarget.staffs.length} giảng viên</strong> đang thuộc bộ môn chuẩn bị xóa. Việc xóa bộ môn sẽ <strong>ĐỒNG THỜI XÓA</strong> toàn bộ giảng viên dưới đây:
                    </div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto border border-border/80 rounded-lg p-2.5 bg-muted/40 space-y-2">
                    {deleteTarget.staffs.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-1.5 border-b last:border-0 border-border/40">
                        <div className="h-9 w-9 rounded-full overflow-hidden border bg-background flex items-center justify-center shrink-0 shadow-xs">
                          {s.avatar_object_key ? (
                            <img src={getMediaUrl(s.avatar_object_key)} alt={s.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-4.5 w-4.5 text-muted-foreground/75" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="font-semibold text-xs text-foreground truncate" title={s.full_name}>
                            {s.full_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate" title={s.position_name}>
                            {s.position_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Bạn có chắc chắn muốn xóa bộ môn đã chọn? Hành động này sẽ được ghi nhận vào nhật ký hệ thống.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="text-xs h-9 cursor-pointer font-medium"
              disabled={deleteTarget?.isLoading || deleteMutation.isPending || bulkDeleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteTarget) {
                  if (deleteTarget.ids.length > 1) {
                    bulkDeleteMutation.mutate(deleteTarget.ids)
                  } else {
                    deleteMutation.mutate(deleteTarget.ids[0])
                  }
                  setDeleteTarget(null)
                }
              }}
              className="text-xs h-9 cursor-pointer font-semibold"
              disabled={deleteTarget?.isLoading || deleteMutation.isPending || bulkDeleteMutation.isPending}
            >
              {deleteMutation.isPending || bulkDeleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
