import {
  Globe,
  FileText,
  Eye,
  MessageSquare,
  Users,
  KeyRound,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { DashboardResponse } from '../types'

// =====================================================
// Helpers
// =====================================================

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN')
}

// =====================================================
// Card config
// =====================================================

interface StatCardConfig {
  icon: LucideIcon
  gradient: string
  label: string
  getValue: (d: DashboardResponse) => string
  getSubtitle?: (d: DashboardResponse) => string | null
  getBadge?: (d: DashboardResponse) => { text: string; variant: 'success' | 'destructive' } | null
}

const STAT_CARDS: StatCardConfig[] = [
  {
    icon: Globe,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    label: 'TỔNG TRUY CẬP',
    getValue: (d) => formatNumber(d.visitors.total_visits),
    getBadge: (d) => ({
      text: `${d.visitors.online_count} online`,
      variant: 'success',
    }),
  },
  {
    icon: FileText,
    gradient: 'from-blue-500/20 to-indigo-500/20',
    label: 'BÀI VIẾT ĐÃ ĐĂNG',
    getValue: (d) => `${formatNumber(d.articles.published)} / ${formatNumber(d.articles.total)}`,
  },
  {
    icon: Eye,
    gradient: 'from-violet-500/20 to-purple-500/20',
    label: 'TỔNG LƯỢT XEM',
    getValue: (d) => formatNumber(d.articles.total_views),
  },
  {
    icon: MessageSquare,
    gradient: 'from-orange-500/20 to-amber-500/20',
    label: 'TƯ VẤN CHỜ XỬ LÝ',
    getValue: (d) => formatNumber(d.consultations.new),
    getBadge: (d) =>
      d.consultations.new > 0
        ? { text: `${d.consultations.new} mới`, variant: 'destructive' }
        : null,
  },
  {
    icon: Users,
    gradient: 'from-cyan-500/20 to-sky-500/20',
    label: 'THÀNH VIÊN',
    getValue: (d) => `${formatNumber(d.users.active)} / ${formatNumber(d.users.total)}`,
    getSubtitle: () => 'active / tổng',
  },
  {
    icon: KeyRound,
    gradient: 'from-pink-500/20 to-rose-500/20',
    label: 'ĐĂNG NHẬP HÔM NAY',
    getValue: (d) => formatNumber(d.logins.today),
    getSubtitle: (d) => `${formatNumber(d.logins.last_7_days)} trong 7 ngày`,
  },
  {
    icon: ShieldAlert,
    gradient: 'from-red-500/20 to-rose-500/20',
    label: 'ĐĂNG NHẬP THẤT BẠI',
    getValue: (d) => formatNumber(d.logins.failed_today),
  },
]

// =====================================================
// Components
// =====================================================

interface DashboardStatCardsProps {
  data: DashboardResponse
}

export function DashboardStatCards({ data }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {STAT_CARDS.map((cfg) => {
        const Icon = cfg.icon
        const badge = cfg.getBadge?.(data) ?? null
        const subtitle = cfg.getSubtitle?.(data) ?? null
        const isFailedLogin = cfg.icon === ShieldAlert && data.logins.failed_today > 0

        return (
          <Card key={cfg.label} className="relative overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-2">
              {/* Icon */}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${cfg.gradient}`}
              >
                <Icon className="h-4 w-4 text-foreground/70" />
              </div>

              {/* Label */}
              <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground leading-tight">
                {cfg.label}
              </span>

              {/* Value */}
              <span
                className={`text-2xl font-black leading-none ${isFailedLogin ? 'text-red-500' : ''}`}
              >
                {cfg.getValue(data)}
              </span>

              {/* Badge */}
              {badge && (
                <span
                  className={`inline-flex items-center gap-1.5 w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    badge.variant === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {badge.variant === 'success' && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                  )}
                  {badge.text}
                </span>
              )}

              {/* Subtitle */}
              {subtitle && (
                <span className="text-[10px] text-muted-foreground">{subtitle}</span>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// =====================================================
// Skeleton
// =====================================================

export function DashboardStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-14" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
