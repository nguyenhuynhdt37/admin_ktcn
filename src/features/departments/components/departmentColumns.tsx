import type { ColumnDef } from '@tanstack/react-table'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Globe,
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
import type { Department } from '../types'
import { getMediaUrl } from '@/features/articles/utils/media'

interface DepartmentColumnsProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, active: boolean) => void
}

export const getDepartmentColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: DepartmentColumnsProps): ColumnDef<Department>[] => [
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
    id: 'thumbnail',
    header: 'Ảnh',
    cell: ({ row }) => {
      const item = row.original
      const thumbUrl = getMediaUrl(item.thumbnail_object_key)
      return thumbUrl ? (
        <img
          src={thumbUrl}
          alt={item.name}
          className="h-10 w-14 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="h-10 w-14 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground/60 border border-border/40 font-mono">
          No IMG
        </div>
      )
    }
  },
  {
    accessorKey: 'name',
    header: 'Tên bộ môn',
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

          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-primary hover:underline flex items-center gap-1 w-fit mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-2.5 w-2.5" />
              <span>{item.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'contact',
    header: 'Liên hệ',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex flex-col gap-1 max-w-[160px] text-xs text-muted-foreground">
          {item.phone && (
            <div className="flex items-center gap-1 truncate" title={`Điện thoại: ${item.phone}`}>
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-mono text-[10px]">{item.phone}</span>
            </div>
          )}
          {item.email && (
            <div className="flex items-center gap-1 truncate" title={`Email: ${item.email}`}>
              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate text-[10px]">{item.email}</span>
            </div>
          )}
          {!item.phone && !item.email && <span className="text-slate-400">-</span>}
        </div>
      )
    },
  },
  {
    accessorKey: 'office',
    header: 'Văn phòng',
    cell: ({ row }) => {
      const item = row.original
      return item.office ? (
        <div className="flex items-center gap-1 max-w-[140px] truncate" title={item.office}>
          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="truncate text-xs text-muted-foreground">{item.office}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'sort_order',
    header: 'Sắp xếp',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.sort_order}</span>,
  },
  {
    accessorKey: 'staff_count',
    header: () => <div className="text-center">Số GV thuộc</div>,
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
      const hasStaff = item.staff_count > 0

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
              <DropdownMenuLabel>Thao tác bộ môn</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onEdit(item.id)}
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
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span>Xóa bộ môn</span>
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  {hasStaff && (
                    <TooltipContent side="left" className="text-xs bg-amber-50 text-amber-800 border border-amber-200 shadow-sm max-w-[200px] leading-relaxed">
                      <div className="flex items-start gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Chú ý: Bộ môn có {item.staff_count} giảng viên. Xóa sẽ đồng thời xóa giảng viên thuộc bộ môn.</span>
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
