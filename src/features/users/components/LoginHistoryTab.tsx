import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
import type { ColumnDef } from '@tanstack/react-table'
import { Globe, Clock, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { DataTable } from '@/shared/components/DataTable'
import { userActivityService } from '@/features/users/services/userActivityService'
import type { LoginHistoryItem } from '@/features/users/types/userActivity.types'

interface LoginHistoryTabProps {
  userId: string
}

export function LoginHistoryTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const pageSize = 20

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-login-history', userId, page, statusFilter],
    queryFn: () =>
      userActivityService.getLoginHistory(userId, {
        page: page + 1,
        page_size: pageSize,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
  })

  const FAILURE_LABELS: Record<string, string> = {
    incorrect_credentials: 'Sai mật khẩu',
    inactive_user: 'Tài khoản bị khóa',
  }

  const columns: ColumnDef<LoginHistoryItem>[] = [
    {
      accessorKey: 'status',
      header: 'Kết quả',
      cell: ({ row }) => {
        const ok = row.getValue('status') === 'success'
        return ok
          ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Thành công</span>
            </div>
          )
          : (
            <div className="flex items-center gap-1.5 text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Thất bại</span>
            </div>
          )
      },
    },
    {
      accessorKey: 'ip_address',
      header: 'Địa chỉ IP',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-mono text-sm">{row.getValue('ip_address')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'user_agent',
      header: 'Thiết bị',
      cell: ({ row }) => {
        const ua = row.getValue('user_agent') as string | null
        if (!ua) return <span className="text-muted-foreground text-xs">—</span>
        const short = ua.length > 50 ? ua.substring(0, 50) + '…' : ua
        return <span className="text-xs text-muted-foreground" title={ua}>{short}</span>
      },
    },
    {
      accessorKey: 'failure_reason',
      header: 'Lý do thất bại',
      cell: ({ row }) => {
        const reason = row.getValue('failure_reason') as string | null
        if (!reason) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <Badge variant="secondary" className="text-xs font-normal text-destructive bg-destructive/10">
            {FAILURE_LABELS[reason] ?? reason}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Thời gian',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{dayjs(row.getValue('created_at')).format('DD/MM/YYYY HH:mm:ss')}</p>
          <p className="text-xs text-muted-foreground">{dayjs(row.getValue('created_at')).fromNow()}</p>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(val) => { setStatusFilter(val); setPage(0) }}
          >
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="success">Thành công</SelectItem>
              <SelectItem value="failed">Thất bại</SelectItem>
            </SelectContent>
          </Select>
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.total} bản ghi
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          pageSize={pageSize}
          totalCount={data?.total ?? 0}
          pageCount={data?.total_pages ?? 0}
          pageIndex={page}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
