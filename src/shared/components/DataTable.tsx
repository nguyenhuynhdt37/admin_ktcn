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
      pagination: {
        pageSize,
      },
    },
    manualPagination: isServerSide,
    pageCount: pageCount,
  })

  const currentPage = isServerSide ? pageIndex : table.getState().pagination.pageIndex
  const totalPages = pageCount ?? table.getPageCount()
  const recordsTotal = totalCount ?? data.length

  const canPrevious = isServerSide ? pageIndex > 0 : table.getCanPreviousPage()
  const canNext = isServerSide ? pageIndex < totalPages - 1 : table.getCanNextPage()

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-muted-foreground">
                      {header.isPlaceholder
                         ? null
                         : flexRender(
                             header.column.columnDef.header,
                             header.getContext()
                           )}
                    </TableHead>
                  )
                })}
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
          Hiển thị{' '}
          <span className="font-medium">
            {recordsTotal === 0 ? 0 : currentPage * pageSize + 1}
          </span>{' '}
          đến{' '}
          <span className="font-medium">
            {Math.min(
              (currentPage + 1) * pageSize,
              recordsTotal
            )}
          </span>{' '}
          trong tổng số <span className="font-medium">{recordsTotal}</span> bản ghi
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span className="ml-2 font-medium text-primary">
              (Đã chọn {table.getFilteredSelectedRowModel().rows.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-1 sm:pb-0">
          {onPageSizeChange && (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium whitespace-nowrap">Số dòng</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
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
          
          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => (isServerSide ? onPageChange(0) : table.setPageIndex(0))}
              disabled={!canPrevious}
              aria-label="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => (isServerSide ? onPageChange(pageIndex - 1) : table.previousPage())}
              disabled={!canPrevious}
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium min-w-[100px]">
              Trang {currentPage + 1} / {totalPages || 1}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => (isServerSide ? onPageChange(pageIndex + 1) : table.nextPage())}
              disabled={!canNext}
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => (isServerSide ? onPageChange(totalPages - 1) : table.setPageIndex(totalPages - 1))}
              disabled={!canNext}
              aria-label="Trang cuối"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

