import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Settings,
  Trash2,
  Folder,
  EyeOff,
  Plus,
  Lock,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CategoryStatus } from '../types'
import { useAuth } from '@/app/providers/AuthProvider'

interface SortableCategoryNodeProps {
  id: string
  title: string
  depth: number
  status: CategoryStatus
  isVisible: boolean
  isSelected: boolean
  isGhost?: boolean
  isValid?: boolean
  onEdit: () => void
  onDelete: () => void
  onAddChild?: () => void
  isLocked?: boolean
}

const STATUS_CONFIG: Record<CategoryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ACTIVE: { label: 'Hoạt động', variant: 'default' },
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  INACTIVE: { label: 'Ẩn', variant: 'outline' },
}

export function SortableCategoryNode({
  id,
  title,
  depth,
  status,
  isVisible,
  isSelected,
  isGhost = false,
  isValid = true,
  onEdit,
  onDelete,
  onAddChild,
  isLocked = false,
}: SortableCategoryNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('category.update')
  const canDelete = hasPermission('category.delete')
  const canCreate = hasPermission('category.create')

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${(depth - 1) * 28}px`, // Thụt lề theo depth
  }

  const normalizedStatus = (status || 'DRAFT').toUpperCase() as CategoryStatus
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG['DRAFT']

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative my-1 transition-all duration-200',
        isDragging && 'z-50 opacity-60 scale-[1.01]',
        isGhost && 'opacity-40 pointer-events-none border-dashed',
        isGhost && !isValid && 'opacity-60 bg-destructive/5'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 transition-colors',
          isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border',
          (!isVisible || normalizedStatus !== 'ACTIVE') && 'bg-muted/30 opacity-70',
          isGhost && 'border-dashed border-primary/40',
          isGhost && !isValid && 'border-destructive/60 border-dashed text-destructive bg-destructive/5'
        )}
      >
        {/* Khối bên trái: drag handle, icon loại link, tiêu đề */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Nét vẽ nối cấp danh mục trái (depth > 1) */}
          {depth > 1 && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 border-l border-b border-border/80 rounded-bl-sm"
              style={{
                left: `${(depth - 2) * 28 + 14}px`,
                width: '14px',
                height: '24px'
              }}
            />
          )}

          {/* Drag Handle */}
          {canUpdate && (
            <button
              {...attributes}
              {...listeners}
              style={{ touchAction: 'none' }}
              className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing rounded-md hover:bg-muted"
              title="Kéo thả để di chuyển vị trí tự do"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Icon Folder */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted border">
            <Folder className={cn("h-4 w-4", normalizedStatus === 'ACTIVE' ? "text-blue-500" : "text-muted-foreground")} />
          </div>

          {/* Tiêu đề & badge */}
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                onClick={onEdit}
                className={cn(
                  'text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors',
                  !isVisible && 'text-muted-foreground line-through'
                )}
              >
                {title}
              </span>
              {isLocked && (
                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" title="Danh mục hệ thống (Khóa xóa)" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={statusCfg.variant} className="text-[10px] px-1 py-0 h-4.5 font-normal">
                {statusCfg.label}
              </Badge>
              {!isVisible && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4.5 bg-destructive/10 text-destructive border-transparent font-normal flex items-center gap-0.5">
                  <EyeOff className="h-3 w-3" />
                  Ẩn
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Khối bên phải: Thêm con, Edit, Delete */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Nút Thêm Danh Mục Con */}
          {depth < 3 && onAddChild && canCreate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddChild}
              className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
              title="Thêm danh mục con trực tiếp"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          <div className="h-4 w-px bg-border mx-1" />

          {/* Nút Cấu hình Chi tiết */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
            title="Cấu hình chi tiết"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Nút Xóa */}
          {canDelete && !isLocked && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title="Xóa danh mục này"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
