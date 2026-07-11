import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuthStore, type User as AuthUser } from '@/stores/authStore'
import { useTheme } from '@/app/providers/ThemeProvider'
import { httpClient } from '@/services/http/client'
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
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  FileText,
  FolderOpen,
  Layers,
  FileSpreadsheet,
  Search,
  HelpCircle,
  Building,
  Award,
  Briefcase,
  GraduationCap,
  Image,
  Languages,
  BrainCircuit,
  Fingerprint,
  Tag,
  MessageSquareText,
  BookOpen,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import logoDhVinh from '@/assets/logo-dhvinh.png'
import { getMediaUrl } from '@/features/articles/utils/media'

// Imports cho phím tắt và Command Palette
import { useHotkeys } from '@/shared/hooks/useHotkeys'
import { CommandPalette } from '@/shared/components/CommandPalette'
import { KeyboardShortcutsHelp } from '@/shared/components/KeyboardShortcutsHelp'
import { getModifierKey, getAltKey } from '@/shared/utils/os'
import { AdminNotificationBell } from '@/features/notifications/components/AdminNotificationBell'

interface NavItem {
  label: string
  href?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>
  permission?: string | string[] | null
  children?: {
    label: string
    href: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: React.ComponentType<any>
  }[]
}

interface NavSeparator {
  type: 'separator'
}

interface SidebarNavItemProps {
  item: NavItem
  onClose?: () => void
}

function SidebarNavItem({ item, onClose }: SidebarNavItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    return (
      <NavLink
        to={item.href!}
        end
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
    )
  }

  return (
    <div>
      {/* Parent toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer bg-transparent border-none outline-hidden"
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-4.5 w-4.5" />
          <span>{item.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200 opacity-60",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Sub-items */}
      {isOpen && (
        <div className="mt-0.5 mx-2 mb-1">
          <div className="relative pl-3 border-l border-border/50">
            {item.children?.map((child) => (
              <NavLink
                key={child.href}
                to={child.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2 rounded-md py-1.5 px-2.5 text-[13px] transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground font-medium hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active dot indicator */}
                    <span
                      className={cn(
                        'shrink-0 rounded-full transition-all duration-150',
                        isActive
                          ? 'w-1.5 h-1.5 bg-primary'
                          : 'w-1 h-1 bg-muted-foreground/30 group-hover:bg-muted-foreground/60'
                      )}
                    />
                    <span className="truncate">{child.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SidebarContentProps {
  user: AuthUser | null
  onClose?: () => void
}

function SidebarContent({ user, onClose }: SidebarContentProps) {
  // Flat list of navigation items with separator flags
  const navItems: (NavItem | NavSeparator)[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'menu.dashboard' },
    { type: 'separator' },
    { label: 'Bài viết', href: '/articles', icon: FileText, permission: 'menu.article' },
    { label: 'Tư vấn tuyển sinh', href: '/consultations', icon: MessageSquareText, permission: null },
    { label: 'Danh mục', href: '/categories', icon: FolderOpen, permission: 'menu.category' },
    { label: 'Thẻ (Tag)', href: '/tags', icon: Tag, permission: null },
    { label: 'Banner quảng cáo', href: '/banners', icon: Image, permission: null },
    { label: 'Menu điều hướng', href: '/menus', icon: Menu, permission: 'menu.menu' },
    { label: 'Ngôn ngữ', href: '/languages', icon: Languages, permission: null },

    { label: 'AI Management Hub', href: '/languages/ai-hub', icon: BrainCircuit, permission: null },
    { label: 'Cấu hình Embedding', href: '/languages/embedding', icon: Fingerprint, permission: null },
    { type: 'separator' },
    { label: 'Thành viên', href: '/users', icon: Users, permission: null },
    {
      label: 'Đơn vị',
      icon: Building,
      permission: null,
      children: [
        { label: 'Bộ môn', href: '/departments', icon: Award },
        { label: 'Đào tạo & hình ảnh', href: '/academic-content', icon: BookOpen },
        { label: 'Chức vụ', href: '/positions', icon: Briefcase },
        { label: 'Giảng viên', href: '/teachers', icon: GraduationCap },
      ]
    },
    { label: 'Tính năng hệ thống', href: '/features', icon: Layers, permission: null },
    { type: 'separator' },
    { label: 'Nhật ký hoạt động', href: '/audit-logs', icon: FileSpreadsheet, permission: 'menu.audit' },
  ]

  return (
    <div className="flex h-full flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2.5 font-semibold">
          <img src={logoDhVinh} alt="Đại học Vinh Logo" className="h-9 w-9 object-contain" />
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold tracking-tight text-foreground leading-tight">
              ĐẠI HỌC VINH
            </span>
            <span className="text-[9px] text-muted-foreground font-mono mt-0.5 leading-none">
              CMS Portal
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {navItems.map((item, idx) => {
          if ('type' in item && item.type === 'separator') {
            return <div key={idx} className="my-2 border-t border-border/40 mx-2" />
          }
          const navItem = item as NavItem
          return <SidebarNavItem key={navItem.label} item={navItem} onClose={onClose} />
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted border overflow-hidden shrink-0">
            {user?.avatar_url ? (
              <img src={getMediaUrl(user.avatar_url)} alt={user.full_name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="truncate text-sm font-medium text-foreground">{user?.full_name || user?.username || 'Administrator'}</p>
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

  const handleLogout = async () => {
    try {
      await httpClient.post('/auth/logout')
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      logout()
      navigate('/login')
    }
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

            <AdminNotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 px-2 hover:bg-muted py-1 h-auto rounded-lg">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border overflow-hidden shrink-0">
                    {user?.avatar_url ? (
                      <img src={getMediaUrl(user.avatar_url)} alt={user.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate">
                    {user?.full_name || user?.username || 'Admin'}
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

