import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { DashboardArticles } from '../types'

// =====================================================
// Chart config
// =====================================================

interface SegmentConfig {
  key: keyof Omit<DashboardArticles, 'total' | 'total_views'>
  label: string
  color: string
}

const SEGMENTS: SegmentConfig[] = [
  { key: 'published', label: 'Published', color: '#22c55e' },
  { key: 'draft', label: 'Draft', color: '#94a3b8' },
  { key: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { key: 'archived', label: 'Archived', color: '#f97316' },
  { key: 'trash', label: 'Trash', color: '#ef4444' },
]

// =====================================================
// Custom Tooltip
// =====================================================

interface TooltipPayloadEntry {
  name: string
  value: number
  payload: { name: string; value: number; color: string; total: number }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function ArticleChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const percent = entry.payload.total > 0
    ? ((entry.value / entry.payload.total) * 100).toFixed(1)
    : '0'

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="font-medium">{entry.name}</span>
      </div>
      <div className="mt-1 text-muted-foreground">
        {entry.value.toLocaleString('vi-VN')} — {percent}%
      </div>
    </div>
  )
}

// =====================================================
// Component
// =====================================================

interface DashboardArticleChartProps {
  data: DashboardArticles
}

export function DashboardArticleChart({ data }: DashboardArticleChartProps) {
  const chartData = SEGMENTS.map((seg) => ({
    name: seg.label,
    value: data[seg.key],
    color: seg.color,
    total: data.total,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Phân bố trạng thái bài viết</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Donut chart */}
        <div className="h-[250px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ArticleChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <span className="text-3xl font-black">{data.total.toLocaleString('vi-VN')}</span>
              <p className="text-[10px] text-muted-foreground">Tổng bài viết</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {SEGMENTS.map((seg) => (
            <div key={seg.key} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="font-semibold">{data[seg.key].toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// Skeleton
// =====================================================

export function DashboardArticleChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-52" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
