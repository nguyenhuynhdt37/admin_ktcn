import { useState } from 'react'
import {
  Search,
  Clock,
  Coins,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import dayjs from 'dayjs'

import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import type { AILogItem, AILogListResponse, AIModel } from '../types'

interface AILogListProps {
  logsData: AILogListResponse
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  modelFilter: string
  onModelFilterChange: (model: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  userFilter: string
  onUserFilterChange: (user: string) => void
  chatModels: AIModel[]
  embeddingModels: AIModel[]
  usersList: any[]
  modelType: 'chat' | 'embedding'
}

export function AILogList({
  logsData,
  isLoading,
  page,
  onPageChange,
  modelFilter,
  onModelFilterChange,
  statusFilter,
  onStatusFilterChange,
  userFilter,
  onUserFilterChange,
  chatModels,
  embeddingModels,
  usersList,
  modelType,
}: AILogListProps) {
  const [selectedLog, setSelectedLog] = useState<AILogItem | null>(null)
  const isSheetOpen = !!selectedLog

  const totalPages = Math.ceil((logsData?.total || 0) / (logsData?.page_size || 10))

  return (
    <div className="space-y-4">
      {/* Khung bộ lọc lọc Logs */}
      <Card className="border shadow-xs bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Lọc Model */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô hình AI</label>
              <Select value={modelFilter} onValueChange={onModelFilterChange}>
                <SelectTrigger className="h-9 text-xs bg-background cursor-pointer border-border/80">
                  <SelectValue placeholder="Tất cả mô hình" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL" className="cursor-pointer">Tất cả mô hình</SelectItem>
                  {(modelType === 'chat' ? chatModels : embeddingModels)?.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="cursor-pointer text-xs">
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lọc Trạng thái */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trạng thái cuộc gọi</label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="h-9 text-xs bg-background cursor-pointer border-border/80">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL" className="cursor-pointer">Tất cả trạng thái</SelectItem>
                  <SelectItem value="SUCCESS" className="cursor-pointer">Thành công</SelectItem>
                  <SelectItem value="FAILED" className="cursor-pointer">Thất bại</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lọc Người dùng */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Người thực hiện</label>
              <Select value={userFilter} onValueChange={onUserFilterChange}>
                <SelectTrigger className="h-9 text-xs bg-background cursor-pointer border-border/80">
                  <SelectValue placeholder="Tất cả người dùng" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL" className="cursor-pointer">Tất cả người dùng</SelectItem>
                  <SelectItem value="SYSTEM" className="cursor-pointer">Hệ thống tự động</SelectItem>
                  {usersList?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id} className="cursor-pointer text-xs">
                      {user.full_name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nút Reset lọc nhanh */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onModelFilterChange('ALL')
                  onStatusFilterChange('ALL')
                  onUserFilterChange('ALL')
                }}
                className="h-9 text-xs font-semibold cursor-pointer w-full border-border/80"
              >
                Xóa lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng danh sách log */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[100px] text-xs">Trạng thái</TableHead>
                <TableHead className="text-xs">Thời gian gọi</TableHead>
                <TableHead className="text-xs">Mô hình sử dụng</TableHead>
                <TableHead className="text-xs">Người thực hiện</TableHead>
                <TableHead className="text-xs">Tokens</TableHead>
                <TableHead className="text-xs">Phí</TableHead>
                <TableHead className="text-xs">Độ trễ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse font-medium">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Đang tải nhật ký...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !logsData?.items || logsData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    Không tìm thấy bản ghi nhật ký nào.
                  </TableCell>
                </TableRow>
              ) : (
                logsData.items.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="align-middle">
                      {log.status === 'SUCCESS' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-2 font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0 px-2 font-bold flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3 shrink-0" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground/90">
                      {dayjs(log.created_at).format('HH:mm:ss DD/MM/YYYY')}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-foreground max-w-[150px] truncate" title={log.model}>
                      {log.model}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">
                      {log.username || 'System'}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-foreground/80">
                      {log.tokens_prompt + log.tokens_completion}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-foreground/80 font-bold">
                      ${log.cost.toFixed(5)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-foreground/80">
                      {log.latency_ms} ms
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <span className="text-[11px] text-muted-foreground font-semibold">
              Tổng số bản ghi: <strong className="text-foreground">{logsData.total}</strong> (Trang {logsData.page}/{totalPages})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="h-8 text-xs font-bold cursor-pointer"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="h-8 text-xs font-bold cursor-pointer"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Drawer trượt chi tiết Log từ bên phải */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto border-l bg-card text-foreground">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <BrainCircuit className="h-4.5 w-4.5 text-primary shrink-0" />
              Chi tiết cuộc gọi API
            </SheetTitle>
            <SheetDescription className="text-xs">
              ID bản ghi: {selectedLog?.id}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-6 py-5 text-xs">
              {/* Thống kê nhanh */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 border rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Thời gian gọi</span>
                  <div className="font-mono font-medium text-foreground">{dayjs(selectedLog.created_at).format('HH:mm:ss DD/MM/YYYY')}</div>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Thời gian phản hồi</span>
                  <div className="font-mono font-bold text-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedLog.latency_ms} ms
                  </div>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Mô hình</span>
                  <div className="font-mono font-bold text-primary truncate" title={selectedLog.model}>{selectedLog.model}</div>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Trạng thái</span>
                  <div>
                    {selectedLog.status === 'SUCCESS' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Thành công</span>
                    ) : (
                      <span className="text-destructive font-bold">Thất bại</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chi phí tokens */}
              <Card className="border shadow-none bg-muted/10">
                <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Tokens Prompt</span>
                    <div className="font-mono text-foreground font-semibold">{selectedLog.tokens_prompt}</div>
                  </div>
                  <div className="space-y-0.5 border-x">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Tokens Completion</span>
                    <div className="font-mono text-foreground font-semibold">{selectedLog.tokens_completion}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Chi phí ước tính</span>
                    <div className="font-mono text-primary font-bold flex items-center justify-center gap-0.5">
                      <Coins className="h-3 w-3 text-primary shrink-0" />
                      ${selectedLog.cost.toFixed(5)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lỗi nếu có */}
              {selectedLog.error_message && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive space-y-1.5 flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-destructive" />
                  <div>
                    <span className="font-bold text-xs">Chi tiết lỗi từ API Provider:</span>
                    <p className="font-mono text-[11px] mt-1 whitespace-pre-wrap leading-normal">{selectedLog.error_message}</p>
                  </div>
                </div>
              )}

              {/* Prompt và Response */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="font-bold text-muted-foreground">Văn bản đầu vào / Prompt:</span>
                  <pre className="p-3 bg-muted/40 border rounded-lg whitespace-pre-wrap leading-normal font-mono text-[11px] overflow-x-auto select-all text-foreground max-h-40">
                    {selectedLog.prompt}
                  </pre>
                </div>

                {selectedLog.response && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-muted-foreground">Phản hồi của AI / Output JSON:</span>
                    <pre className="p-3 bg-muted/40 border rounded-lg whitespace-pre-wrap leading-normal font-mono text-[11px] overflow-x-auto select-all text-foreground max-h-56">
                      {selectedLog.response}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
export default AILogList
