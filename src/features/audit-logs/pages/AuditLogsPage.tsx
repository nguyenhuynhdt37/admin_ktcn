import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { ColumnDef } from '@tanstack/react-table'
import { Globe, ScrollText, Activity, Users, ShieldAlert, Search, RefreshCw } from 'lucide-react'
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
import { useSearchParams } from 'react-router'
import { Button } from '@/shared/components/ui/button'

export function AuditLogsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('audit.view')

  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = Number(searchParams.get('page'))
  const page = (pageParam && pageParam > 0) ? pageParam - 1 : 0
  const pageSize = 20

  useEffect(() => {
    const pParam = searchParams.get('page')
    if (pParam !== null) {
      const pageNum = Number(pParam)
      if (isNaN(pageNum) || pageNum < 1) {
        const params = new URLSearchParams(searchParams)
        params.set('page', '1')
        setSearchParams(params)
      }
    }
  }, [searchParams, setSearchParams])

  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filters = useMemo<AuditLogFiltersState>(() => {
    return {
      action: searchParams.get('action') || '',
      target_type: searchParams.get('target_type') || '',
      from_date: searchParams.get('from_date') || '',
      to_date: searchParams.get('to_date') || '',
      actor_id: searchParams.get('actor_id') || '',
    }
  }, [searchParams])

  const setFilters = useCallback((
    newFilters: AuditLogFiltersState | ((prev: AuditLogFiltersState) => AuditLogFiltersState)
  ) => {
    const nextFilters = typeof newFilters === 'function' ? newFilters(filters) : newFilters
    const params = new URLSearchParams(searchParams)
    
    if (nextFilters.action) params.set('action', nextFilters.action)
    else params.delete('action')

    if (nextFilters.target_type) params.set('target_type', nextFilters.target_type)
    else params.delete('target_type')

    if (nextFilters.from_date) params.set('from_date', nextFilters.from_date)
    else params.delete('from_date')

    if (nextFilters.to_date) params.set('to_date', nextFilters.to_date)
    else params.delete('to_date')

    if (nextFilters.actor_id) params.set('actor_id', nextFilters.actor_id)
    else params.delete('actor_id')

    params.set('page', '1') 
    setSearchParams(params)
  }, [filters, searchParams, setSearchParams])

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage + 1))
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const { data, isLoading, refetch } = useQuery({
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
    const params = new URLSearchParams()
    setSearchParams(params)
  }, [setSearchParams])

  const handleFiltersChange = useCallback((newFilters: AuditLogFiltersState) => {
    setFilters(newFilters)
  }, [setFilters])

  const handleRowClick = useCallback((item: AuditLogItem) => {
    setSelectedItem(item)
    setSheetOpen(true)
  }, [])

  // Thống kê động từ dữ liệu trả về
  const stats = useMemo(() => {
    const items = data?.items || []
    const totalCount = data?.total || 0
    const uniqueIps = new Set(items.map(item => item.ip_address).filter(Boolean)).size
    const uniqueActors = new Set(items.map(item => item.actor_username).filter(Boolean)).size
    
    // Tính hành động nguy hiểm/nhạy cảm (ví dụ liên quan đến DELETE, UPDATE nhạy cảm)
    const criticalActions = items.filter(item => 
      item.action.includes('DELETE') || 
      item.action.includes('REVOKE') || 
      item.action.includes('ROLE_UPDATE')
    ).length

    return {
      total: totalCount,
      uniqueIps: uniqueIps || 1,
      uniqueActors: uniqueActors || 1,
      criticals: criticalActions
    }
  }, [data])

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      accessorKey: 'created_at',
      header: () => <span className="font-semibold text-xs uppercase tracking-wider">Thời gian</span>,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
          {dayjs(row.getValue('created_at')).format('DD/MM/YYYY HH:mm:ss')}
        </span>
      ),
    },
    {
      accessorKey: 'actor_username',
      header: () => <span className="font-semibold text-xs uppercase tracking-wider">Người thực hiện</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
              {String(row.getValue('actor_username'))[0]}
            </span>
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {row.getValue('actor_username')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: () => <span className="font-semibold text-xs uppercase tracking-wider">Hành động</span>,
      cell: ({ row }) => {
        const action = row.getValue('action') as string
        const meta = ACTION_COLORS[action]
        return (
          <Badge 
            variant="secondary" 
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
              meta?.className || 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            {meta?.label || action}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'target_type',
      header: () => <span className="font-semibold text-xs uppercase tracking-wider">Đối tượng</span>,
      cell: ({ row }) => {
        const type = row.getValue('target_type') as string
        return (
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
            {TARGET_TYPE_LABELS[type] || type}
          </span>
        )
      },
    },
    {
      accessorKey: 'ip_address',
      header: () => <span className="font-semibold text-xs uppercase tracking-wider">Địa chỉ IP</span>,
      cell: ({ row }) => {
        const ip = row.getValue('ip_address') as string | null
        if (!ip) return <span className="text-slate-400 dark:text-slate-600">—</span>
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
            <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {ip}
          </div>
        )
      },
    },
  ]

  if (!canView) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="h-16 w-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center border border-red-100 dark:border-red-900/30 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">Truy cập bị từ chối</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Hồ sơ tài khoản của bạn hiện tại không được phân quyền xem danh sách nhật ký hành động quản trị hệ thống (`audit.view`).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Nhật ký hoạt động</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giám sát và kiểm vết thời gian thực tất cả hành vi quản trị viên trên hệ thống CMS
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="gap-2 text-xs font-semibold cursor-pointer h-9 px-4 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview stats layout dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-sm relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300">
            <Activity className="h-24 w-24 text-slate-950 dark:text-white" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng hành động</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">{stats.total}</span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">Tất cả</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-sm relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300">
            <Users className="h-24 w-24 text-slate-950 dark:text-white" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quản trị viên</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">{stats.uniqueActors}</span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-1.5 py-0.5 rounded">Hoạt động</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-sm relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300">
            <Globe className="h-24 w-24 text-slate-950 dark:text-white" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Globe className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Số lượng IP</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">{stats.uniqueIps}</span>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded">Duy nhất</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-sm relative overflow-hidden group hover:border-rose-200 dark:hover:border-rose-900/50 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300">
            <ShieldAlert className="h-24 w-24 text-slate-950 dark:text-white" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hành động nhạy cảm</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">{stats.criticals}</span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 px-1.5 py-0.5 rounded">Cần lưu ý</span>
          </div>
        </div>
      </div>

      {/* Filter and Table Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-sm space-y-6">
        {/* Filters Title */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-900">
          <Search className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tìm kiếm & Lọc nâng cao</h2>
        </div>

        {/* Filters */}
        <AuditLogFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* Table Container */}
        <div className="pt-2">
          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            pageCount={data?.total_pages || 0}
            pageIndex={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Detail Sheet */}
      <AuditLogDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
