import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SortingState, RowSelectionState } from '@tanstack/react-table'
import { useNavigate, useSearchParams } from 'react-router'
import {
  Images,
  AlertCircle,
  RefreshCw,
  Plus,
  Building,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DataTable } from '@/shared/components/DataTable'
import { toast } from 'sonner'
import { getGalleryColumns } from '../components/galleryColumns'
import { galleryService } from '../services/galleryService'
import { departmentService } from '@/features/departments/services/departmentService'

export function GalleriesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // Table row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  
  // Table states (URL Search Params)
  const [searchParams, setSearchParams] = useSearchParams()

  const pageParam = Number(searchParams.get('page'))
  const pageIndex = (pageParam && pageParam > 0) ? pageParam - 1 : 0
  const pageSize = Number(searchParams.get('page_size')) || 10
  const sortBy = searchParams.get('sort_by') || 'sort_order'
  const sortDir = searchParams.get('sort_dir') || 'asc'
  const searchVal = searchParams.get('search') || ''
  const departmentFilter = searchParams.get('department_id') || 'all'

  // Chuẩn hóa trang nếu URL chứa page=0 hoặc nhỏ hơn 1
  useEffect(() => {
    const pParam = searchParams.get('page')
    if (pParam !== null) {
      const pageNum = Number(pParam)
      if (isNaN(pageNum) || pageNum < 1) {
        setSearchParams((prev) => {
          prev.set('page', '1')
          return prev
        })
      }
    }
  }, [searchParams, setSearchParams])

  const [searchInput, setSearchInput] = useState(searchVal)

  // Sync local search input with URL search params
  useEffect(() => {
    setSearchInput(searchVal)
  }, [searchVal])

  const listParams = useMemo(() => ({
    page: pageIndex + 1,
    page_size: pageSize,
    search: searchVal || undefined,
    department_id: departmentFilter === 'all' ? undefined : departmentFilter,
  }), [pageIndex, pageSize, searchVal, departmentFilter])

  // 1. Query: Fetch galleries list from Backend API
  const {
    data: galleryData = { items: [], total: 0, total_pages: 1 },
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['galleries', listParams],
    queryFn: () => galleryService.list(listParams),
  })

  // 2. Query: Fetch departments for filter dropdown
  const { data: departmentData } = useQuery({
    queryKey: ['departments-for-gallery-filter'],
    queryFn: () => departmentService.list({ page_size: 200 }),
  })

  const departments = departmentData?.items || []

  // 3. Mutation: Toggle active status (Switch)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      galleryService.updateStatus(id, { is_active }),
    onSuccess: () => {
      toast.success('Đổi trạng thái Album thành công!')
      queryClient.invalidateQueries({ queryKey: ['galleries'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Không thể thay đổi trạng thái Album.')
    },
  })

  // 4. Mutation: Delete gallery
  const deleteMutation = useMutation({
    mutationFn: galleryService.delete,
    onSuccess: () => {
      toast.success('Xóa Album thành công!')
      queryClient.invalidateQueries({ queryKey: ['galleries'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Không thể xóa Album. Vui lòng thử lại.')
    },
  })

  // Handlers
  const handleEditClick = (id: string) => {
    navigate(`/galleries/${id}/edit`)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Album này không?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleStatus = (id: string, active: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: active })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams((prev) => {
      if (searchInput) {
        prev.set('search', searchInput.trim())
      } else {
        prev.delete('search')
      }
      prev.set('page', '1') // reset page when search
      return prev
    })
  }

  const handleDepartmentFilterChange = (val: string) => {
    setSearchParams((prev) => {
      if (val === 'all') {
        prev.delete('department_id')
      } else {
        prev.set('department_id', val)
      }
      prev.set('page', '1')
      return prev
    })
  }

  // Tanstack table pagination & sorting config mapping
  const pagination = useMemo(() => ({
    pageIndex,
    pageSize,
  }), [pageIndex, pageSize])

  const sorting = useMemo<SortingState>(() => [
    { id: sortBy, desc: sortDir === 'desc' }
  ], [sortBy, sortDir])

  const setSorting = (updater: any) => {
    const nextSorting = typeof updater === 'function' ? updater(sorting) : updater
    if (nextSorting && nextSorting.length > 0) {
      setSearchParams((prev) => {
        prev.set('sort_by', nextSorting[0].id)
        prev.set('sort_dir', nextSorting[0].desc ? 'desc' : 'asc')
        return prev
      })
    }
  }

  const columns = useMemo(() => getGalleryColumns({
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
  }), [handleEditClick, handleDelete, handleToggleStatus])

  return (
    <div className="space-y-6 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            Quản lý Album ảnh (Gallery)
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý album hình ảnh hoạt động học thuật và nghiên cứu của các Khoa/Bộ môn.
          </p>
        </div>
        <Button
          onClick={() => navigate('/galleries/create')}
          className="cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-start sm:self-auto text-xs h-9 font-semibold"
        >
          <Plus className="h-4 w-4" />
          Thêm Album mới
        </Button>
      </div>

      {/* Filter and Search Section */}
      <Card className="border shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex items-center gap-2 shrink-0">
            <Input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề Album..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="text-xs h-9 bg-background focus-visible:ring-primary/20 flex-1"
            />
            <Button type="submit" size="sm" className="h-9 px-3 text-xs font-semibold cursor-pointer">
              Tìm
            </Button>
          </form>

          {/* Department Filter */}
          <div className="w-full md:w-60 flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={departmentFilter}
              onValueChange={handleDepartmentFilterChange}
            >
              <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20 flex-1">
                <SelectValue placeholder="Tất cả đơn vị..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                {departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id} className="text-xs">
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Section */}
      {isError ? (
        <Card className="border shadow-2xs">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách Album</h3>
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
            data={galleryData.items}
            pageSize={pageSize}
            totalCount={galleryData.total}
            pageCount={galleryData.total_pages}
            pageIndex={pageIndex}
            onPageChange={(nextIdx) => setSearchParams((prev) => {
              prev.set('page', String(nextIdx + 1))
              return prev
            })}
            isLoading={isLoading || isFetching}
            sorting={sorting}
            onSortingChange={setSorting}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onPageSizeChange={(nextSize) => setSearchParams((prev) => {
              prev.set('page_size', String(nextSize))
              prev.set('page', '1')
              return prev
            })}
          />
        </div>
      )}
    </div>
  )
}
