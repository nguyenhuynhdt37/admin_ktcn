import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuthStore, type User as AuthUser } from '@/stores/authStore'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTheme } from '@/app/providers/ThemeProvider'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Drawer, DrawerContent, DrawerTrigger } from '@/shared/components/ui/drawer'
import {
  LayoutDashboard,
  Users,
  Palette,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  Bell,
  FileText,
  FolderOpen,
  Tag,
  Image,
  BookOpen,
  Sliders,
  Shield,
  Key,
  Layers,
  Clock,
  FileSpreadsheet,
  Search,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Imports cho phím tắt và Command Palette
import { useHotkeys } from '@/shared/hooks/useHotkeys'
import { CommandPalette } from '@/shared/components/CommandPalette'
import { KeyboardShortcutsHelp } from '@/shared/components/KeyboardShortcutsHelp'
import { getModifierKey, getAltKey } from '@/shared/utils/os'

interface SidebarContentProps {
  user: AuthUser | null
  onClose?: () => void
}

function SidebarContent({ user, onClose }: SidebarContentProps) {
  const { hasPermission } = useAuth()

  // ── Sidebar Navigation Sections ──
  const navSections = [
    {
      label: 'Tổng quan',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' as string | string[] | null },
      ],
    },
    {
      label: 'Nội dung',
      items: [
        { label: 'Bài viết', href: '/articles', icon: FileText, permission: ['article.view', 'article.view_own'] as string | string[] | null },
        { label: 'Danh mục', href: '/categories', icon: FolderOpen, permission: 'category.view' as string | string[] | null },
        { label: 'Thẻ (Tag)', href: '/tags', icon: Tag, permission: 'tag.view' as string | string[] | null },
        { label: 'Thư viện Media', href: '/media', icon: Image, permission: ['media.view', 'media.view_own'] as string | string[] | null },
        { label: 'Trang tĩnh', href: '/pages', icon: BookOpen, permission: 'page.view' as string | string[] | null },
        { label: 'Menu điều hướng', href: '/menus', icon: Menu, permission: 'menu.view' as string | string[] | null },
        { label: 'Banner quảng cáo', href: '/banners', icon: Sliders, permission: 'banner.view' as string | string[] | null },
      ],
    },
    {
      label: 'Quản trị',
      items: [
        { label: 'Thành viên', href: '/users', icon: Users, permission: 'user.view' as string | string[] | null },
        { label: 'Vai trò', href: '/roles', icon: Shield, permission: 'role.view' as string | string[] | null },
        { label: 'Quyền hạn', href: '/permissions', icon: Key, permission: 'permission.view' as string | string[] | null },
        { label: 'Tính năng hệ thống', href: '/features', icon: Layers, permission: 'feature.view' as string | string[] | null },
      ],
    },
    {
      label: 'Giám sát',
      items: [
        { label: 'Nhật ký hoạt động', href: '/audit-logs', icon: FileSpreadsheet, permission: 'audit.view' as string | string[] | null },
        { label: 'Lịch sử đăng nhập', href: '/login-history', icon: Clock, permission: 'login_history.view' as string | string[] | null },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        { label: 'Cấu hình hệ thống', href: '/settings', icon: Settings, permission: 'setting.view' as string | string[] | null },
        { label: 'Cấu hình AI & Ngân sách', href: '/settings/ai', icon: Sparkles, permission: 'ai.view' as string | string[] | null },
      ],
    },
    {
      label: 'Công cụ',
      items: [
        { label: 'Thư viện giao diện', href: '/ui-sandbox', icon: Palette, permission: null as string | string[] | null },
      ],
    },
  ]

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.permission === null) return true
        if (Array.isArray(item.permission)) {
          return item.permission.some((p) => hasPermission(p))
        }
        return hasPermission(item.permission)
      }),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="flex h-full flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold text-lg">A</span>
          </div>
          <span className="text-xl tracking-tight">
            Antigravity <span className="text-xs text-muted-foreground font-mono">v1</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {filteredSections.map((section, idx) => (
          <div key={section.label}>
            {idx > 0 && <div className="mb-3 border-t border-border/60" />}
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary/95 hover:text-primary-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted border">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">{user?.username || 'Administrator'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  // State điều khiển các phím tắt & thanh lệnh nhanh
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Khai báo các phím tắt toàn hệ thống
  const modKey = getModifierKey()
  const altKey = getAltKey()

  // 1. Phím tắt mở/đóng Command Palette (Cmd+K hoặc Ctrl+K)
  useHotkeys('mod+k', () => setIsCommandPaletteOpen((prev) => !prev))

  // 2. Phím tắt ẩn/hiện Sidebar (Cmd+B hoặc Ctrl+B)
  useHotkeys('mod+b', () => setIsSidebarCollapsed((prev) => !prev))

  // 3. Phím tắt mở bảng trợ giúp phím tắt (? hoặc Cmd+/)
  useHotkeys('shift+?', () => setIsHelpOpen((prev) => !prev))
  useHotkeys('mod+/', () => setIsHelpOpen((prev) => !prev))

  // 4. Phím tắt chuyển đổi Theme (Alt+T)
  useHotkeys('alt+t', () => setTheme(theme === 'light' ? 'dark' : 'light'))

  // 5. Phím tắt điều hướng nhanh (Alt+D, Alt+U, Alt+R, Alt+L)
  useHotkeys('alt+d', () => navigate('/dashboard'))
  useHotkeys('alt+u', () => navigate('/users'))
  useHotkeys('alt+r', () => navigate('/roles'))
  useHotkeys('alt+l', () => navigate('/audit-logs'))

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar trên Desktop có hỗ trợ co giãn mượt mà */}
      <aside
        className={cn(
          'hidden md:block flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-r bg-card',
          isSidebarCollapsed ? 'w-0 border-r-0' : 'w-64'
        )}
      >
        <div className="w-64 h-full">
          <SidebarContent user={user} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen} direction="left">
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Mở menu điều hướng</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-0 w-64 h-full">
                <SidebarContent user={user} onClose={() => setMobileOpen(false)} />
              </DrawerContent>
            </Drawer>

            <h1 className="text-sm font-medium text-muted-foreground hidden lg:block">
              Hệ thống Quản trị Nội dung (CMS)
            </h1>

            {/* Nút tìm kiếm nhanh / Command Palette Trigger (Vercel Style) */}
            <Button
              variant="outline"
              className="relative w-40 justify-start text-xs text-muted-foreground sm:w-60 sm:pr-12 bg-muted/20 hover:bg-muted/40 border-border/80 rounded-lg cursor-pointer h-9"
              onClick={() => setIsCommandPaletteOpen(true)}
              title={`Tìm kiếm nhanh (${modKey}K)`}
            >
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-70" />
              <span className="inline-flex">Tìm kiếm nhanh...</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100 sm:flex">
                <span>{modKey}</span>K
              </kbd>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Nút chuyển theme sáng tối */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={`Chuyển đổi giao diện sáng / tối (${altKey}T)`}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Chuyển giao diện</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Thông báo</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 px-2 hover:bg-muted py-1 h-auto rounded-lg">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate">
                    {user?.username || 'Admin'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cấu hình hệ thống</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsHelpOpen(true)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Trợ giúp phím tắt</span>
                  <DropdownMenuShortcut>?</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                  <DropdownMenuShortcut>{altKey}L</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background/50">
          <Outlet />
        </main>
      </div>

      {/* Component Command Palette hỗ trợ bàn phím */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onLogout={handleLogout}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Component Dialog hướng dẫn phím tắt */}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  )
}

