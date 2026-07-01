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
  ChevronDown,
  ChevronRight,
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
  deletedAt?: string | null
  articleCount?: number
  isTranslated?: Record<string, boolean>
  isVirtual?: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
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
  isVisible = true,
  isSelected = false,
  isGhost = false,
  isValid = true,
  onEdit,
  onDelete,
  onAddChild,
  deletedAt = null,
  articleCount = 0,
  isTranslated = {},
  isVirtual = false,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse,
}: SortableCategoryNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: isVirtual ? 'virtual-node-prevent-drag' : id, disabled: isVirtual })

  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('category.update')
  const canDelete = hasPermission('category.delete')
  const canCreate = hasPermission('category.create')

  const style: React.CSSProperties = {
    transform: isVirtual ? undefined : CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${(depth - 1) * 28}px`, // Thụt lề theo depth
  }

  const normalizedStatus = (status || 'DRAFT').toUpperCase() as CategoryStatus
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG['DRAFT']

  // Xử lý click nút xóa danh mục
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (articleCount > 0) {
      alert(`Không thể xóa danh mục này do vẫn còn ${articleCount} bài viết đang hoạt động liên kết. Vui lòng xóa hoặc di chuyển bài viết trước khi thực hiện.`)
      return
    }
    onDelete()
  }

  if (isVirtual) {
    return (
      <div
        ref={isVirtual ? undefined : setNodeRef}
        style={style}
        className="group relative my-1 transition-all duration-200"
      >
        <div
          className="flex items-center justify-between rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            {depth > 1 && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 border-l border-b border-primary/30 border-dashed rounded-bl-sm"
                style={{
                  left: `${(depth - 2) * 28 + 14}px`,
                  width: '14px',
                  height: '24px'
                }}
              />
            )}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
              <Folder className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold text-primary italic truncate">
                  {title || 'Danh mục mới (Nhập tên bên phải...)'}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  (Cấp {depth})
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center shrink-0 ml-2">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold shrink-0">
              XEM TRƯỚC (CHƯA LƯU)
            </Badge>
          </div>
        </div>
      </div>
    )
  }

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
          isSelected ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border',
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

          {/* Nút thu gọn / mở rộng */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse?.()
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0 cursor-pointer"
              title={isCollapsed ? "Mở rộng danh mục con" : "Thu gọn danh mục con"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="w-[22px] shrink-0" />
          )}

          {/* Icon Folder */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted border">
            <Folder className={cn("h-4 w-4", normalizedStatus === 'ACTIVE' ? "text-blue-500" : "text-muted-foreground")} />
          </div>

          {/* Tiêu đề & badge */}
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                onClick={onEdit}
                className={cn(
                  'text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors',
                  (deletedAt || status === 'DELETED') && 'text-muted-foreground line-through opacity-50',
                  !isVisible && 'opacity-70'
                )}
              >
                {title}
                <span 
                  className="ml-2 text-[10px] text-muted-foreground font-semibold bg-muted/80 px-1.5 py-0.5 rounded-md border" 
                  title={`${articleCount} bài viết trong danh mục này`}
                >
                  {articleCount} bài viết
                </span>
              </span>
            </div>
            
            {/* Tag dịch thuật VI / EN */}
            <div className="flex items-center gap-1 shrink-0">
              <span 
                className={cn(
                  "text-[9px] font-semibold px-1 rounded-sm border",
                  isTranslated?.vi 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
                title={isTranslated?.vi ? "Đã hoàn thành Tiếng Việt" : "Chưa hoàn thiện Tiếng Việt"}
              >
                VI
              </span>
              <span 
                className={cn(
                  "text-[9px] font-semibold px-1 rounded-sm border",
                  isTranslated?.en 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
                title={isTranslated?.en ? "Đã hoàn thành Tiếng Anh" : "Chưa hoàn thiện Tiếng Anh"}
              >
                EN
              </span>
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
              type="button"
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
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
            title="Cấu hình chi tiết"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Nút Xóa */}
          {canDelete && articleCount === 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              className="h-8 w-8 text-muted-foreground cursor-pointer hover:text-destructive hover:bg-destructive/10"
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
