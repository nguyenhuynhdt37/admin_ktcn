import * as React from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Archive,
  Globe,
  Eye,
  Calendar,
  Sparkles,
  Trash,
  X
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { SortingState, RowSelectionState } from '@tanstack/react-table'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { DataTable } from '@/shared/components/DataTable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

import { useAuthStore } from '@/stores/authStore'
import { articleService } from '../services/articleService'
import { ArticleFilters } from '../components/ArticleFilters'
import { getArticleColumns } from '../components/articleColumns'
import type { ArticleListParams } from '../types/articles.types'

const initialFilters: ArticleListParams = {
  page: 1,
  page_size: 10,
  search: null,
  category_id: null,
  author_id: null,
  tag_ids: null,
  status: null,
  is_featured: null,
  is_pinned: null,
  is_draft: false, // Loại bỏ nháp khỏi danh sách chính
  created_from: null,
  created_to: null,
  published_from: null,
  published_to: null,
  deleted: false,
  sort_by: 'published_at',
  sort_dir: 'desc',
}

export function ArticlesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [articleToDelete, setArticleToDelete] = React.useState<string | null>(null)
  
  // State quản lý việc chọn các dòng dữ liệu (Row Selection)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Đọc filters và sorting trực tiếp từ URL Search Params làm single source of truth
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = React.useMemo<ArticleListParams>(() => {
    const page = Number(searchParams.get('page')) || 1
    const page_size = Number(searchParams.get('page_size')) || 10
    const search = searchParams.get('search') || null
    const category_id = searchParams.get('category_id') || null
    const author_id = searchParams.get('author_id') || null
    const tag_ids = searchParams.get('tag_ids') ? searchParams.get('tag_ids')!.split(',') : null
    const status = (searchParams.get('status') as any) || null
    const is_featured = searchParams.get('is_featured') === 'true' ? true : searchParams.get('is_featured') === 'false' ? false : null
    const is_pinned = searchParams.get('is_pinned') === 'true' ? true : searchParams.get('is_pinned') === 'false' ? false : null
    const is_draft = searchParams.get('is_draft') === 'true'
    const deleted = searchParams.get('deleted') === 'true'
    
    // Mặc định sắp xếp theo ngày giờ xuất bản giảm dần (published_at - desc)
    const sort_by = searchParams.get('sort_by') || 'published_at'
    const sort_dir = (searchParams.get('sort_dir') as any) || 'desc'

    return {
      page,
      page_size,
      search,
      category_id,
      author_id,
      tag_ids,
      status,
      is_featured,
      is_pinned,
      is_draft,
      deleted,
      sort_by,
      sort_dir,
    }
  }, [searchParams])

  const setFilters = React.useCallback((
    newFilters: ArticleListParams | ((prev: ArticleListParams) => ArticleListParams)
  ) => {
    const nextFilters = typeof newFilters === 'function' ? newFilters(filters) : newFilters
    const params: Record<string, string> = {}
    
    if (nextFilters.page && nextFilters.page > 1) params.page = String(nextFilters.page)
    if (nextFilters.page_size && nextFilters.page_size !== 10) params.page_size = String(nextFilters.page_size)
    if (nextFilters.search) params.search = nextFilters.search
    if (nextFilters.category_id) params.category_id = nextFilters.category_id
    if (nextFilters.author_id) params.author_id = nextFilters.author_id
    if (nextFilters.tag_ids && nextFilters.tag_ids.length > 0) params.tag_ids = nextFilters.tag_ids.join(',')
    if (nextFilters.status) params.status = nextFilters.status
    if (nextFilters.is_featured !== null && nextFilters.is_featured !== undefined) params.is_featured = String(nextFilters.is_featured)
    if (nextFilters.is_pinned !== null && nextFilters.is_pinned !== undefined) params.is_pinned = String(nextFilters.is_pinned)
    if (nextFilters.is_draft) params.is_draft = 'true'
    if (nextFilters.deleted) params.deleted = 'true'
    
    params.sort_by = nextFilters.sort_by || 'published_at'
    params.sort_dir = nextFilters.sort_dir || 'desc'

    setSearchParams(params)
  }, [filters, setSearchParams])

  const sorting = React.useMemo<SortingState>(() => {
    const sortBy = searchParams.get('sort_by') || 'published_at'
    const sortDir = searchParams.get('sort_dir') || 'desc'
    return [{ id: sortBy, desc: sortDir === 'desc' }]
  }, [searchParams])

  const handleSortingChange = React.useCallback((
    updaterOrValue: SortingState | ((prev: SortingState) => SortingState)
  ) => {
    const nextSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue
    if (nextSorting.length > 0) {
      const sortField = nextSorting[0].id
      const sortDir = nextSorting[0].desc ? 'desc' : 'asc'
      setFilters((prev) => ({
        ...prev,
        sort_by: sortField,
        sort_dir: sortDir,
        page: 1,
      }))
    }
  }, [sorting, setFilters])

  // Fetch list articles using React Query
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['articles', filters],
    queryFn: () => articleService.list(filters),
    placeholderData: keepPreviousData,
  })

  // Fetch Stats bài viết nhanh
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['article-stats'],
    queryFn: () => articleService.getStats(),
  })

  // Delete Mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: articleService.delete,
    onSuccess: () => {
      toast.success('Đã chuyển bài viết vào Thùng rác thành công.')
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article-stats'] })
      setArticleToDelete(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi xóa bài viết.'
      toast.error(msg)
    },
  })

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: articleService.restore,
    onSuccess: () => {
      toast.success('Đã khôi phục bài viết thành công.')
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article-stats'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi khôi phục bài viết.'
      toast.error(msg)
    },
  })

  // Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: articleService.archive,
    onSuccess: () => {
      toast.success('Đã lưu trữ bài viết thành công.')
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article-stats'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi lưu trữ bài viết.'
      toast.error(msg)
    },
  })

  // Publish (Restore from archive) Mutation
  const publishMutation = useMutation({
    mutationFn: articleService.publish,
    onSuccess: () => {
      toast.success('Đã xuất bản lại bài viết thành công.')
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article-stats'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi xuất bản bài viết.'
      toast.error(msg)
    },
  })

  // Mutation cập nhật nhanh thuộc tính bài viết (Ghim / Nổi bật)
  const toggleAttributeMutation = useMutation({
    mutationFn: ({ id, attributes }: { id: string; attributes: { is_featured?: boolean; is_pinned?: boolean } }) =>
      articleService.updateAttributes(id, attributes),
    onSuccess: () => {
      toast.success('Cập nhật thuộc tính bài viết thành công.')
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật thuộc tính.'
      toast.error(msg)
    },
  })

  // Bulk Status Update Mutation
  const bulkMutation = useMutation({
    mutationFn: articleService.bulkStatus,
    onSuccess: (res) => {
      toast.success(res.message || 'Thao tác hàng loạt thành công.')
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article-stats'] })
      setRowSelection({}) // Reset lựa chọn sau khi thực thi
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi thao tác hàng loạt.'
      toast.error(msg)
    },
  })

  const handleFilterChange = React.useCallback((newFilters: ArticleListParams) => {
    setFilters(newFilters)
  }, [setFilters])

  const handleResetFilters = React.useCallback(() => {
    setFilters({
      ...initialFilters,
      deleted: filters.deleted,
      sort_by: 'published_at',
      sort_dir: 'desc',
    })
  }, [filters.deleted, setFilters])

  const handlePageChange = React.useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }, [setFilters])

  const handleTabChange = (value: string) => {
    setFilters({
      ...initialFilters,
      deleted: value === 'trash',
      sort_by: 'published_at',
      sort_dir: 'desc',
    })
    setRowSelection({}) // Reset lựa chọn khi chuyển tab
  }

  const handleDeleteConfirm = () => {
    if (articleToDelete) {
      deleteMutation.mutate(articleToDelete)
    }
  }

  // Chuyển đổi state rowSelection từ react-table index thành mảng uuid của article
  const selectedIds = React.useMemo(() => {
    const list = data?.items || []
    return Object.keys(rowSelection)
      .map((index) => list[Number(index)]?.id)
      .filter(Boolean)
  }, [rowSelection, data])

  const handleBulkAction = (action: 'archive' | 'publish' | 'delete' | 'restore') => {
    if (selectedIds.length === 0) return
    
    let actionText = ''
    switch (action) {
      case 'archive':
        actionText = 'lưu trữ'
        break
      case 'publish':
        actionText = 'xuất bản'
        break
      case 'delete':
        actionText = 'xóa tạm'
        break
      case 'restore':
        actionText = 'khôi phục'
        break
    }

    if (confirm(`Bạn có chắc chắn muốn thực hiện ${actionText} hàng loạt đối với ${selectedIds.length} bài viết đã chọn?`)) {
      bulkMutation.mutate({
        article_ids: selectedIds,
        action,
      })
    }
  }

  // Định nghĩa cột table bằng việc gọi helper getArticleColumns từ file tách biệt
  const columns = React.useMemo(() => getArticleColumns({
    deleted: !!filters.deleted,
    currentUser: currentUser,
    onEdit: (id) => navigate(`/articles/${id}/edit`),
    onDelete: setArticleToDelete,
    onRestore: (id) => restoreMutation.mutate(id),
    onArchive: (id) => archiveMutation.mutate(id),
    onPublish: (id) => publishMutation.mutate(id),
    onToggleAttribute: (id, attributes) => toggleAttributeMutation.mutate({ id, attributes }),
  }), [filters.deleted, currentUser, restoreMutation, archiveMutation, publishMutation, toggleAttributeMutation, navigate])

  // Tự động cuộn vùng nội dung chính lên đầu khi chuyển trang hoặc đổi tab hoàn tất (sau khi render dữ liệu mới)
  React.useEffect(() => {
    if (!isFetching && data) {
      const mainContent = document.querySelector('main')
      if (mainContent) {
        mainContent.scrollTop = 0
      }
    }
  }, [filters.page, filters.deleted, isFetching, data])

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Quản lý bài viết
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Danh sách bài viết tin tức, thông báo, sự kiện của Trường Kỹ thuật Công nghệ.
          </p>
        </div>

        {!filters.deleted && (
          <Button asChild className="cursor-pointer shadow-md bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-start sm:self-auto">
            <Link to="/articles/create">
              <Plus className="h-4 w-4" /> Viết bài mới
            </Link>
          </Button>
        )}
      </div>

      {/* Thẻ Thống kê nhanh bài viết (Stats Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isStatsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card text-card-foreground animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-12 bg-muted rounded mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Công khai</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats?.published_count ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lên lịch</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats?.scheduled_count ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lưu trữ</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats?.archived_count ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Thùng rác</CardTitle>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats?.trash_count ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lượt xem tháng</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{(stats?.total_views_this_month ?? 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs chuyển đổi giữa Bài viết và Thùng rác */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <Tabs value={filters.deleted ? 'trash' : 'articles'} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-2 w-[280px]">
            <TabsTrigger value="articles" className="text-xs font-semibold cursor-pointer">
              Bài viết chính
            </TabsTrigger>
            <TabsTrigger value="trash" className="text-xs font-semibold cursor-pointer flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              Thùng rác
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bộ lọc bài viết */}
      <ArticleFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Bảng danh sách hoặc lỗi */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none rounded-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách bài viết</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Đã xảy ra lỗi khi kết nối với máy chủ để lấy dữ liệu. Vui lòng xác thực lại phiên làm việc hoặc thử lại.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          pageSize={filters.page_size || 10}
          totalCount={data?.total_items || 0}
          pageCount={data?.total_pages || 0}
          pageIndex={filters.page! - 1}
          onPageChange={(index) => handlePageChange(index + 1)}
          isLoading={isLoading || isFetching}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onPageSizeChange={(size) =>
            handleFilterChange({
              ...filters,
              page_size: size,
              page: 1,
            })
          }
        />
      )}

      {/* Floating Bulk Actions Toolbar (Notion & Vercel Style) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 border-r border-background/20 pr-4">
            <Sparkles className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
            <span className="text-sm font-semibold whitespace-nowrap">
              Đã chọn <span className="text-amber-400 font-mono">{selectedIds.length}</span> bài viết
            </span>
          </div>

          <div className="flex items-center gap-2">
            {filters.deleted ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 cursor-pointer hover:bg-background/10 text-emerald-400 font-semibold"
                onClick={() => handleBulkAction('restore')}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Khôi phục hàng loạt
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 cursor-pointer hover:bg-background/10 text-amber-400 font-semibold"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                  Lưu trữ hàng loạt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 cursor-pointer hover:bg-background/10 text-sky-400 font-semibold"
                  onClick={() => handleBulkAction('publish')}
                >
                  <Globe className="mr-1.5 h-3.5 w-3.5" />
                  Đăng tải hàng loạt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 cursor-pointer hover:bg-destructive/20 text-rose-400 font-semibold"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash className="mr-1.5 h-3.5 w-3.5" />
                  Xóa hàng loạt
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-background/60 hover:text-background cursor-pointer"
              onClick={() => setRowSelection({})}
              title="Hủy chọn tất cả"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              Xác nhận xóa bài viết?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ di chuyển bài viết vào thùng rác. Bài viết sẽ tạm thời biến mất khỏi trang hiển thị công khai và có thể được khôi phục lại trong Thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
