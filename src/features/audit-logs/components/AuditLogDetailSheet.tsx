import dayjs from 'dayjs'
import { Globe, Monitor, Clock, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import { Badge } from '@/shared/components/ui/badge'
import { ACTION_COLORS, TARGET_TYPE_LABELS } from '../types/auditLogs.types'
import type { AuditLogItem } from '../types/auditLogs.types'

interface AuditLogDetailSheetProps {
  item: AuditLogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditLogDetailSheet({ item, open, onOpenChange }: AuditLogDetailSheetProps) {
  if (!item) return null

  const actionMeta = ACTION_COLORS[item.action]
  const targetLabel = TARGET_TYPE_LABELS[item.target_type] || item.target_type

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chi tiết nhật ký</SheetTitle>
          <SheetDescription>
            Thông tin chi tiết về hành động quản trị
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Action Badge */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Hành động</label>
            <div>
              <Badge variant="secondary" className={actionMeta?.className || ''}>
                {actionMeta?.label || item.action}
              </Badge>
            </div>
          </div>

          {/* Actor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Người thực hiện</label>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.actor_username}</span>
            </div>
          </div>

          {/* Target */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Loại đối tượng</label>
              <p className="text-sm">{targetLabel}</p>
            </div>
            {item.target_id && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ID đối tượng</label>
                <p className="text-xs font-mono text-muted-foreground break-all">{item.target_id}</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>
            </div>
            {item.ip_address && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{item.ip_address}</span>
              </div>
            )}
            {item.user_agent && (
              <div className="flex items-start gap-2 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground break-all leading-relaxed">{item.user_agent}</span>
              </div>
            )}
          </div>

          {/* Changes JSON */}
          {item.changes && Object.keys(item.changes).length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Chi tiết thay đổi</label>
              <pre className="rounded-lg border bg-muted/50 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(item.changes, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
