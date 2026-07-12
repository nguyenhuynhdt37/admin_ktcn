import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ACTION_LABELS, ACTION_COLORS } from '../types'
import type { RecentActivityItem } from '../types'

dayjs.extend(relativeTime)
dayjs.locale('vi')

interface DashboardRecentActivitiesProps {
  data: RecentActivityItem[]
}

const DEFAULT_ACTION_COLOR = { bg: 'bg-slate-50', text: 'text-slate-600' }
const DOT_COLORS: Record<string, string> = {
  AUTH_LOGIN: 'bg-blue-500',
  AUTH_LOGOUT: 'bg-slate-400',
  USER_CREATED: 'bg-emerald-500',
  USER_UPDATED: 'bg-amber-500',
  USER_DELETED: 'bg-red-500',
  USER_LOCKED: 'bg-red-400',
  USER_UNLOCKED: 'bg-teal-500',
  PROFILE_UPDATED: 'bg-indigo-500',
  PASSWORD_CHANGED: 'bg-violet-500',
  ARTICLE_CREATED: 'bg-emerald-500',
  ARTICLE_UPDATED: 'bg-sky-500',
  ARTICLE_DELETED: 'bg-red-500',
  BANNER_CREATED: 'bg-orange-500',
  BANNER_UPDATED: 'bg-amber-500',
  BANNER_DELETED: 'bg-red-500',
  CATEGORY_CREATED: 'bg-purple-500',
  CATEGORY_UPDATED: 'bg-fuchsia-500',
  CATEGORY_DELETED: 'bg-red-500',
  MEDIA_UPLOADED: 'bg-cyan-500',
  DEPARTMENT_CREATED: 'bg-lime-500',
  DEPARTMENT_UPDATED: 'bg-green-500',
}

export function DashboardRecentActivities({
  data,
}: DashboardRecentActivitiesProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-40"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm">Chưa có hoạt động nào</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto pr-1">
          <div className="relative ml-3">
            {/* Vertical dashed line */}
            <div className="absolute left-0 top-1 bottom-1 border-l-2 border-dashed border-slate-200" />

            <div className="flex flex-col gap-4">
              {data.map((item, index) => {
                const actionColor =
                  ACTION_COLORS[item.action] ?? DEFAULT_ACTION_COLOR
                const dotColor = DOT_COLORS[item.action] ?? 'bg-slate-400'
                const label = ACTION_LABELS[item.action] ?? item.action

                return (
                  <div key={index} className="relative pl-5">
                    {/* Dot */}
                    <span
                      className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${dotColor}`}
                    />

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          {item.actor_username}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${actionColor.bg} ${actionColor.text}`}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {item.target_type}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          •
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {dayjs(item.created_at).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardRecentActivitiesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="ml-3 relative">
          <div className="absolute left-0 top-1 bottom-1 border-l-2 border-dashed border-slate-200" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative pl-5">
                <Skeleton className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full" />
                <div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
