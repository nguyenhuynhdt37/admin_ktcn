import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
  Dialog,
  DialogContent,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { getModifierKey, getAltKey } from '@/shared/utils/os'
import {
  Search,
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Palette,
  SunMoon,
  LogOut,
  HelpCircle,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onToggleTheme: () => void
  onLogout: () => void
  onOpenHelp: () => void
}

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  category: 'pages' | 'actions'
  action: () => void
  shortcut?: string[]
}

export function CommandPalette({
  isOpen,
  onClose,
  onToggleTheme,
  onLogout,
  onOpenHelp,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const modKey = getModifierKey()
  const altKey = getAltKey()

  // Định nghĩa các lệnh tìm kiếm
  const commands: CommandItem[] = [
    // Phân mục: Trang quản trị
    {
      id: 'dashboard',
      title: 'Tổng quan (Dashboard)',
      subtitle: 'Xem biểu đồ và báo cáo hệ thống',
      icon: LayoutDashboard,
      category: 'pages',
      action: () => {
        navigate('/dashboard')
        onClose()
      },
      shortcut: [altKey, 'D'],
    },
    {
      id: 'articles',
      title: 'Quản lý bài viết',
      subtitle: 'Danh sách bài viết tin tức và bài học',
      icon: FileText,
      category: 'pages',
      action: () => {
        navigate('/articles')
        onClose()
      },
    },
    {
      id: 'users',
      title: 'Quản lý thành viên',
      subtitle: 'Xem, tạo mới và phân quyền thành viên',
      icon: Users,
      category: 'pages',
      action: () => {
        navigate('/users')
        onClose()
      },
      shortcut: [altKey, 'U'],
    },
    {
      id: 'roles',
      title: 'Quản lý vai trò & quyền',
      subtitle: 'Cấu hình quyền hạn của nhóm người dùng',
      icon: Shield,
      category: 'pages',
      action: () => {
        navigate('/roles')
        onClose()
      },
      shortcut: [altKey, 'R'],
    },
    {
      id: 'ui-sandbox',
      title: 'Thư viện giao diện (UI Sandbox)',
      subtitle: 'Các component giao diện mẫu',
      icon: Palette,
      category: 'pages',
      action: () => {
        navigate('/ui-sandbox')
        onClose()
      },
    },
    {
      id: 'settings',
      title: 'Cấu hình hệ thống',
      subtitle: 'Quản lý thiết lập hệ thống và CMS',
      icon: Settings,
      category: 'pages',
      action: () => {
        navigate('/settings')
        onClose()
      },
    },
    // Phân mục: Hành động nhanh
    {
      id: 'toggle-theme',
      title: 'Chuyển đổi giao diện Sáng / Tối',
      subtitle: 'Thay đổi theme hệ thống',
      icon: SunMoon,
      category: 'actions',
      action: () => {
        onToggleTheme()
        onClose()
      },
      shortcut: [altKey, 'T'],
    },
    {
      id: 'keyboard-help',
      title: 'Xem danh sách phím tắt',
      subtitle: 'Mở bảng trợ giúp phím tắt nhanh',
      icon: HelpCircle,
      category: 'actions',
      action: () => {
        onClose()
        setTimeout(() => {
          onOpenHelp()
        }, 100) // Đợi đóng Command Palette xong mới mở Help Modal
      },
      shortcut: ['?'],
    },
    {
      id: 'logout',
      title: 'Đăng xuất khỏi hệ thống',
      subtitle: 'Kết thúc phiên làm việc hiện tại',
      icon: LogOut,
      category: 'actions',
      action: () => {
        onLogout()
        onClose()
      },
    },
  ]

  // Filter commands dựa trên nội dung search
  const filteredCommands = commands.filter((cmd) => {
    const searchString = `${cmd.title} ${cmd.subtitle || ''} ${cmd.category}`.toLowerCase()
    return searchString.includes(search.toLowerCase())
  })

  // Reset selectedIndex khi search thay đổi
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input khi mở Command Palette
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      // Thêm timeout nhỏ để đảm bảo input đã render trong DOM
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Xử lý sự kiện nhấn phím để duyệt danh sách
  useEffect(() => {
    if (!isOpen || filteredCommands.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  // Tự động cuộn danh sách khi selectedIndex thay đổi
  useEffect(() => {
    if (!listRef.current) return
    const activeItem = listRef.current.querySelector('[data-active="true"]') as HTMLElement
    if (activeItem) {
      activeItem.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [selectedIndex])

  // Gom nhóm lệnh
  const categories = [
    { id: 'pages', name: 'Trang quản trị & Điều hướng' },
    { id: 'actions', name: 'Thao tác nhanh' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 border-border bg-background/80 backdrop-blur-lg shadow-2xl transition-all duration-300">
        {/* Search Input bar */}
        <div className="flex items-center border-b px-4 py-3.5">
          <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Gõ lệnh hoặc tên trang cần tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
          <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[350px] overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
              <p className="text-sm">Không tìm thấy lệnh hoặc trang phù hợp</p>
            </div>
          ) : (
            categories.map((cat) => {
              const catCommands = filteredCommands.filter((cmd) => cmd.category === cat.id)
              if (catCommands.length === 0) return null

              return (
                <div key={cat.id} className="mb-3 last:mb-0">
                  <h4 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                    {cat.name}
                  </h4>
                  <div className="space-y-0.5 mt-1">
                    {catCommands.map((cmd) => {
                      // Tính toán index toàn cục của command trong filteredCommands
                      const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id)
                      const isActive = globalIndex === selectedIndex

                      return (
                        <button
                          key={cmd.id}
                          data-active={isActive}
                          onClick={cmd.action}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-150 border border-transparent',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm font-medium scale-[1.005]'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-md border shrink-0',
                                isActive
                                  ? 'bg-primary-foreground/10 border-primary-foreground/20'
                                  : 'bg-card border-border'
                              )}
                            >
                              <cmd.icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm truncate font-medium">{cmd.title}</p>
                              <p
                                className={cn(
                                  'text-xs truncate',
                                  isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                )}
                              >
                                {cmd.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {cmd.shortcut && (
                              <div className="flex items-center gap-1">
                                {cmd.shortcut.map((key, keyIdx) => (
                                  <kbd
                                    key={keyIdx}
                                    className={cn(
                                      'inline-flex h-5 min-w-[18px] items-center justify-center rounded px-1 font-mono text-[9px] font-bold shadow-xs',
                                      isActive
                                        ? 'bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground'
                                        : 'bg-card border border-border text-muted-foreground'
                                    )}
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            )}
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 opacity-60 transition-transform duration-150',
                                isActive ? 'translate-x-0.5 text-primary-foreground' : 'text-muted-foreground'
                              )}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Dùng phím <kbd className="font-mono bg-card border px-1 rounded">↑↓</kbd> để di chuyển</span>
            <span><kbd className="font-mono bg-card border px-1 rounded">Enter</kbd> để thực thi</span>
          </div>
          <div>
            <span>Có tất cả {commands.length} chức năng hệ thống</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
