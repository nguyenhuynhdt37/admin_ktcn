import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  ShieldCheck,
  ShieldAlert,
  Wifi,
  XCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { userActivityService } from '@/features/users/services/userActivityService'
import type { AnomalyType, RiskLevel, Severity } from '@/features/users/types/userActivity.types'

const RISK_CONFIG: Record<RiskLevel, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  SAFE:     { label: 'An toàn',    variant: 'default',     className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400' },
  LOW:      { label: 'Thấp',       variant: 'secondary',   className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400' },
  MEDIUM:   { label: 'Trung bình', variant: 'outline',     className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400' },
  HIGH:     { label: 'Cao',        variant: 'destructive', className: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400' },
  CRITICAL: { label: 'Nguy hiểm', variant: 'destructive', className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 animate-pulse' },
}

const SEVERITY_CONFIG: Record<Severity, { icon: React.ElementType; className: string }> = {
  LOW:      { icon: CheckCircle2,  className: 'text-blue-500' },
  MEDIUM:   { icon: AlertTriangle, className: 'text-amber-500' },
  HIGH:     { icon: AlertTriangle, className: 'text-orange-500' },
  CRITICAL: { icon: ShieldAlert,   className: 'text-red-500' },
}

const ANOMALY_LABELS: Record<AnomalyType, string> = {
  BRUTE_FORCE:   'Tấn công dò mật khẩu',
  NEW_LOCATION:  'Địa điểm đăng nhập mới',
  UNUSUAL_HOUR:  'Đăng nhập ngoài giờ',
  MULTI_SESSION: 'Nhiều phiên đồng thời',
}

interface AnomaliesTabProps {
  userId: string
}

export function AnomaliesTab({ userId }: AnomaliesTabProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-anomalies', userId],
    queryFn: () => userActivityService.getAnomalies(userId),
  })

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const riskCfg = RISK_CONFIG[data.risk_level]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${riskCfg.className}`}>
              {data.risk_level === 'SAFE' ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mức rủi ro</p>
              <p className={`text-lg font-bold ${riskCfg.className}`}>{riskCfg.label}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phiên đang hoạt động</p>
              <p className="text-lg font-bold">{data.active_session_count}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đăng nhập thất bại (24h)</p>
              <p className="text-lg font-bold">{data.failed_login_count_24h}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Danh sách bất thường phát hiện</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>
        </div>

        {data.anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
            <div className="text-center">
              <p className="font-medium text-emerald-600 dark:text-emerald-400">Không phát hiện bất thường</p>
              <p className="text-sm text-muted-foreground mt-1">Hoạt động của tài khoản này bình thường.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.anomalies.map((anomaly, idx) => {
              const cfg = SEVERITY_CONFIG[anomaly.severity]
              const Icon = cfg.icon
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30"
                >
                  <div className={`mt-0.5 flex-shrink-0 ${cfg.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{ANOMALY_LABELS[anomaly.type]}</span>
                      <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Phát hiện lúc: {dayjs(anomaly.detected_at).format('HH:mm DD/MM/YYYY')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Báo cáo được tạo lúc: {dayjs(data.generated_at).format('HH:mm:ss DD/MM/YYYY')}
        </p>
      </div>
    </div>
  )
}
