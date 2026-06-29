import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SortingState, RowSelectionState, PaginationState } from '@tanstack/react-table'
import {
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Plus
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'
import { SearchableSelect } from '@/shared/components/SearchableSelect'
import { DataTable } from '@/shared/components/DataTable'
import { BannerForm } from '../components/BannerForm'
import { getBannerColumns } from '../components/bannerColumns'
import { bannerService } from '../services/bannerService'
import { BannerPosition } from '../types'
import { toast } from 'sonner'
import { useDebounce } from '@/shared/hooks/useDebounce'

const positionFilterOptions = [
  { value: 'all', label: 'Tất cả vị trí hiển thị' },
  { value: BannerPosition.HOME_HERO, label: 'Carousel trượt lớn đầu trang chủ' },
  { value: BannerPosition.HOME_POPUP, label: 'Popup thông báo trang chủ' },
  { value: BannerPosition.HOME_TOP, label: 'Banner ngang phía trên trang chủ' },
  { value: BannerPosition.NEWS_TOP, label: 'Banner đầu trang tin tức' },
  { value: BannerPosition.CATEGORY_TOP, label: 'Banner đầu trang danh mục' },
  { value: BannerPosition.PAGE_TOP, label: 'Banner đầu trang tĩnh/trang con' },
]

export function BannersPage() {
  const queryClient = useQueryClient()

  // UI states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null)

  // Filters & Table states
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchQuery = useDebounce(searchInput, 500)
  const [selectedPosition, setSelectedPosition] = useState<string>('all')

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'sort_order', desc: false }
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // 1. Query: Fetch banners list (Server-side paginated & filtered)
  const listParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    search: debouncedSearchQuery.trim() || null,
    position: selectedPosition === 'all' ? null : selectedPosition,
    sort_by: sorting[0]?.id || 'sort_order',
    order: (sorting[0]?.desc ? 'desc' as const : 'asc' as const),
  }), [pagination, debouncedSearchQuery, selectedPosition, sorting])

  const {
    data: bannerData = { items: [], total_items: 0, total_pages: 1 },
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['banners', listParams],
    queryFn: () => bannerService.listAdmin(listParams),
  })

  const banners = bannerData.items

  // 2. Query: Fetch details for editing banner
  const { data: editingBanner = null, isFetching: isFetchingDetail } = useQuery({
    queryKey: ['banners', editingBannerId],
    queryFn: () => bannerService.getDetail(editingBannerId!),
    enabled: !!editingBannerId,
  })

  // 3. Mutation: Create banner
  const createMutation = useMutation({
    mutationFn: bannerService.create,
    onSuccess: () => {
      toast.success('Thêm banner mới thành công!')
      setIsFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể tạo banner mới. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // 4. Mutation: Update banner
  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      bannerService.update(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật banner thành công!')
      setEditingBannerId(null)
      setIsFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể cập nhật banner. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // 5. Mutation: Toggle active status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      bannerService.updateStatus(id, { is_active }),
    onSuccess: (data) => {
      toast.success(`Đã ${data.is_active ? 'bật' : 'tắt'} hiển thị banner "${data.title}"`)
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể thay đổi trạng thái banner.'
      toast.error(msg)
    },
  })

  // 6. Mutation: Soft delete banner
  const deleteMutation = useMutation({
    mutationFn: bannerService.delete,
    onSuccess: () => {
      toast.success('Xóa banner thành công!')
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể xóa banner. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // Handlers
  const handleAddClick = useCallback(() => {
    setEditingBannerId(null)
    setIsFormOpen(true)
  }, [])

  const handleEditClick = useCallback((id: string) => {
    setEditingBannerId(id)
    setIsFormOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      deleteMutation.mutate(id)
    }
  }, [deleteMutation])

  const handleToggleStatus = useCallback((id: string, is_active: boolean) => {
    toggleStatusMutation.mutate({ id, is_active })
  }, [toggleStatusMutation])

  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingBannerId(null)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = (values: any) => {
    if (editingBannerId) {
      updateMutation.mutate({ id: editingBannerId, payload: values })
    } else {
      createMutation.mutate(values)
    }
  }

  // Column definitions
  const columns = useMemo(() => getBannerColumns({
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
            <ImageIcon className="h-6 w-6 text-primary" />
            Quản lý Banner quảng cáo
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý danh sách, vị trí, thứ tự hiển thị và thời gian hiệu lực của các banner truyền thông trên website.
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          className="cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-start sm:self-auto text-xs h-9 font-semibold"
        >
          <Plus className="h-4 w-4" />
          Thêm banner mới
        </Button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-muted/20 p-3.5 rounded-xl border text-left">
        {/* Tìm kiếm tiêu đề */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Tìm kiếm</label>
          <div className="relative">
            <Input
              placeholder="Nhập tiêu đề banner..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-8 text-xs h-9 bg-background focus-visible:ring-primary/20"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Lọc vị trí */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Vị trí hiển thị</label>
          <SearchableSelect
            options={positionFilterOptions}
            value={selectedPosition}
            onValueChange={(val) => {
              setSelectedPosition(val)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            placeholder="Tất cả vị trí"
            emptyMessage="Không tìm thấy vị trí."
          />
        </div>

        {/* Reset Filter Button */}
        {(searchInput !== '' || selectedPosition !== 'all') && (
          <div className="flex items-end pb-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('')
                setSelectedPosition('all')
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* DataTable Container */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-left">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách banner</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Đã xảy ra lỗi khi kết nối đến máy chủ để lấy dữ liệu. Vui lòng kiểm tra và thử lại.
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
            data={banners}
            pageSize={pagination.pageSize}
            totalCount={bannerData.total_items}
            pageCount={bannerData.total_pages}
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

      {/* Dialog Form Add/Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCancelForm()}>
        <DialogContent className="sm:max-w-[960px] p-0 overflow-hidden border h-[85vh] max-h-[85vh] flex flex-col">
          {editingBannerId && isFetchingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải thông tin banner...</p>
            </div>
          ) : (
            <BannerForm
              initialData={editingBannerId ? editingBanner : null}
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
export default BannersPage
