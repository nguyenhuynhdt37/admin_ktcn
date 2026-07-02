import { Coins, BrainCircuit, MessageSquare, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import type { AISpendResponse } from '../types'

interface AISpendAnalyticsProps {
  spendData: AISpendResponse
  isLoading: boolean
  spendPeriod: 'day' | 'month' | 'year' | 'all'
  onPeriodChange: (period: 'day' | 'month' | 'year' | 'all') => void
  modelType: 'chat' | 'embedding'
}

export function AISpendAnalytics({
  spendData,
  isLoading,
  spendPeriod,
  onPeriodChange,
  modelType,
}: AISpendAnalyticsProps) {
  const totalCost = spendData?.time_series?.reduce((sum, item) => sum + item.total_cost, 0) || 0
  const totalTokens = spendData?.time_series?.reduce((sum, item) => sum + item.total_tokens, 0) || 0
  const totalRequests = spendData?.time_series?.reduce((sum, item) => sum + item.total_requests, 0) || 0
  const maxDayCost = spendData?.time_series?.reduce((max, item) => Math.max(max, item.total_cost), 0) || 0.00001

  // Hàm sinh avatar viết tắt từ tên người dùng
  const getInitials = (username: string) => {
    if (!username) return 'AI'
    return username.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* 4 Cards Chỉ số Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-5 flex items-center gap-3.5">
            <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng chi phí</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">${totalCost.toFixed(5)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardContent className="p-5 flex items-center gap-3.5">
            <div className="p-3 bg-indigo-505/10 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20 shrink-0">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng Tokens tiêu thụ</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{totalTokens.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-5 flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng cuộc gọi API</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{totalRequests.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-5 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thời gian thống kê</p>
              <h3 className="text-sm font-bold text-foreground mt-1 capitalize">
                {spendPeriod === 'day' && '30 ngày gần đây'}
                {spendPeriod === 'month' && '12 tháng gần đây'}
                {spendPeriod === 'year' && 'Theo các năm'}
                {spendPeriod === 'all' && 'Toàn bộ lịch sử'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ chi phí (Cột Trái) */}
        <Card className="lg:col-span-2 border shadow-sm flex flex-col bg-card">
          <CardHeader className="bg-muted/10 border-b p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Xu hướng chi tiêu AI</CardTitle>
              <CardDescription className="text-xs">Theo dõi lượng tiền tiêu thụ theo chu kỳ đã lựa chọn</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/80">
              {(['day', 'month', 'year', 'all'] as const).map((period) => (
                <Button
                  key={period}
                  variant={spendPeriod === period ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => onPeriodChange(period)}
                  className="text-[10px] px-2.5 h-7 font-bold cursor-pointer"
                >
                  {period === 'day' && 'Ngày'}
                  {period === 'month' && 'Tháng'}
                  {period === 'year' && 'Năm'}
                  {period === 'all' && 'Tất cả'}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tổng hợp dữ liệu...</p>
              </div>
            ) : spendData?.time_series?.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <h5 className="font-semibold text-sm">Chưa có chỉ số hoạt động</h5>
                <p className="text-muted-foreground text-xs mt-1 max-w-[280px]">
                  Các biểu đồ chi tiêu sẽ tự động cập nhật khi hệ thống gửi các truy vấn vector hóa/chat.
                </p>
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between gap-1.5 sm:gap-3 pt-6 px-2 border-b border-l border-border/80 relative">
                {spendData.time_series.map((item, idx) => {
                  const percentage = (item.total_cost / maxDayCost) * 100
                  const labelPart = spendPeriod === 'day' ? item.label.split('-')[2] : item.label
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      {/* Tooltip Hover chuyên nghiệp */}
                      <div className="absolute bottom-full mb-1.5 bg-popover text-popover-foreground border text-[10px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg font-mono z-10 flex flex-col items-center min-w-[90px] border-border/80">
                        <span className="font-bold text-muted-foreground">{item.label}</span>
                        <span className="font-extrabold text-primary mt-0.5">${item.total_cost.toFixed(5)}</span>
                        <span className="text-[9px] mt-0.5">{item.total_requests} calls</span>
                      </div>
                      
                      <div
                        style={{ height: `${Math.max(percentage, 4)}%` }}
                        className="w-full bg-primary/20 border-t-2 border-primary hover:bg-primary/45 rounded-t-sm transition-all duration-150 cursor-pointer shadow-2xs"
                      />
                      <span className="text-[9px] text-muted-foreground/80 mt-2 font-mono truncate max-w-full select-none">{labelPart}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phân bổ theo Người dùng (Cột Phải) */}
        <Card className="border shadow-sm flex flex-col bg-card">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-sm font-semibold text-foreground">Phân bổ theo người dùng</CardTitle>
            <CardDescription className="text-xs">Tỷ lệ đóng góp chi phí AI của các tài khoản biên tập viên</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto max-h-[300px]">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !spendData?.user_spend || spendData.user_spend.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground text-xs">
                Chưa có dữ liệu người dùng.
              </div>
            ) : (
              <div className="space-y-4">
                {spendData.user_spend.map((user, idx) => {
                  const contributionPercent = totalCost > 0 ? (user.total_cost / totalCost) * 100 : 0
                  return (
                    <div key={idx} className="space-y-1.5 p-1 rounded-lg transition-colors hover:bg-muted/10">
                      <div className="flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(user.username)}
                          </div>
                          <span className="font-semibold text-foreground truncate">{user.full_name || user.username}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-foreground">${user.total_cost.toFixed(5)}</span>
                          <span className="text-[9px] text-muted-foreground block font-semibold">{contributionPercent.toFixed(1)}% đóng góp</span>
                        </div>
                      </div>
                      {/* Progress bar độ đóng góp */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${contributionPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default AISpendAnalytics
