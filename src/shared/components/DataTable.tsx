import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState, RowSelectionState, OnChangeFn } from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  totalCount?: number
  pageCount?: number
  pageIndex?: number
  onPageChange?: (index: number) => void
  onRowClick?: (row: TData) => void
  isLoading?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  totalCount,
  pageCount,
  pageIndex,
  onPageChange,
  onRowClick,
  isLoading = false,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [goToPageValue, setGoToPageValue] = useState('')

  const isServerSide = pageCount !== undefined && pageIndex !== undefined && onPageChange !== undefined
  const isServerSort = sorting !== undefined && onSortingChange !== undefined

  const currentSorting = isServerSort ? sorting : internalSorting
  const handleSortingChange = isServerSort ? onSortingChange : setInternalSorting

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    onSortingChange: handleSortingChange as any,
    getSortedRowModel: isServerSort ? undefined : getSortedRowModel(),
    onRowSelectionChange,
    enableRowSelection: true,
    state: {
      sorting: currentSorting,
      ...(rowSelection !== undefined && { rowSelection }),
    },
    initialState: {
      pagination: { pageSize },
    },
    manualPagination: isServerSide,
    pageCount: pageCount,
  })

  const currentPage = isServerSide ? pageIndex : table.getState().pagination.pageIndex
  const totalPages = pageCount ?? table.getPageCount()
  const recordsTotal = totalCount ?? data.length

  const canPrevious = isServerSide ? pageIndex > 0 : table.getCanPreviousPage()
  const canNext = isServerSide ? pageIndex < totalPages - 1 : table.getCanNextPage()

  // Nhảy đến trang cụ thể
  const handleGoToPage = () => {
    const page = parseInt(goToPageValue, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      const targetIndex = page - 1
      if (isServerSide) {
        onPageChange(targetIndex)
      } else {
        table.setPageIndex(targetIndex)
      }
    }
    setGoToPageValue('')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {isLoading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        {/* Thông tin bản ghi */}
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Hiển thị{' '}
          <span className="font-semibold text-foreground">
            {recordsTotal === 0 ? 0 : currentPage * pageSize + 1}
          </span>{' '}
          –{' '}
          <span className="font-semibold text-foreground">
            {Math.min((currentPage + 1) * pageSize, recordsTotal)}
          </span>{' '}
          trong{' '}
          <span className="font-semibold text-foreground">{recordsTotal}</span> bản ghi
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span className="ml-2 font-medium text-primary">
              · Đã chọn {table.getFilteredSelectedRowModel().rows.length}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Số dòng mỗi trang */}
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Dòng/trang
              </span>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-9 w-[80px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nút điều hướng trang */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => (isServerSide ? onPageChange(0) : table.setPageIndex(0))}
              disabled={!canPrevious}
              aria-label="Trang đầu"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => (isServerSide ? onPageChange(pageIndex - 1) : table.previousPage())}
              disabled={!canPrevious}
              aria-label="Trang trước"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Trang hiện tại / Tổng trang */}
            <div className="flex items-center gap-1 px-2 min-w-fit">
              <span className="text-sm text-muted-foreground">Trang</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {currentPage + 1}
              </span>
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {totalPages || 1}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => (isServerSide ? onPageChange(pageIndex + 1) : table.nextPage())}
              disabled={!canNext}
              aria-label="Trang sau"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() =>
                isServerSide
                  ? onPageChange(totalPages - 1)
                  : table.setPageIndex(totalPages - 1)
              }
              disabled={!canNext}
              aria-label="Trang cuối"
              title="Trang cuối"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Nhảy đến trang — chỉ hiện khi có nhiều trang */}
          {totalPages > 5 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Đến trang</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={goToPageValue}
                onChange={(e) => setGoToPageValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                className="h-9 w-[60px] text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="—"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-sm font-medium"
                onClick={handleGoToPage}
                disabled={!goToPageValue}
              >
                Đi
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
