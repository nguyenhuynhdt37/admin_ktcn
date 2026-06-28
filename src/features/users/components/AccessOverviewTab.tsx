import { RefreshCw, KeyRound, Layout, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useUserAccessOverview } from '@/features/users/hooks/useUserAccessOverview'
import {
  FeatureCard,
  groupByModule,
  getPermissionLabel,
  getActionClass,
  MODULE_LABELS,
} from './AccessOverviewComponents'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AccessOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 flex items-center gap-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border p-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main tab component ───────────────────────────────────────────────────────

interface Props {
  userId: string
  isSuperAdmin: boolean
}

export function AccessOverviewTab({ userId, isSuperAdmin }: Props) {
  const { data, isLoading, isError, error, refetch, isFetching } = useUserAccessOverview(
    userId,
    isSuperAdmin
  )

  // Permission guard: only super_admin can call this endpoint
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg border border-dashed">
        <ShieldOff className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <p className="font-medium text-sm">Chỉ Super Admin mới có thể xem</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tính năng này yêu cầu quyền <span className="font-mono">super_admin</span>.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) return <AccessOverviewSkeleton />

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status
    const is403 = status === 403
    const is404 = status === 404
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg border border-dashed">
        <ShieldOff className="size-10 text-destructive/50" />
        <div className="text-center">
          <p className="font-semibold text-sm text-destructive">
            {is403 ? 'Không đủ quyền truy cập' : is404 ? 'Người dùng không tồn tại' : 'Không thể tải dữ liệu'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {is403
              ? 'Endpoint này chỉ dành cho Super Admin.'
              : is404
              ? 'Tài khoản này không tồn tại trong hệ thống.'
              : 'Đã xảy ra lỗi khi tải thông tin quyền truy cập.'}
          </p>
        </div>
        {!is403 && !is404 && (
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 cursor-pointer">
            <RefreshCw className="size-3.5" />
            Thử lại
          </Button>
        )}
      </div>
    )
  }

  if (!data) return null

  const grouped = groupByModule(data.permission_codes)
  const moduleNames = Object.keys(grouped).sort()

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {data.roles.map((role) => (
            <Badge key={role.id} variant="secondary" className="font-mono text-xs gap-1">
              {role.name}
            </Badge>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
              <KeyRound className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng số quyền</p>
              <p className="text-2xl font-bold tabular-nums">{data.total_permissions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Layout className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tính năng có thể truy cập</p>
              <p className="text-2xl font-bold tabular-nums">{data.total_accessible_features}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-200 dark:border-violet-900 text-violet-600 dark:text-violet-400 flex-shrink-0">
              <ShieldOff className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Số vai trò</p>
              <p className="text-2xl font-bold tabular-nums">{data.roles.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Accessible features grid ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Tính năng có thể truy cập</h3>
          <Badge variant="outline" className="text-xs font-mono">
            {data.total_accessible_features} tính năng
          </Badge>
        </div>

        {data.accessible_features.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10">
            <Layout className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Không có tính năng nào được phép truy cập</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...data.accessible_features]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
          </div>
        )}
      </div>

      {/* ── Permission codes grouped by module ───────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Tất cả quyền được cấp&nbsp;
          <span className="text-muted-foreground font-normal">
            ({data.total_permissions} quyền · {moduleNames.length} module)
          </span>
        </h3>

        <div className="flex flex-col gap-3">
          {moduleNames.map((module) => (
            <div key={module} className="rounded-lg border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 font-mono">
                {MODULE_LABELS[module]?.toUpperCase() ?? module.toUpperCase()}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grouped[module].sort().map((code) => {
                  const action = code.split('.').slice(1).join('.')
                  return (
                    <TooltipProvider key={code} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium font-mono cursor-default',
                              getActionClass(action)
                            )}
                          >
                            {getPermissionLabel(code)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="font-mono text-xs font-semibold">{code}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
