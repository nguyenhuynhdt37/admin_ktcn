import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { getModifierKey, getAltKey } from '@/shared/utils/os'
import { Keyboard, Layout, Navigation2, SunMoon } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const modKey = getModifierKey()
  const altKey = getAltKey()

  const shortcutGroups = [
    {
      title: 'Hệ thống & Bố cục',
      icon: Layout,
      shortcuts: [
        { keys: [modKey, 'K'], description: 'Mở/đóng thanh lệnh nhanh (Command Palette)' },
        { keys: [modKey, 'B'], description: 'Ẩn/hiện Sidebar (Thanh bên trái)' },
        { keys: ['?'], description: 'Mở bảng hướng dẫn phím tắt này' },
      ],
    },
    {
      title: 'Điều hướng nhanh',
      icon: Navigation2,
      shortcuts: [
        { keys: [altKey, 'D'], description: 'Đi tới trang Tổng quan (Dashboard)' },
        { keys: [altKey, 'U'], description: 'Đi tới trang Quản lý thành viên (Users)' },
        { keys: [altKey, 'R'], description: 'Đi tới trang Quản lý Vai trò (Roles)' },
        { keys: [altKey, 'L'], description: 'Đi tới trang Nhật ký hoạt động (Audit Logs)' },
      ],
    },
    {
      title: 'Giao diện & Tiện ích',
      icon: SunMoon,
      shortcuts: [
        { keys: [altKey, 'T'], description: 'Chuyển đổi giao diện Sáng / Tối' },
        { keys: ['Esc'], description: 'Đóng các hộp thoại đang mở' },
      ],
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-border bg-background/95 backdrop-blur-md shadow-2xl transition-all duration-300">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Keyboard className="h-5 w-5 text-primary" />
            Phím tắt Hệ thống
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Tăng tốc độ làm việc của bạn với các tổ hợp phím tắt được tối ưu hóa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {shortcutGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <group.icon className="h-4 w-4 text-muted-foreground/80" />
                {group.title}
              </h3>
              <div className="divide-y divide-border/40 rounded-lg border bg-muted/20">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground/80">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, keyIdx) => (
                        <div key={keyIdx} className="flex items-center gap-1.5">
                          {keyIdx > 0 && <span className="text-xs text-muted-foreground">+</span>}
                          <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border bg-card px-1.5 font-mono text-xs font-semibold text-foreground shadow-xs">
                            {key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            Nhấn <kbd className="inline-flex h-4 items-center justify-center rounded border bg-muted px-1 font-mono text-[9px] font-bold">Esc</kbd> để đóng bảng trợ giúp này bất cứ lúc nào.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
