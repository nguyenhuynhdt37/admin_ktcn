import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Settings,
  Trash2,
  Folder,
  FileText,
  Globe,
  EyeOff,
  Plus,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TargetInfo } from '../types'

interface SortableMenuItemProps {
  id: string
  title: string
  depth: number
  targetType: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | null
  targetInfo: TargetInfo | null
  externalUrl: string | null
  isVisible: boolean
  isSelected: boolean
  isGhost?: boolean
  isValid?: boolean
  icon: string | null
  onEdit: () => void
  onDelete: () => void
  onAddChild?: () => void
}

// Helper chuyển đổi tên icon sang PascalCase để khớp thư viện Lucide
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Component vẽ icon Lucide động
function LucideIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  if (!name) return null
  const pascalName = toPascalCase(name)
  const IconComponent = (LucideIcons as any)[pascalName]
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}

export function SortableMenuItem({
  id,
  title,
  depth,
  targetType,
  targetInfo,
  externalUrl,
  isVisible,
  isSelected,
  isGhost = false,
  isValid = true,
  icon,
  onEdit,
  onDelete,
  onAddChild,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${(depth - 1) * 28}px`, // Thụt lề theo depth trên danh sách phẳng
  }

  // Chọn icon hiển thị: Ưu tiên icon cấu hình của mục menu, nếu không thì dùng icon mặc định của loại liên kết
  const getTargetIcon = () => {
    if (icon && icon !== 'NONE_ICON') {
      return <LucideIcon name={icon} size={16} className="text-primary" />
    }

    switch (targetType) {
      case 'CATEGORY':
        return <Folder className="h-4 w-4 text-blue-500" />
      case 'ARTICLE':
        return <FileText className="h-4 w-4 text-emerald-500" />
      case 'PAGE':
        return <FileText className="h-4 w-4 text-indigo-500" />
      case 'EXTERNAL_LINK':
        return <Globe className="h-4 w-4 text-amber-500" />
      default:
        return <Folder className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Chọn nhãn cho loại liên kết
  const getTargetLabel = () => {
    switch (targetType) {
      case 'CATEGORY':
        return 'Danh mục'
      case 'ARTICLE':
        return 'Bài viết'
      case 'PAGE':
        return 'Trang tĩnh'
      case 'EXTERNAL_LINK':
        return 'Liên kết ngoài'
      default:
        return 'Không liên kết'
    }
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
          isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border',
          !isVisible && 'bg-muted/30 opacity-75',
          isGhost && 'border-dashed border-primary/40',
          isGhost && !isValid && 'border-destructive/60 border-dashed text-destructive bg-destructive/5'
        )}
      >
        {/* Khối bên trái: drag handle, icon loại link, tiêu đề */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Vẽ nét nối cấp menu trái cho chuyên nghiệp (depth > 1) */}
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
          <button
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing rounded-md hover:bg-muted"
            title="Kéo thả để di chuyển vị trí tự do"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Icon loại liên kết / Icon được chọn */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted border">
            {getTargetIcon()}
          </div>

          {/* Tiêu đề & badge */}
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span
              onClick={onEdit}
              className={cn(
                'text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors',
                !isVisible && 'text-muted-foreground line-through'
              )}
            >
              {title}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4.5 font-normal">
                {getTargetLabel()}
              </Badge>

              {/* Target info badge */}
              {targetInfo && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[160px]">
                  {targetInfo.path || targetInfo.name}
                </span>
              )}
              {targetInfo && targetInfo.status && targetInfo.status !== 'ACTIVE' && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4.5 font-normal">
                  ⚠ {targetInfo.status}
                </Badge>
              )}
              {!targetInfo && externalUrl && (
                <span className="text-[10px] text-blue-500 truncate max-w-[160px]">
                  {externalUrl}
                </span>
              )}

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
          {/* Nút Thêm Menu Con */}
          {depth < 3 && onAddChild && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddChild}
              className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
              title="Thêm mục menu con trực tiếp"
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Xóa mục này"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
