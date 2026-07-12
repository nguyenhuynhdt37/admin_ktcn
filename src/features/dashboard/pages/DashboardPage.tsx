import { RefreshCw, LayoutDashboard, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useDashboard } from '../hooks/useDashboard'
import { DashboardStatCards, DashboardStatCardsSkeleton } from '../components/DashboardStatCards'
import { DashboardArticleChart, DashboardArticleChartSkeleton } from '../components/DashboardArticleChart'
import { DashboardConsultationChart, DashboardConsultationChartSkeleton } from '../components/DashboardConsultationChart'
import { DashboardContentChart, DashboardContentChartSkeleton } from '../components/DashboardContentChart'
import { DashboardTopArticles, DashboardTopArticlesSkeleton } from '../components/DashboardTopArticles'
import { DashboardLoginChart, DashboardLoginChartSkeleton } from '../components/DashboardLoginChart'
import { DashboardRecentActivities, DashboardRecentActivitiesSkeleton } from '../components/DashboardRecentActivities'

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard()

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Không thể tải dữ liệu Dashboard</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại.'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="cursor-pointer gap-2">
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </Button>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader isFetching={false} onRefresh={() => {}} onlineCount={0} isLoading />
        <DashboardStatCardsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardArticleChartSkeleton />
          <DashboardConsultationChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardContentChartSkeleton />
          <DashboardTopArticlesSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardLoginChartSkeleton />
          <DashboardRecentActivitiesSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        isFetching={isFetching}
        onRefresh={() => refetch()}
        onlineCount={data.visitors.online_count}
        isLoading={false}
      />

      {/* Row 1: KPI Stat Cards */}
      <DashboardStatCards data={data} />

      {/* Row 2: Donut Charts — Bài viết + Tư vấn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardArticleChart data={data.articles} />
        <DashboardConsultationChart data={data.consultations} />
      </div>

      {/* Row 3: Content Overview + Top Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardContentChart data={data.content} />
        <DashboardTopArticles data={data.top_articles} />
      </div>

      {/* Row 4: Login Chart + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardLoginChart logins={data.logins} users={data.users} />
        <DashboardRecentActivities data={data.recent_activities} />
      </div>
    </div>
  )
}

// =====================================================
// Dashboard Header — Sub-component nội bộ
// =====================================================
interface DashboardHeaderProps {
  isFetching: boolean
  onRefresh: () => void
  onlineCount: number
  isLoading: boolean
}

function DashboardHeader({ isFetching, onRefresh, onlineCount, isLoading }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard Tổng quan
          </h2>
          <p className="text-xs text-muted-foreground">
            Báo cáo tình hình hoạt động của hệ thống
          </p>
        </div>

        {/* Online Badge */}
        {!isLoading && onlineCount > 0 && (
          <Badge variant="outline" className="ml-2 gap-1.5 text-[10px] font-bold text-emerald-700 border-emerald-200 bg-emerald-50/60 py-0.5 px-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {onlineCount} online
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Auto-refresh indicator */}
        {isFetching && !isLoading && (
          <Badge variant="secondary" className="text-[10px] gap-1 font-medium py-0.5 px-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Đang cập nhật...
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="cursor-pointer gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>
    </div>
  )
}

export default DashboardPage
