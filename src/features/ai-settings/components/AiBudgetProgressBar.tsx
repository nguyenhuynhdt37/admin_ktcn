import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { cn } from '@/lib/utils'

interface AiBudgetProgressBarProps {
  spent: number
  limit: number
  currency?: string
}

export function AiBudgetProgressBar({ spent, limit, currency = 'USD' }: AiBudgetProgressBarProps) {
  const percent = limit > 0 ? Math.min(100, Math.max(0, (spent / limit) * 100)) : 0

  // Xác định màu sắc dựa trên phần trăm chi tiêu
  const getProgressBarColor = () => {
    if (spent >= limit) return 'bg-destructive'
    if (percent > 90) return 'bg-destructive'
    if (percent > 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getTextColor = () => {
    if (spent >= limit) return 'text-destructive font-bold'
    if (percent > 90) return 'text-destructive font-semibold'
    if (percent > 70) return 'text-amber-600 font-semibold'
    return 'text-emerald-600 font-semibold'
  }

  return (
    <Card className="border border-border/80 shadow-xs bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground/90">Trạng thái Ngân sách Tháng này</CardTitle>
        <CardDescription className="text-xs">
          Chi phí AI được tính dựa trên token của prompt và completion theo đơn giá nhà cung cấp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thanh tiến trình */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">Tiến độ chi tiêu</span>
            <span className={cn("tabular-nums", getTextColor())}>{percent.toFixed(1)}%</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted border">
            <div
              className={cn("h-full transition-all duration-500 ease-out", getProgressBarColor())}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-border/60">
          <div>
            <p className="text-muted-foreground font-medium mb-0.5">Đã chi tiêu</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {spent.toFixed(4)} {currency}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium mb-0.5">Hạn mức tháng</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {limit.toFixed(4)} {currency}
            </p>
          </div>
        </div>

        {spent >= limit && (
          <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-[11px] leading-relaxed border border-destructive/20 font-medium">
            ⚠️ Hệ thống đã sử dụng hết ngân sách AI cho phép của tháng này. Tính năng AI SEO sẽ bị tạm ngưng cho đến khi hạn mức được tăng hoặc qua tháng mới.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
