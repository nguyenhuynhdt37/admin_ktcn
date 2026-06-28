import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { ColumnDef } from '@tanstack/react-table'
import { Globe, ScrollText } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { DataTable } from '@/shared/components/DataTable'
import { useAuth } from '@/app/providers/AuthProvider'
import { auditLogsService } from '../services/auditLogsService'
import { AuditLogFilters } from '../components/AuditLogFilters'
import { AuditLogDetailSheet } from '../components/AuditLogDetailSheet'
import {
  ACTION_COLORS,
  TARGET_TYPE_LABELS,
} from '../types/auditLogs.types'
import type { AuditLogItem, AuditLogFiltersState } from '../types/auditLogs.types'

const DEFAULT_FILTERS: AuditLogFiltersState = {
  action: '',
  target_type: '',
  from_date: '',
  to_date: '',
  actor_id: '',
}

export function AuditLogsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('audit.view')

  const [page, setPage] = useState(0)
  const pageSize = 20
  const [filters, setFilters] = useState<AuditLogFiltersState>(DEFAULT_FILTERS)
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page + 1),
        page_size: String(pageSize),
      }
      if (filters.action) params.action = filters.action
      if (filters.target_type) params.target_type = filters.target_type
      if (filters.from_date) params.from_date = new Date(filters.from_date).toISOString()
      if (filters.to_date) params.to_date = new Date(filters.to_date + 'T23:59:59').toISOString()
      if (filters.actor_id) params.actor_id = filters.actor_id

      return auditLogsService.list(params)
    },
    enabled: canView,
  })

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(0)
  }, [])

  const handleFiltersChange = useCallback((newFilters: AuditLogFiltersState) => {
    setFilters(newFilters)
    setPage(0)
  }, [])

  const handleRowClick = useCallback((item: AuditLogItem) => {
    setSelectedItem(item)
    setSheetOpen(true)
  }, [])

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      accessorKey: 'created_at',
      header: 'Thời gian',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {dayjs(row.getValue('created_at')).format('DD/MM/YY HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'actor_username',
      header: 'Người thực hiện',
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.getValue('actor_username')}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Hành động',
      cell: ({ row }) => {
        const action = row.getValue('action') as string
        const meta = ACTION_COLORS[action]
        return (
          <Badge variant="secondary" className={`text-xs font-normal ${meta?.className || ''}`}>
            {meta?.label || action}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'target_type',
      header: 'Đối tượng',
      cell: ({ row }) => {
        const type = row.getValue('target_type') as string
        return (
          <span className="text-sm text-muted-foreground">
            {TARGET_TYPE_LABELS[type] || type}
          </span>
        )
      },
    },
    {
      accessorKey: 'ip_address',
      header: 'IP',
      cell: ({ row }) => {
        const ip = row.getValue('ip_address') as string | null
        if (!ip) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            {ip}
          </div>
        )
      },
    },
  ]

  if (!canView) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-2">
        <h3 className="text-xl font-semibold text-destructive">Truy cập bị từ chối</h3>
        <p className="text-muted-foreground">Bạn không có quyền xem nhật ký hệ thống.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Nhật ký hoạt động</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi toàn bộ hành động quản trị trên hệ thống CMS
        </p>
      </div>

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        pageCount={data?.total_pages || 0}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onRowClick={handleRowClick}
      />

      {/* Detail Sheet */}
      <AuditLogDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
