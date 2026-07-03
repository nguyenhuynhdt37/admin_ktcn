import dayjs from 'dayjs'
import { Globe, Monitor, Clock, User, Cpu, Layers } from 'lucide-react'
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

  // Hàm render changes thông minh
  const renderChanges = (changes: Record<string, any>) => {
    return (
      <div className="space-y-2">
        {Object.entries(changes).map(([key, value]) => {
          // Kiểm tra xem value có dạng {"old": ..., "new": ...} không
          const isOldNew = value && typeof value === 'object' && ('old' in value || 'new' in value)
          
          return (
            <div key={key} className="p-3 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 font-mono uppercase tracking-wider">{key}</span>
              {isOldNew ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold">Giá trị cũ</span>
                    <div className="p-2 rounded bg-rose-50/30 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 font-mono break-all border border-rose-100/10 text-xs">
                      {String(value.old ?? '—')}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold">Giá trị mới</span>
                    <div className="p-2 rounded bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 font-mono break-all border border-emerald-100/10 text-xs">
                      {String(value.new ?? '—')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-slate-100/50 dark:bg-slate-900 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-900 shadow-xl">
        <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-900">
          <SheetTitle className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-500" />
            Chi tiết nhật ký
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            Xem toàn bộ dữ liệu kiểm vết hành vi quản trị viên
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Action Badge */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Hành động</label>
            <div>
              <Badge variant="secondary" className={`text-xs font-bold px-3 py-1 rounded-full border ${actionMeta?.className || 'bg-slate-100 text-slate-800'}`}>
                {actionMeta?.label || item.action}
              </Badge>
            </div>
          </div>

          {/* Actor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Người thực hiện</label>
            <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800">
              <User className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.actor_username}</span>
            </div>
          </div>

          {/* Target */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Loại đối tượng</label>
              <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800">
                <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{targetLabel}</span>
              </div>
            </div>
            {item.target_id && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">ID đối tượng</label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800">
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all select-all leading-tight">{item.target_id}</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>
            </div>
            {item.ip_address && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-mono">{item.ip_address}</span>
              </div>
            )}
            {item.user_agent && (
              <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <Monitor className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-500 leading-relaxed font-mono break-all">{item.user_agent}</span>
              </div>
            )}
          </div>

          {/* Changes JSON */}
          {item.changes && Object.keys(item.changes).length > 0 && (
            <div className="space-y-2 pb-4">
              <label className="text-xs font-semibold text-slate-400">Chi tiết thay đổi</label>
              {renderChanges(item.changes)}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
