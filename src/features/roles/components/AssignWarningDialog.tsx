import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface AssignWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function AssignWarningDialog({ open, onOpenChange, message }: AssignWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Không thể xóa vai trò
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground text-sm leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-amber-500/5 p-3 text-xs text-amber-600 border-amber-200 mt-2 leading-relaxed">
          <strong>Hướng dẫn khắc phục:</strong> Vui lòng đi tới trang <strong>Quản lý thành viên</strong>, lọc danh sách theo vai trò này, chỉnh sửa thông tin của các thành viên liên quan để chuyển họ sang một vai trò khác (ví dụ: Tác giả hoặc Biên tập viên) trước khi thực hiện xóa vai trò này.
        </div>
        <DialogFooter className="pt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Đóng lại
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 cursor-pointer"
            onClick={() => {
              onOpenChange(false)
              window.location.href = '/users'
            }}
          >
            Đi tới Quản lý thành viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
