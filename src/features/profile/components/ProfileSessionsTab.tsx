import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
import type { ColumnDef } from '@tanstack/react-table'
import { Globe, Monitor, Clock, Trash2, Loader2, RefreshCw, Wifi } from 'lucide-react'
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
import { profileService } from '../services/profileService'
import { httpClient } from '@/services/http/client'
import type { UserSession } from '@/features/users/types/userActivity.types'

export function ProfileSessionsTab() {
  const queryClient = useQueryClient()

  const { data: allSessions = [], isLoading, refetch } = useQuery({
    queryKey: ['my-profile-sessions'],
    queryFn: () => profileService.getSessions(),
  })

  // Chỉ hiện phiên đang hoạt động (chưa bị revoke, chưa hết hạn)
  const activeSessions = allSessions.filter(
    (s) => !s.is_revoked && dayjs(s.expires_at).isAfter(dayjs())
  )

  const revokeMutation = useMutation({
    mutationFn: (deviceId: string) =>
      httpClient.post(`/auth/devices/${deviceId}/revoke`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã thu hồi phiên đăng nhập')
      queryClient.invalidateQueries({ queryKey: ['my-profile-sessions'] })
    },
    onError: () => toast.error('Thu hồi phiên thất bại'),
  })

  const revokeAllMutation = useMutation({
    mutationFn: () =>
      httpClient.post('/auth/logout-all').then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã đăng xuất tất cả thiết bị khác')
      queryClient.invalidateQueries({ queryKey: ['my-profile-sessions'] })
    },
    onError: () => toast.error('Đăng xuất tất cả thất bại'),
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
      header: 'Đăng nhập lúc',
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
        return (
          <span className="text-sm text-muted-foreground">
            {exp.format('DD/MM/YYYY HH:mm')}
          </span>
        )
      },
    },
    {
      id: 'revoke-action',
      header: '',
      cell: ({ row }) => {
        const session = row.original
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 cursor-pointer"
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                  onClick={() => revokeMutation.mutate(session.id)}
                >
                  Thu hồi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">{activeSessions.length} thiết bị đang đăng nhập</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>
          {activeSessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 cursor-pointer" disabled={revokeAllMutation.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Đăng xuất tất cả thiết bị khác
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Đăng xuất tất cả thiết bị?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tất cả <strong>{activeSessions.length - 1}</strong> thiết bị khác sẽ bị đăng xuất ngay lập tức.
                    Chỉ phiên hiện tại của bạn được giữ lại. Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    onClick={() => revokeAllMutation.mutate()}
                  >
                    Đăng xuất tất cả
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
      ) : activeSessions.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <Monitor className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Không có thiết bị nào đang đăng nhập</p>
        </div>
      ) : (
        <DataTable columns={columns} data={activeSessions} pageSize={10} />
      )}
    </div>
  )
}
