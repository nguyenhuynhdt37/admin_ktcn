// @ts-nocheck
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ShieldAlert,
  Monitor,
  Clock,
  Lock,
  Unlock,
  User,
  Loader2,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
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
import { useAuth } from '@/app/providers/AuthProvider'
import { useAuthStore } from '@/stores/authStore'
import { userActivityService } from '@/features/users/services/userActivityService'

import { SessionsTab } from '@/features/users/components/SessionsTab'
import { LoginHistoryTab } from '@/features/users/components/LoginHistoryTab'
import { AnomaliesTab } from '@/features/users/components/AnomaliesTab'
import { AccessOverviewTab } from '@/features/users/components/AccessOverviewTab'

export function UserActivityPage() {
  const { id: userId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()

  const isAdmin = !!currentUser?.is_admin || !!currentUser?.roles?.includes('super_admin')
  const isAuthorized = isAdmin || userId === currentUser?.id
  const canView      = hasPermission('user.view') && isAuthorized
  const canUpdate    = hasPermission('user.update') && isAuthorized
  const canLock      = isAdmin
  const canUnlock    = isAdmin
  const isSuperAdmin = currentUser?.roles?.includes('super_admin')

  // Fetch user status to know if account is locked or not
  const { data: sessionsData } = useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: () => userActivityService.getSessions(userId!),
    enabled: !!userId && canView,
  })

  const lockMutation = useMutation({
    mutationFn: () => userActivityService.lockUser(userId!),
    onSuccess: (res) => {
      toast.success(res.message)
      queryClient.invalidateQueries({ queryKey: ['user-sessions', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Không thể khóa tài khoản'),
  })

  const unlockMutation = useMutation({
    mutationFn: () => userActivityService.unlockUser(userId!),
    onSuccess: (res) => {
      toast.success(res.message)
      queryClient.invalidateQueries({ queryKey: ['user-sessions', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Không thể mở khóa tài khoản'),
  })

  if (!userId) return null

  if (!canView) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <ShieldAlert className="h-12 w-12 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">Truy cập bị từ chối</h3>
        <p className="text-muted-foreground">Bạn không có quyền xem thông tin hoạt động tài khoản.</p>
      </div>
    )
  }

  const hasActiveSessions = sessionsData ? sessionsData.some((s) => !s.is_revoked) : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/users')}
            className="gap-1.5 -ml-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Hoạt động tài khoản</h2>
            <p className="text-muted-foreground text-sm font-mono mt-0.5 select-all">{userId}</p>
          </div>
        </div>

        {/* Lock / Unlock Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canUnlock && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
              onClick={() => unlockMutation.mutate()}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
              Mở khóa
            </Button>
          )}
          {canLock && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  disabled={lockMutation.isPending}
                >
                  {lockMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Khóa tài khoản
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận khóa tài khoản?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tài khoản sẽ bị khóa ngay lập tức. Người dùng sẽ không thể đăng nhập và
                    {hasActiveSessions ? ' tất cả phiên đang hoạt động sẽ bị thu hồi.' : ' không thể tạo phiên mới.'}
                    {' '}Bạn có thể mở khóa bất cứ lúc nào.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    onClick={() => lockMutation.mutate()}
                  >
                    Xác nhận khóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList className={`grid w-full sm:w-auto sm:inline-grid ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="sessions" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Phiên đăng nhập
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Lịch sử
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Bảo mật
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="access-overview" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Phân quyền
            </TabsTrigger>
          )}
        </TabsList>

        <Card className="mt-4">
          <TabsContent value="sessions" className="m-0">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Danh sách phiên đăng nhập</CardTitle>
              <CardDescription>Xem và quản lý các phiên đăng nhập (còn hạn) của tài khoản này.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <SessionsTab userId={userId} canUpdate={canUpdate} />
            </CardContent>
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Lịch sử đăng nhập</CardTitle>
              <CardDescription>Toàn bộ lịch sử đăng nhập, bao gồm cả thành công và thất bại.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <LoginHistoryTab userId={userId} />
            </CardContent>
          </TabsContent>

          <TabsContent value="anomalies" className="m-0">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Phân tích bảo mật & Bất thường</CardTitle>
              <CardDescription>Báo cáo phân tích hành vi bất thường dựa trên dữ liệu đăng nhập 24h qua.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AnomaliesTab userId={userId} />
            </CardContent>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="access-overview" className="m-0">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">Tổng quan phân quyền</CardTitle>
                <CardDescription>
                  Vai trò, quyền được cấp và các tính năng có thể truy cập của tài khoản này.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <AccessOverviewTab userId={userId} isSuperAdmin={isSuperAdmin} />
              </CardContent>
            </TabsContent>
          )}
        </Card>
      </Tabs>
    </div>
  )
}

export default UserActivityPage
