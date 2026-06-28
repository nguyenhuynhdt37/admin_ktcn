import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import type { AISpendingByModelResponse } from '../types'

interface AiCostByModelProps {
  data: AISpendingByModelResponse[]
  limit: number
  currency?: string
}

export function AiCostByModel({ data, limit, currency = 'USD' }: AiCostByModelProps) {
  return (
    <Card className="border border-border/80 shadow-xs bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground/90">Chi tiết chi tiêu theo Model AI</CardTitle>
        <CardDescription className="text-xs">
          Thống kê chi phí tiêu dùng của từng model so với tổng hạn mức của tháng hiện tại.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Chưa phát sinh chi phí sử dụng model.</p>
        ) : (
          data.map((ms) => (
            <div key={`${ms.provider}-${ms.model}`} className="bg-muted/30 p-3 rounded-lg space-y-2 border border-dashed">
              <div className="flex justify-between text-xs items-center gap-2">
                <span className="font-semibold text-primary capitalize truncate font-mono" title={`${ms.provider} / ${ms.model}`}>
                  {ms.provider} / {ms.model}
                </span>
                <span className="font-semibold text-foreground/80 tabular-nums shrink-0">
                  {ms.total_spent.toFixed(4)} {currency} ({ms.percentage_of_limit.toFixed(1)}%)
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted border">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, ms.percentage_of_limit)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
