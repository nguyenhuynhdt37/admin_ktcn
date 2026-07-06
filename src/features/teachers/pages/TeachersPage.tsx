import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { SortingState, RowSelectionState, PaginationState } from '@tanstack/react-table'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { SearchableSelect } from '@/shared/components/SearchableSelect'
import {
  GraduationCap,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Users,
  Sparkles,
  Trash2,
  X,
  Search,
  Building2,
  Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { DataTable } from '@/shared/components/DataTable'
import { toast } from 'sonner'
import { teacherService } from '../services/teacherService'
import { getTeacherColumns } from '../components/teacherColumns'
import { departmentService } from '@/features/departments/services/departmentService'
import { positionService } from '@/features/positions/services/positionService'

import { useSearchParams } from 'react-router'
import { useEffect } from 'react'

export function TeachersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Table states (URL Search Params)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [searchParams, setSearchParams] = useSearchParams()

  const pageParam = Number(searchParams.get('page'))
  const pageIndex = (pageParam && pageParam > 0) ? pageParam - 1 : 0
  const pageSize = Number(searchParams.get('page_size')) || 10
  const sortBy = searchParams.get('sort_by') || 'sort_order'
  const sortDir = searchParams.get('sort_dir') || 'asc'
  
  const selectedDeptId = searchParams.get('department_id') || ''
  const selectedPosId = searchParams.get('position_id') || 'all'
  const selectedTitle = searchParams.get('academic_title_id') || 'all'
  const selectedDegree = searchParams.get('degree_id') || 'all'
  const selectedStatus = (searchParams.get('is_active') === 'true' ? 'active' : searchParams.get('is_active') === 'false' ? 'inactive' : 'all') as 'all' | 'active' | 'inactive'
  const urlSearch = searchParams.get('search') || ''

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

  // Filtering & Pagination states
  const [searchInput, setSearchInput] = useState(urlSearch)
  const debouncedSearchQuery = useDebounce(searchInput, 500)

  // UI states
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[] } | null>(null)

  // Đồng bộ search term từ ô input lên URL sau khi debounced
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearchQuery.trim()) {
      params.set('search', debouncedSearchQuery.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1') // reset trang khi tìm kiếm
    setSearchParams(params)
  }, [debouncedSearchQuery])

  // Custom setters để đồng bộ filter lên URL
  const handleDeptFilterChange = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val) {
      params.set('department_id', val)
    } else {
      params.delete('department_id')
    }
    params.set('page', '1')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handlePosFilterChange = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val !== 'all') {
      params.set('position_id', val)
    } else {
      params.delete('position_id')
    }
    params.set('page', '1')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handleTitleFilterChange = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val !== 'all') {
      params.set('academic_title_id', val)
    } else {
      params.delete('academic_title_id')
    }
    params.set('page', '1')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handleDegreeFilterChange = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val !== 'all') {
      params.set('degree_id', val)
    } else {
      params.delete('degree_id')
    }
    params.set('page', '1')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handleStatusFilterChange = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val === 'active') {
      params.set('is_active', 'true')
    } else if (val === 'inactive') {
      params.set('is_active', 'false')
    } else {
      params.delete('is_active')
    }
    params.set('page', '1')
    setSearchParams(params)
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

  // 1. Fetch departments to populate Filter Select
  const { data: departmentData } = useQuery({
    queryKey: ['departments-active'],
    queryFn: () => departmentService.list({ is_active: true, page_size: 100 }),
  })
  const departments = useMemo(() => departmentData?.items || [], [departmentData])

  const activeDeptId = selectedDeptId || departments[0]?.id || ''

  // 2. Fetch positions to populate Filter Select
  const { data: positionData } = useQuery({
    queryKey: ['positions-active'],
    queryFn: () => positionService.list({ is_active: true, page_size: 100 }),
  })
  const positions = useMemo(() => positionData?.items || [], [positionData])

  // 2b. Fetch academic titles to populate Filter Select
  const { data: academicTitles = [] } = useQuery({
    queryKey: ['academic-titles-active'],
    queryFn: () => teacherService.getAcademicTitles(),
  })

  // 2c. Fetch degrees to populate Filter Select
  const { data: degrees = [] } = useQuery({
    queryKey: ['degrees-active'],
    queryFn: () => teacherService.getDegrees(),
  })

  // 3. Query: Fetch staff list (Server-side paginated & filtered)
  const listParams = useMemo(() => ({
    page: pageIndex + 1,
    page_size: pageSize,
    search: debouncedSearchQuery.trim() || null,
    department_id: activeDeptId === 'all' || activeDeptId === '' ? null : activeDeptId,
    position_id: selectedPosId === 'all' ? null : selectedPosId,
    academic_title_id: selectedTitle === 'all' ? null : selectedTitle,
    degree_id: selectedDegree === 'all' ? null : selectedDegree,
    is_active: selectedStatus === 'all' ? null : selectedStatus === 'active',
    sort_by: sortBy as 'full_name' | 'sort_order' | 'created_at',
    order: sortDir as 'asc' | 'desc',
  }), [pageIndex, pageSize, debouncedSearchQuery, activeDeptId, selectedPosId, selectedTitle, selectedDegree, selectedStatus, sortBy, sortDir])

  const {
    data: staffData = { items: [], total_items: 0, total_pages: 1 },
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['teachers', listParams],
    queryFn: () => teacherService.list(listParams),
    enabled: departments.length > 0 && activeDeptId !== '',
  })

  // 4. Query: Fetch stats from Backend API
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['teachers-stats'],
    queryFn: () => teacherService.getStats(),
  })

  // 5. Mutation: Toggle active status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      teacherService.updateStatus(id, { is_active }),
    onSuccess: (data) => {
      toast.success(`Đã cập nhật trạng thái hồ sơ của giảng viên`)
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể cập nhật trạng thái giảng viên.'
      toast.error(msg)
    },
  })

  // 6. Mutation: Soft delete teacher
  const deleteMutation = useMutation({
    mutationFn: teacherService.delete,
    onSuccess: () => {
      toast.success('Xóa hồ sơ giảng viên thành công!')
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể xóa hồ sơ giảng viên. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // 7. Bulk Mutations (Client-side Promise.all wrapper)
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      return Promise.all(ids.map((id) => teacherService.updateStatus(id, { is_active })))
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái hàng loạt thành công!')
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật hàng loạt.'
      toast.error(msg)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => teacherService.delete(id)))
    },
    onSuccess: () => {
      toast.success('Xóa hàng loạt hồ sơ giảng viên thành công!')
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi xóa hàng loạt.'
      toast.error(msg)
    },
  })

  // Handlers
  const handleEditClick = useCallback((id: string) => {
    navigate(`/teachers/${id}/edit`)
  }, [navigate])

  const handleAddClick = useCallback(() => {
    navigate('/teachers/create')
  }, [navigate])

  const handleViewClick = useCallback((slug: string) => {
    navigate(`/teachers/${slug}`)
  }, [navigate])

  const handleToggleStatus = useCallback((id: string, active: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: active })
  }, [toggleStatusMutation])

  const handleDelete = useCallback((id: string) => {
    setDeleteTarget({ ids: [id] })
  }, [])

  // Get selected UUIDs from selection state
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((index) => staffData.items[Number(index)]?.id)
      .filter(Boolean)
  }, [rowSelection, staffData.items])

  // Bulk handlers
  const handleBulkStatusChange = (active: boolean) => {
    if (selectedIds.length === 0) return
    bulkStatusMutation.mutate({ ids: selectedIds, is_active: active })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setDeleteTarget({ ids: selectedIds })
  }

  // Map list options for SearchableSelect
  const deptOptions = useMemo(() => {
    return departments.map((d) => ({ value: d.id, label: d.name }))
  }, [departments])

  const posOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Tất cả chức vụ' },
      ...positions.map((p) => ({ value: p.id, label: p.name }))
    ]
  }, [positions])

  // Columns definition
  const columns = useMemo(() => getTeacherColumns({
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onView: handleViewClick,
  }), [handleEditClick, handleDelete, handleToggleStatus, handleViewClick])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Danh sách giảng viên
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý hồ sơ giảng viên, học hàm học vị, điện thoại liên hệ và lý lịch khoa học trong khoa.
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          className="cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-start sm:self-auto text-xs h-9 font-semibold"
        >
          Thêm giảng viên mới
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
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng giảng viên</CardTitle>
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono">{stats.staffs?.total || 0}</div>
              </CardContent>
            </Card>
 
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đang hoạt động</CardTitle>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono text-emerald-600">{stats.staffs?.active || 0}</div>
              </CardContent>
            </Card>
 
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng bộ môn</CardTitle>
                <Building2 className="h-3.5 w-3.5 text-amber-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono text-amber-600">{stats.departments?.total || 0}</div>
              </CardContent>
            </Card>
 
            <Card className="bg-card text-card-foreground border shadow-2xs text-left">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng chức vụ</CardTitle>
                <Briefcase className="h-3.5 w-3.5 text-blue-500" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold font-mono text-blue-600">{stats.positions?.total || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-muted/20 p-3.5 rounded-xl border text-left">
        {/* Tìm kiếm */}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Tìm kiếm</label>
          <div className="relative">
            <Input
              placeholder="Tên giảng viên, email..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
              }}
              className="pl-8 text-xs h-9 bg-background focus-visible:ring-primary/20"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Lọc Bộ môn */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Bộ môn</label>
          <SearchableSelect
            options={deptOptions}
            value={activeDeptId}
            onValueChange={handleDeptFilterChange}
            placeholder="Chọn bộ môn"
            emptyMessage="Không tìm thấy bộ môn."
          />
        </div>

        {/* Lọc Chức vụ */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Chức vụ</label>
          <SearchableSelect
            options={posOptions}
            value={selectedPosId}
            onValueChange={handlePosFilterChange}
            placeholder="Chọn chức vụ"
            emptyMessage="Không tìm thấy chức vụ."
          />
        </div>

        {/* Lọc Học hàm */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Học hàm</label>
          <Select
            value={selectedTitle}
            onValueChange={handleTitleFilterChange}
          >
            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
              <SelectValue placeholder="Chọn học hàm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Tất cả</SelectItem>
              {academicTitles.map((title) => (
                <SelectItem key={title.id} value={title.id} className="text-xs">
                  {title.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lọc Học vị */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Học vị</label>
          <Select
            value={selectedDegree}
            onValueChange={handleDegreeFilterChange}
          >
            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
              <SelectValue placeholder="Chọn học vị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Tất cả</SelectItem>
              {degrees.map((deg) => (
                <SelectItem key={deg.id} value={deg.id} className="text-xs">
                  {deg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataTable Container */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-left">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách giảng viên</h3>
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
            data={staffData.items}
            pageSize={pagination.pageSize}
            totalCount={staffData.total_items}
            pageCount={staffData.total_pages}
            pageIndex={pagination.pageIndex}
            onPageChange={(pageIndex) => setPagination((p: { pageIndex: number; pageSize: number }) => ({ ...p, pageIndex }))}
            isLoading={isLoading || isFetching}
            sorting={sorting}
            onSortingChange={setSorting}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onPageSizeChange={(pageSize) => setPagination((p: { pageIndex: number; pageSize: number }) => ({ ...p, pageSize, pageIndex: 0 }))}
          />
        </div>
      )}

      {/* Floating Bulk Actions Toolbar (Notion & Vercel Style) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 border-r border-background/20 pr-4">
            <Sparkles className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
            <span className="text-sm font-semibold whitespace-nowrap">
              Đã chọn <span className="text-amber-400 font-mono">{selectedIds.length}</span> giảng viên
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

      {/* Custom Delete Warning Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px] p-6 border text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {deleteTarget && deleteTarget.ids.length > 1 ? 'Xác nhận xóa hàng loạt hồ sơ' : 'Xác nhận xóa hồ sơ'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hành động này sẽ thực hiện xóa mềm hồ sơ giảng viên khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa {deleteTarget && deleteTarget.ids.length > 1 ? 'các giảng viên đã chọn' : 'giảng viên này'}? Hành động này sẽ được ghi nhận vào nhật ký hệ thống.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="text-xs h-9 cursor-pointer font-medium"
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
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
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
            >
              {deleteMutation.isPending || bulkDeleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
