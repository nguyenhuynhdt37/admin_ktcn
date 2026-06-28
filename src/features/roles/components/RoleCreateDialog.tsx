import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'

interface RoleCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newRoleName: string
  setNewRoleName: (val: string) => void
  newRoleCode: string
  setNewRoleCode: (val: string) => void
  newRoleDesc: string
  setNewRoleDesc: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
  slugifyCode: (str: string) => string
  canCreate: boolean
}

export function RoleCreateDialog({
  open,
  onOpenChange,
  newRoleName,
  setNewRoleName,
  newRoleCode,
  setNewRoleCode,
  newRoleDesc,
  setNewRoleDesc,
  onSubmit,
  isSaving,
  slugifyCode,
  canCreate,
}: RoleCreateDialogProps) {
  if (!canCreate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          Thêm vai trò mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm vai trò mới</DialogTitle>
          <DialogDescription>
            Tạo vai trò quản trị mới. Mã định danh code duy nhất và không thể thay đổi sau khi tạo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Tên vai trò *</label>
            <Input
              placeholder="Ví dụ: Kiểm duyệt viên"
              value={newRoleName}
              onChange={(e) => {
                const val = e.target.value
                setNewRoleName(val)
                setNewRoleCode(slugifyCode(val))
              }}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Mã vai trò (code) *</label>
            <Input
              placeholder="Ví dụ: content_reviewer"
              value={newRoleCode}
              onChange={(e) => setNewRoleCode(e.target.value)}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Chỉ dùng chữ cái viết thường không dấu, số và gạch dưới (ví dụ: reviewer_1)
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Mô tả</label>
            <Input
              placeholder="Nhập mô tả nhiệm vụ của vai trò..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang tạo...' : 'Xác nhận tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
