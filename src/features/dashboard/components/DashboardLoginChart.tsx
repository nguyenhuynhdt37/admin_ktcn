import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { DashboardLogins, DashboardUsers } from '../types'

interface DashboardLoginChartProps {
  logins: DashboardLogins
  users: DashboardUsers
}

interface ChartDataItem {
  name: string
  value: number
  fill: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { payload: ChartDataItem }[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground mb-0.5">{item.name}</p>
      <p className="text-sm font-semibold tabular-nums">
        {item.value.toLocaleString()}
      </p>
    </div>
  )
}

export function DashboardLoginChart({
  logins,
  users,
}: DashboardLoginChartProps) {
  const chartData: ChartDataItem[] = [
    { name: 'Đăng nhập hôm nay', value: logins.today, fill: '#3b82f6' },
    { name: '7 ngày qua', value: logins.last_7_days, fill: '#6366f1' },
    { name: 'Thất bại', value: logins.failed_today, fill: '#ef4444' },
    { name: 'Hoạt động', value: users.active, fill: '#22c55e' },
    { name: 'Bị khóa', value: users.locked, fill: '#f97316' },
    { name: 'Đã xóa', value: users.deleted, fill: '#94a3b8' },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Đăng nhập &amp; Tài khoản
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                barSize={32}
                label={{
                  position: 'top',
                  fontSize: 11,
                  fontWeight: 600,
                  fill: '#64748b',
                }}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardLoginChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full flex items-end gap-3 pt-6">
          {[65, 85, 30, 70, 20, 40].map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
