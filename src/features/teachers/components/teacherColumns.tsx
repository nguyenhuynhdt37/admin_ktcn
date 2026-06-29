import type { ColumnDef } from '@tanstack/react-table'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Globe,
  Eye
} from 'lucide-react'
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
import type { Staff } from '../types'

interface TeacherColumnsProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, active: boolean) => void
  onView: (slug: string) => void
}

export const getTeacherColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
}: TeacherColumnsProps): ColumnDef<Staff>[] => [
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
    accessorKey: 'full_name',
    header: 'Giảng viên',
    cell: ({ row }) => {
      const item = row.original
      const initials = item.full_name.trim().split(' ').pop()?.charAt(0).toUpperCase() || 'G'
      
      // Determine academic titles/degrees for labels
      const hasTitleOrDegree = item.academic_title || item.degree
      const label = [item.academic_title, item.degree].filter(Boolean).join('. ')

      return (
        <div className="flex items-center gap-3 py-0.5">
          {item.avatar_object_key ? (
            <img
              src={item.avatar_object_key}
              alt={item.full_name}
              className="h-9 w-9 rounded-full object-cover shrink-0 border border-border/80"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = ''
                ;(e.target as HTMLImageElement).className = 'hidden'
              }}
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
              {initials}
            </div>
          )}
          <div className="flex flex-col text-left max-w-[200px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs text-foreground truncate max-w-[140px]" title={item.full_name}>
                {item.full_name}
              </span>
              {hasTitleOrDegree && (
                <Badge variant="secondary" className="px-1 py-0 text-[8px] h-3.5 font-bold bg-muted/60 text-muted-foreground border-none rounded">
                  {label}
                </Badge>
              )}
            </div>
            {item.email && (
              <span className="text-[10px] text-muted-foreground truncate" title={item.email}>
                {item.email}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'position',
    header: 'Chức vụ',
    cell: ({ row }) => {
      const position = row.original.position
      return position ? (
        <span className="text-xs font-medium text-foreground">{position.name}</span>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
  },
  {
    accessorKey: 'department',
    header: 'Bộ môn',
    cell: ({ row }) => {
      const department = row.original.department
      return department ? (
        <span className="text-xs text-muted-foreground">{department.name}</span>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
  },
  {
    accessorKey: 'contact',
    header: 'Thông tin liên hệ',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex flex-col gap-1 max-w-[160px] text-xs text-muted-foreground">
          {item.phone && (
            <div className="flex items-center gap-1 truncate" title={`SĐT: ${item.phone}`}>
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-mono text-[10px]">{item.phone}</span>
            </div>
          )}
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-primary hover:underline flex items-center gap-1 w-fit mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[120px]">{item.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {!item.phone && !item.website && <span className="text-slate-400">-</span>}
        </div>
      )
    },
  },
  {
    accessorKey: 'sort_order',
    header: 'Sắp xếp',
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
              <DropdownMenuLabel>Tùy chọn giảng viên</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onView(item.slug)}
              >
                <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Xem hồ sơ</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onEdit(item.id)}
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-xs text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                <span>Xóa hồ sơ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
