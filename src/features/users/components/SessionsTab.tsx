import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
import type { ColumnDef } from '@tanstack/react-table'
import { Globe, Monitor, Clock, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { DataTable } from '@/shared/components/DataTable'
import { userActivityService } from '@/features/users/services/userActivityService'
import type { UserSession } from '@/features/users/types/userActivity.types'
import { RefreshCw, Wifi } from 'lucide-react'

interface SessionsTabProps {
  userId: string
  canUpdate: boolean
}

export function SessionsTab({ userId, canUpdate }: SessionsTabProps) {
  const queryClient = useQueryClient()

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: () => userActivityService.getSessions(userId),
  })

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => userActivityService.revokeSession(userId, sessionId),
    onSuccess: () => {
      toast.success('Đã thu hồi phiên đăng nhập')
      queryClient.invalidateQueries({ queryKey: ['user-sessions', userId] })
    },
    onError: () => toast.error('Thu hồi phiên thất bại'),
  })

  const revokeAllMutation = useMutation({
    mutationFn: () => userActivityService.revokeAllSessions(userId),
    onSuccess: (data) => {
      toast.success(`Đã thu hồi ${data.revoked_count} phiên đăng nhập`)
      queryClient.invalidateQueries({ queryKey: ['user-sessions', userId] })
    },
    onError: () => toast.error('Thu hồi tất cả phiên thất bại'),
  })

  const columns: ColumnDef<UserSession>[] = [
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
      header: 'Thiết bị / Trình duyệt',
      cell: ({ row }) => {
        const ua = row.getValue('user_agent') as string | null
        if (!ua) return <span className="text-muted-foreground text-xs">Không xác định</span>
        const shortened = ua.length > 60 ? ua.substring(0, 60) + '…' : ua
        return (
          <div className="flex items-center gap-2" title={ua}>
            <Monitor className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{shortened}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Thời gian tạo',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p>{dayjs(row.getValue('created_at')).format('DD/MM/YYYY HH:mm')}</p>
            <p className="text-xs text-muted-foreground">{dayjs(row.getValue('created_at')).fromNow()}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'expires_at',
      header: 'Hết hạn',
      cell: ({ row }) => {
        const exp = dayjs(row.getValue('expires_at'))
        const isExpired = exp.isBefore(dayjs())
        return (
          <span className={`text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
            {exp.format('DD/MM/YYYY HH:mm')}
          </span>
        )
      },
    },
    {
      accessorKey: 'is_revoked',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const revoked = row.getValue('is_revoked') as boolean
        return revoked
          ? <Badge variant="destructive" className="text-xs">Đã thu hồi</Badge>
          : <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600">Hoạt động</Badge>
      },
    },
    ...(canUpdate ? [{
      id: 'revoke-action',
      header: '',
      cell: ({ row }: { row: { original: UserSession } }) => {
        const session = row.original
        if (session.is_revoked) return null
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                disabled={revokeMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Thu hồi phiên đăng nhập?</AlertDialogTitle>
                <AlertDialogDescription>
                  Thiết bị với IP <strong>{session.ip_address}</strong> sẽ bị đăng xuất ngay lập tức.
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => revokeMutation.mutate(session.id)}
                >
                  Thu hồi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    }] as ColumnDef<UserSession>[] : []),
  ]

  const activeCount = sessions.filter((s) => !s.is_revoked).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">{activeCount} phiên đang hoạt động</span>
          </div>
          <Badge variant="secondary">{sessions.length} tổng cộng</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>
          {canUpdate && activeCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 cursor-pointer" disabled={revokeAllMutation.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Thu hồi tất cả
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Thu hồi tất cả phiên?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tất cả <strong>{activeCount}</strong> phiên đăng nhập đang hoạt động sẽ bị thu hồi.
                    Người dùng sẽ bị đăng xuất trên toàn bộ thiết bị. Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    onClick={() => revokeAllMutation.mutate()}
                  >
                    Thu hồi tất cả
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <Monitor className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Không có phiên đăng nhập nào</p>
        </div>
      ) : (
        <DataTable columns={columns} data={sessions} pageSize={10} />
      )}
    </div>
  )
}
