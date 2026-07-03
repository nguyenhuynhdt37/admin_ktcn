import { Edit, Trash2, MoreHorizontal, ExternalLink, ArrowUpDown } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
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
import type { Banner } from '../types'

// Map position key to localized Vietnamese label for better UX
const positionLabels: Record<string, string> = {
  HOME_HERO: 'Carousel trang chủ',
  HOME_POPUP: 'Popup trang chủ',
  HOME_TOP: 'Banner trên trang chủ',
  NEWS_TOP: 'Đầu trang tin tức',
  CATEGORY_TOP: 'Đầu trang danh mục',
  PAGE_TOP: 'Đầu trang tĩnh/con',
}

interface BannerColumnsProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, active: boolean) => void
}

export const getBannerColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: BannerColumnsProps): ColumnDef<Banner>[] => [
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
    accessorKey: 'desktop_image_object_key',
    header: 'Xem trước',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="relative h-11 w-22 overflow-hidden rounded border bg-muted shadow-2xs">
          {item.desktop_image_object_key ? (
            <img
              src={item.desktop_image_object_key}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground bg-slate-100">
              Không có ảnh
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 cursor-pointer"
      >
        Tiêu đề & liên kết
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex flex-col gap-1 max-w-[250px]">
          <span className="font-semibold text-xs text-foreground leading-normal truncate" title={item.title}>
            {item.title}
          </span>
          {item.description && (
            <span className="text-[10px] text-muted-foreground leading-normal line-clamp-1" title={item.description}>
              {item.description}
            </span>
          )}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-primary hover:underline flex items-center gap-1 w-fit mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[150px]">{item.link_url}</span>
            </a>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'position',
    header: 'Vị trí hiển thị',
    cell: ({ row }) => {
      const pos = row.original.position
      const label = positionLabels[pos] || pos
      return (
        <Badge variant="outline" className="text-[10px] font-medium rounded px-2 py-0.5 border shadow-none bg-slate-50 text-slate-700">
          {label}
        </Badge>
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
    accessorKey: 'date_range',
    header: 'Thời gian hiệu lực',
    cell: ({ row }) => {
      const item = row.original
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return null
        try {
          const d = new Date(dateStr)
          return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        } catch {
          return null
        }
      }
      const start = formatDate(item.start_at)
      const end = formatDate(item.end_at)

      return (
        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
          {start && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-emerald-600">Từ:</span>
              <span className="font-mono">{start}</span>
            </div>
          )}
          {end && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-amber-600">Đến:</span>
              <span className="font-mono">{end}</span>
            </div>
          )}
          {!start && !end && <span className="text-slate-400">Luôn hiển thị</span>}
        </div>
      )
    },
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Thao tác banner</DropdownMenuLabel>
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
                <span>Xóa banner</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
