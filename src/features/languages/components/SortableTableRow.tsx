import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { TableRow } from '@/shared/components/ui/table'
import { cn } from '@/lib/utils'

interface SortableTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  id: string
  isDeleted: boolean
  isDragDisabled?: boolean
}

export function SortableTableRow({
  id,
  isDeleted,
  isDragDisabled = false,
  children,
  className,
  ...props
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isDragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Tránh bị lệch layout table cells khi đang kéo
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 50 : undefined,
  } as React.CSSProperties

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDeleted ? 'bg-muted/10 opacity-70 dark:bg-muted/5' : '',
        isDragging ? 'opacity-50 border-primary bg-primary/5 shadow-md' : '',
        className
      )}
      {...props}
    >
      {/* Drag handle cell */}
      {!isDragDisabled && (
        <td className="w-[40px] pl-4 pr-0 py-3 align-middle">
          <button
            {...attributes}
            {...listeners}
            type="button"
            className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing rounded-md hover:bg-muted transition-colors flex items-center justify-center"
            style={{ touchAction: 'none' }}
            title="Kéo thả để sắp xếp"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>
      )}
      {children}
    </TableRow>
  )
}
