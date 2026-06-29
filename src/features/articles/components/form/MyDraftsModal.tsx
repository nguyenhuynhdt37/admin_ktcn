import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { FileText, Loader2, ArrowRight, Calendar } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { articleService } from '../../services/articleService'

interface MyDraftsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDraft: (id: string) => void
}

export function MyDraftsModal({ open, onOpenChange, onSelectDraft }: MyDraftsModalProps) {
  const [page, setPage] = useState(1)
  const pageSize = 5

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['my-drafts', page],
    queryFn: () => articleService.listMyDrafts({ page, page_size: pageSize }),
    enabled: open,
    placeholderData: (prev) => prev,
  })

  const drafts = data?.items || []
  const hasNext = data?.has_next || false
  const hasPrevious = data?.has_previous || false
  const totalItems = data?.total_items || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bản nháp của tôi
          </DialogTitle>
          <DialogDescription className="text-xs">
            Danh sách các bài viết nháp do bạn tạo đang viết dở. Bạn có thể chọn để biên tập tiếp.
          </DialogDescription>
        </DialogHeader>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-2 min-h-[300px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Đang tải danh sách bản nháp...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2.5 text-center bg-muted/10 border border-dashed rounded-lg p-6">
              <FileText className="h-10 w-10 text-muted-foreground/60" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Không tìm thấy bản nháp</p>
                <p className="text-xs text-muted-foreground max-w-[320px]">
                  Bạn chưa có bài viết nháp nào trong hệ thống. Hãy bắt đầu viết bài và lưu nháp.
                </p>
              </div>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-semibold h-9 py-2">Tiêu đề bản nháp</TableHead>
                    <TableHead className="text-xs font-semibold h-9 py-2 w-[160px]">Ngày tạo</TableHead>
                    <TableHead className="text-xs font-semibold h-9 py-2 w-[100px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="py-2.5 font-medium text-xs leading-relaxed max-w-[280px] truncate">
                        {draft.title || <span className="italic text-muted-foreground">(Không có tiêu đề)</span>}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5 opacity-70" />
                          {dayjs(draft.created_at).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover hover:bg-primary/5 cursor-pointer"
                          onClick={() => onSelectDraft(draft.id)}
                        >
                          Biên tập tiếp
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer pagination */}
        {totalItems > pageSize && (
          <div className="shrink-0 flex items-center justify-between border-t pt-4 mt-2">
            <span className="text-[11px] text-muted-foreground font-medium">
              Tổng số: <strong>{totalItems}</strong> bản nháp (Trang {page} / {Math.ceil(totalItems / pageSize)})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                disabled={!hasPrevious || isLoading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                disabled={!hasNext || isLoading || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
