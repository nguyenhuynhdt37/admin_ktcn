import type { ColumnDef } from '@tanstack/react-table'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  ShieldAlert
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Switch } from '@/shared/components/ui/switch'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
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
    cell: ({ row }) => {
      const item = row.original
      const enName = item.translations?.en?.name

      return (
        <div className="flex flex-col gap-1 max-w-[220px]">
          <span className="font-semibold text-xs text-foreground leading-normal truncate" title={item.name}>
            {item.name}
          </span>
          {enName && (
            <span className="text-[10px] text-muted-foreground leading-normal truncate" title={enName}>
              {enName}
            </span>
          )}
          
          {/* Badge ngôn ngữ dịch thuật VI / EN */}
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <span 
              className={cn(
                "text-[8px] font-bold px-1 rounded-sm border select-none tracking-wider scale-90 origin-left",
                item.is_translated?.vi 
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20" 
                  : "bg-destructive/15 text-destructive border-destructive/20"
              )}
              title={item.is_translated?.vi ? "Đã dịch Tiếng Việt" : "Chưa dịch Tiếng Việt"}
            >
              VI
            </span>
            <span 
              className={cn(
                "text-[8px] font-bold px-1 rounded-sm border select-none tracking-wider scale-90 origin-left",
                item.is_translated?.en 
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20" 
                  : "bg-destructive/15 text-destructive border-destructive/20"
              )}
              title={item.is_translated?.en ? "Đã dịch Tiếng Anh" : "Chưa dịch Tiếng Anh"}
            >
              EN
            </span>
          </div>
        </div>
      )
    },
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
                        className="cursor-pointer text-xs w-full text-destructive focus:bg-destructive/10"
                        onClick={() => onDelete(position.id)}
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
                        <span>Chú ý: Chức vụ có {position.staff_count} giảng viên. Không thể xóa khi chưa chuyển chức vụ của họ.</span>
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
