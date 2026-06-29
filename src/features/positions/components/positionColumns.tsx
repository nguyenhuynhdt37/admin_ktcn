import type { ColumnDef } from '@tanstack/react-table'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  ShieldAlert
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Switch } from '@/shared/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import type { Position } from '../types'

interface PositionColumnsProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, active: boolean) => void
}

export const getPositionColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: PositionColumnsProps): ColumnDef<Position>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Chọn dòng"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Tên chức vụ',
    cell: ({ row }) => <span className="font-semibold text-xs text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: 'english_name',
    header: 'Tên tiếng Anh',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.english_name || '-'}</span>,
  },
  {
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate max-w-[280px] block" title={row.original.description || ''}>
        {row.original.description || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'sort_order',
    header: 'Sắp xếp',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.sort_order}</span>,
  },
  {
    accessorKey: 'staff_count',
    header: () => <div className="text-center">Số GV giữ</div>,
    cell: ({ row }) => {
      const count = row.original.staff_count
      return (
        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 gap-1 rounded px-2 text-[10px] font-semibold border shadow-none">
            <Users className="h-3 w-3 text-slate-400" />
            {count}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'is_active',
    header: () => <div className="text-center">Trạng thái</div>,
    cell: ({ row }) => {
      const position = row.original
      return (
        <div className="flex items-center justify-center">
          <Switch
            checked={position.is_active}
            onCheckedChange={(checked) => onToggleStatus(position.id, checked)}
            className="scale-75 cursor-pointer"
          />
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const position = row.original
      const hasStaff = position.staff_count > 0

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer hover:bg-muted rounded-md">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Thao tác chức vụ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onEdit(position.id)}
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full block">
                      <DropdownMenuItem
                        disabled={hasStaff}
                        className={`text-xs w-full ${hasStaff ? 'text-muted-foreground/60 cursor-not-allowed opacity-50' : 'cursor-pointer text-destructive focus:bg-destructive/10'}`}
                        onClick={() => !hasStaff && onDelete(position.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span>Xóa chức vụ</span>
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  {hasStaff && (
                    <TooltipContent side="left" className="text-xs bg-amber-50 text-amber-800 border border-amber-200 shadow-sm max-w-[200px] leading-relaxed">
                      <div className="flex items-start gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Không thể xóa chức vụ đang được gán cho giảng viên.</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
