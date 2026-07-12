import type { ColumnDef } from '@tanstack/react-table'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Switch } from '@/shared/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Gallery } from '../types'
import { getMediaUrl } from '@/features/articles/utils/media'

interface GalleryColumnsProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, active: boolean) => void
}

export const getGalleryColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: GalleryColumnsProps): ColumnDef<Gallery>[] => [
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
    accessorKey: 'cover',
    header: 'Ảnh bìa',
    cell: ({ row }) => {
      const item = row.original
      const coverUrl = item.cover_url || (item.cover_object_key ? getMediaUrl(item.cover_object_key) : null)
      return (
        <div className="h-10 w-16 overflow-hidden rounded border bg-muted flex items-center justify-center shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'title',
    header: 'Tên Album',
    cell: ({ row }) => {
      const item = row.original
      const viTitle = item.translations?.vi?.title || ''
      const enTitle = item.translations?.en?.title || ''
      return (
        <div className="flex flex-col max-w-[300px] truncate text-left">
          <span className="font-semibold text-xs text-foreground leading-normal truncate" title={viTitle}>
            {viTitle}
          </span>
          {enTitle && (
            <span className="text-[10px] text-muted-foreground leading-normal truncate" title={enTitle}>
              {enTitle}
            </span>
          )}
          
          {/* Badge ngôn ngữ dịch thuật VI / EN */}
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <span 
              className={cn(
                "text-[8px] font-bold px-1 rounded-sm border select-none tracking-wider scale-90 origin-left",
                item.translations?.vi?.title 
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" 
                  : "bg-destructive/15 text-destructive border-destructive/20"
              )}
            >
              VI
            </span>
            <span 
              className={cn(
                "text-[8px] font-bold px-1 rounded-sm border select-none tracking-wider scale-90 origin-left",
                item.translations?.en?.title 
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" 
                  : "bg-destructive/15 text-destructive border-destructive/20"
              )}
            >
              EN
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'department_name',
    header: 'Đơn vị sở hữu',
    cell: ({ row }) => {
      const item = row.original
      return (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {item.department_name || 'Đơn vị chung'}
        </span>
      )
    },
  },
  {
    accessorKey: 'sort_order',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 cursor-pointer"
      >
        Sắp xếp
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.sort_order}</span>,
  },
  {
    accessorKey: 'is_active',
    header: () => <div className="text-center">Trạng thái</div>,
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center justify-center">
          <Switch
            checked={item.is_active}
            onCheckedChange={(checked) => onToggleStatus(item.id, checked)}
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
      const item = row.original

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
              <DropdownMenuLabel>Thao tác Album</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onEdit(item.id)}
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-xs text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                <span>Xóa Album</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
