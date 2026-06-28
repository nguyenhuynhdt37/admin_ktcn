import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { RotateCcw } from 'lucide-react'
import {
  ACTION_COLORS,
  TARGET_TYPE_LABELS,
  ALL_ACTIONS,
  ALL_TARGET_TYPES,
} from '../types/auditLogs.types'
import type { AuditLogFiltersState } from '../types/auditLogs.types'

interface AuditLogFiltersProps {
  filters: AuditLogFiltersState
  onFiltersChange: (filters: AuditLogFiltersState) => void
  onReset: () => void
}

export function AuditLogFilters({ filters, onFiltersChange, onReset }: AuditLogFiltersProps) {
  const updateFilter = (key: keyof AuditLogFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Action Filter */}
      <div className="space-y-1 min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground">Hành động</label>
        <Select value={filters.action} onValueChange={(v) => updateFilter('action', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tất cả hành động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hành động</SelectItem>
            {ALL_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {ACTION_COLORS[action]?.label || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Type Filter */}
      <div className="space-y-1 min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground">Đối tượng</label>
        <Select value={filters.target_type} onValueChange={(v) => updateFilter('target_type', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {ALL_TARGET_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {TARGET_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
        <Input
          type="date"
          value={filters.from_date}
          onChange={(e) => updateFilter('from_date', e.target.value)}
          className="h-9 text-sm w-[150px]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
        <Input
          type="date"
          value={filters.to_date}
          onChange={(e) => updateFilter('to_date', e.target.value)}
          className="h-9 text-sm w-[150px]"
        />
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  )
}
