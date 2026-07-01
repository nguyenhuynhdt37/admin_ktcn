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
  Award,
  AlertTriangle,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TargetInfo } from '../types'
import { useAuth } from '@/app/providers/AuthProvider'

interface SortableMenuItemProps {
  id: string
  title: string
  depth: number
  targetType: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | 'DEPARTMENT' | null
  targetInfo: TargetInfo | null
  externalUrl: string | null
  isVisible: boolean
  isSelected: boolean
  isGhost?: boolean
  isValid?: boolean
  onEdit: () => void
  onDelete: () => void
  onAddChild?: () => void
  isVirtual?: boolean
  isTranslated?: Record<string, boolean> | null
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
  onEdit,
  onDelete,
  onAddChild,
  isVirtual = false,
  isTranslated,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: isVirtual ? 'virtual-menu-node-prevent-drag' : id, disabled: isVirtual })
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('menu.update')
  const canDelete = hasPermission('menu.delete')
  const canCreate = hasPermission('menu.create')

  const style: React.CSSProperties = {
    transform: isVirtual ? undefined : CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${(depth - 1) * 28}px`, // Thụt lề theo depth trên danh sách phẳng
  }

  // Xác định xem liên kết đích có bị hỏng (đã bị xóa khỏi DB) hay không
  const isBrokenLink = targetInfo?.status === 'DELETED' || targetInfo?.name === '[Đã xóa]'

  // Chọn icon mặc định của loại liên kết
  const getTargetIcon = () => {
    if (isBrokenLink) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
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
      case 'DEPARTMENT':
        return <Award className="h-4 w-4 text-purple-500" />
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
      case 'DEPARTMENT':
        return 'Bộ môn'
      default:
        return 'Không liên kết'
    }
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
                  {title || 'Mục menu mới (Nhập tiêu đề bên phải...)'}
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
          !isVisible && 'bg-muted/30 opacity-75',
          isGhost && 'border-dashed border-primary/40',
          isGhost && !isValid && 'border-destructive/60 border-dashed text-destructive bg-destructive/5',
          isBrokenLink && 'border-destructive/40 hover:border-destructive bg-destructive/5 shadow-xs'
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

          {/* Icon loại liên kết / Icon được chọn */}
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isBrokenLink ? "bg-destructive/10 border-destructive/20" : "bg-muted"
          )}>
            {getTargetIcon()}
          </div>

          {/* Tiêu đề & badge */}
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span
              onClick={onEdit}
              className={cn(
                'text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1',
                !isVisible && 'text-muted-foreground line-through',
                isBrokenLink && 'text-destructive font-bold'
              )}
            >
              {isBrokenLink && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
              {title}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4.5 font-normal">
                {getTargetLabel()}
              </Badge>

              {/* Badges ngôn ngữ VI/EN */}
              <span className="flex items-center gap-0.5">
                <span
                  className={cn(
                    'text-[8px] px-1 py-0 rounded font-bold border',
                    isTranslated?.vi
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  )}
                  title={isTranslated?.vi ? 'Đã dịch Tiếng Việt' : 'Chưa dịch Tiếng Việt'}
                >
                  VI
                </span>
                <span
                  className={cn(
                    'text-[8px] px-1 py-0 rounded font-bold border',
                    isTranslated?.en
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  )}
                  title={isTranslated?.en ? 'Đã dịch Tiếng Anh' : 'Chưa dịch Tiếng Anh'}
                >
                  EN
                </span>
              </span>

              {/* Target info badge */}
              {targetInfo && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded truncate max-w-[160px]",
                  isBrokenLink
                    ? "bg-destructive/10 text-destructive border border-destructive/20 font-medium"
                    : "text-muted-foreground bg-muted"
                )}>
                  {targetInfo.path || targetInfo.name}
                </span>
              )}
              {isBrokenLink ? (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4.5 font-bold bg-destructive text-destructive-foreground">
                  ⚠ Liên kết đã bị xóa
                </Badge>
              ) : (
                targetInfo && targetInfo.status && targetInfo.status !== 'ACTIVE' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4.5 font-normal">
                    ⚠ {targetInfo.status}
                  </Badge>
                )
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
          {depth < 3 && onAddChild && canCreate && (
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
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer",
              isBrokenLink && "text-destructive hover:text-destructive/80"
            )}
            title="Cấu hình chi tiết"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Nút Xóa */}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title="Xóa mục này"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
