import { useMemo } from 'react'
import {
  Tag as TagIcon,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  Search
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { DataTable } from '@/shared/components/DataTable'
import { TagForm } from '../components/TagForm'
import { getTagColumns } from '../components/tagColumns'
import { useTags } from '../hooks/useTags'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

export function TagsPage() {
  const {
    isFormOpen,
    editingTagId,
    deleteTarget,
    setDeleteTarget,
    rowSelection,
    setRowSelection,
    sorting,
    setSorting,
    pagination,
    setPagination,
    search,
    setSearch,
    isActiveFilter,
    setIsActiveFilter,
    tags,
    totalItems,
    totalPages,
    isLoading,
    isError,
    refetch,
    isFetching,
    editingTag,
    isFetchingDetail,
    selectedIds,
    isDeleting,
    isSubmitting,
    isBulkStatusPending,
    handleEditClick,
    handleAddClick,
    handleCancelForm,
    handleFormSubmit,
    handleToggleStatus,
    handleDelete,
    handleBulkStatusChange,
    handleBulkDelete,
    executeDelete
  } = useTags()

  // Columns definition
  const columns = useMemo(() => getTagColumns({
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
            <TagIcon className="h-6 w-6 text-primary" />
            Quản lý thẻ bài viết
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Danh sách thẻ (Tag) phân loại, gắn nhãn cho bài viết trên hệ thống website.
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          className="cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-start sm:self-auto text-xs h-9 font-semibold"
        >
          Thêm thẻ mới
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-muted/10 p-3 rounded-xl border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc slug của thẻ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 text-xs focus-visible:ring-primary/20 h-9 bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-[180px]">
          <Select
            value={isActiveFilter}
            onValueChange={(val) => setIsActiveFilter(val)}
          >
            <SelectTrigger className="h-9 text-xs focus:ring-primary/20 bg-background text-left">
              <SelectValue placeholder="Trạng thái hoạt động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
              <SelectItem value="active" className="text-xs">Đang hoạt động</SelectItem>
              <SelectItem value="inactive" className="text-xs">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataTable Container */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-left">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách thẻ</h3>
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
            data={tags}
            pageSize={pagination.pageSize}
            totalCount={totalItems}
            pageCount={totalPages}
            pageIndex={pagination.pageIndex}
            onPageChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
            isLoading={isLoading || isFetching}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 }))}
          />
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 border-r border-background/20 pr-4">
            <Sparkles className="h-4.5 w-4.5 text-amber-400" />
            <span className="text-sm font-semibold whitespace-nowrap">
              Đã chọn <span className="text-amber-400 font-mono">{selectedIds.length}</span> thẻ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 cursor-pointer hover:bg-background/10 text-emerald-400 font-semibold"
              onClick={() => handleBulkStatusChange(true)}
              disabled={isBulkStatusPending}
            >
              Kích hoạt loạt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 cursor-pointer hover:bg-background/10 text-amber-400 font-semibold"
              onClick={() => handleBulkStatusChange(false)}
              disabled={isBulkStatusPending}
            >
              Tắt hoạt động loạt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 cursor-pointer hover:bg-destructive/20 text-rose-400 font-semibold"
              onClick={handleBulkDelete}
              disabled={isDeleting}
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
          {editingTagId && isFetchingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải thông tin thẻ...</p>
            </div>
          ) : (
            <TagForm
              initialData={editingTagId ? editingTag : null}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px] p-6 border text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {deleteTarget && deleteTarget.ids.length > 1 ? 'Xác nhận xóa hàng loạt thẻ' : 'Xác nhận xóa thẻ'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hành động này sẽ xóa thẻ khỏi hệ thống. Các bài viết đang gắn thẻ này sẽ không bị ảnh hưởng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa {deleteTarget && deleteTarget.ids.length > 1
                ? `${deleteTarget.ids.length} thẻ đã chọn`
                : 'thẻ này'}? Hành động này sẽ được ghi nhận vào nhật ký hệ thống.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="text-xs h-9 cursor-pointer font-medium"
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={executeDelete}
              className="text-xs h-9 cursor-pointer font-semibold"
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
