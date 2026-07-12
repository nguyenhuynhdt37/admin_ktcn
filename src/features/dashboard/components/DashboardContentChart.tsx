import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { DashboardContent } from '../types'

interface DashboardContentChartProps {
  data: DashboardContent
}

interface ChartItem {
  name: string
  value: number
  fill: string
}

const CHART_ITEMS: { key: keyof Omit<DashboardContent, 'media_storage_bytes'>; label: string; fill: string }[] = [
  { key: 'media_count', label: 'Media', fill: '#3b82f6' },
  { key: 'categories', label: 'Danh mục', fill: '#22c55e' },
  { key: 'departments', label: 'Đơn vị', fill: '#f97316' },
  { key: 'banners', label: 'Banners', fill: '#8b5cf6' },
]

const MAX_STORAGE_GB = 10

export function DashboardContentChart({ data }: DashboardContentChartProps) {
  const chartData: ChartItem[] = CHART_ITEMS.map((item) => ({
    name: item.label,
    value: data[item.key],
    fill: item.fill,
  }))

  const maxValue = Math.max(...chartData.map((d) => d.value), 1)

  const storageGB = Number((data.media_storage_bytes / 1024 ** 3).toFixed(2))
  const storagePercent = Math.min((storageGB / MAX_STORAGE_GB) * 100, 100)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Tổng quan nội dung hệ thống
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Radial Bar Chart */}
          <div className="w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="25%"
                outerRadius="90%"
                barSize={14}
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, maxValue]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: '#f1f5f9' }}
                  dataKey="value"
                  angleAxisId={0}
                  cornerRadius={6}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            {CHART_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-semibold ml-auto tabular-nums">
                  {data[item.key].toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Media Storage Progress Bar */}
        <div className="mt-5 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Dung lượng Media
            </span>
            <span className="text-xs font-semibold tabular-nums">
              {storageGB} GB / {MAX_STORAGE_GB} GB
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${storagePercent}%`,
                background:
                  'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardContentChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-56" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <Skeleton className="w-[180px] h-[180px] rounded-full shrink-0" />
          <div className="flex flex-col gap-3 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8 ml-auto" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
