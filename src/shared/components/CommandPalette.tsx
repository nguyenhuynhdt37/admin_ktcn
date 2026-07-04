import { useState, useEffect, useRef, useCallback } from 'react'
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
  FolderTree,
  Tags,
  Image,
  GraduationCap,
  Building2,
  Briefcase,
  Menu as MenuIcon,
  Languages,
  Bot,
  Database,
  ClipboardList,
  UserCircle,
  SunMoon,
  LogOut,
  HelpCircle,
  ChevronRight,
  Loader2,
  FileEdit,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { httpClient } from '@/services/http/client'
import logoDhVinh from '@/assets/logo-dhvinh.png'

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
  category: 'search-articles' | 'search-users' | 'search-categories' | 'search-tags' | 'search-staff' | 'pages' | 'actions'
  action: () => void
  shortcut?: string[]
}

// Kết quả tìm kiếm từ API
interface SearchResults {
  articles: { id: string; title: string; slug: string; status: string; category_name: string | null; published_at: string | null }[]
  users: { id: string; full_name: string; email: string; username: string }[]
  categories: { id: string; name: string; slug: string }[]
  tags: { id: string; name: string; slug: string }[]
  staff: { id: string; full_name: string; email: string; slug: string }[]
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
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const modKey = getModifierKey()
  const altKey = getAltKey()

  // Helper để navigate và đóng palette
  const go = useCallback((path: string) => {
    navigate(path)
    onClose()
  }, [navigate, onClose])

  // Danh sách tất cả trang trong hệ thống
  const pageCommands: CommandItem[] = [
    {
      id: 'dashboard', title: 'Tổng quan (Dashboard)', subtitle: 'Biểu đồ và báo cáo hệ thống',
      icon: LayoutDashboard, category: 'pages', action: () => go('/dashboard'), shortcut: [altKey, 'D'],
    },
    {
      id: 'articles', title: 'Quản lý bài viết', subtitle: 'Danh sách bài viết tin tức',
      icon: FileText, category: 'pages', action: () => go('/articles'),
    },
    {
      id: 'drafts', title: 'Bản nháp bài viết', subtitle: 'Bài viết đang soạn thảo',
      icon: FileEdit, category: 'pages', action: () => go('/articles/drafts'),
    },
    {
      id: 'categories', title: 'Quản lý danh mục', subtitle: 'Phân loại bài viết',
      icon: FolderTree, category: 'pages', action: () => go('/categories'),
    },
    {
      id: 'tags', title: 'Quản lý thẻ (Tags)', subtitle: 'Gán nhãn cho bài viết',
      icon: Tags, category: 'pages', action: () => go('/tags'),
    },
    {
      id: 'banners', title: 'Quản lý Banner', subtitle: 'Hình ảnh quảng cáo, slider',
      icon: Image, category: 'pages', action: () => go('/banners'),
    },
    {
      id: 'teachers', title: 'Quản lý nhân sự', subtitle: 'Giảng viên và cán bộ',
      icon: GraduationCap, category: 'pages', action: () => go('/teachers'),
    },
    {
      id: 'departments', title: 'Quản lý phòng ban', subtitle: 'Cơ cấu tổ chức',
      icon: Building2, category: 'pages', action: () => go('/departments'),
    },
    {
      id: 'positions', title: 'Quản lý chức vụ', subtitle: 'Danh sách chức vụ',
      icon: Briefcase, category: 'pages', action: () => go('/positions'),
    },
    {
      id: 'users', title: 'Quản lý thành viên', subtitle: 'Tài khoản và phân quyền',
      icon: Users, category: 'pages', action: () => go('/users'), shortcut: [altKey, 'U'],
    },
    {
      id: 'menus', title: 'Quản lý Menu', subtitle: 'Menu điều hướng website',
      icon: MenuIcon, category: 'pages', action: () => go('/menus'),
    },
    {
      id: 'languages', title: 'Quản lý ngôn ngữ', subtitle: 'Đa ngôn ngữ hệ thống',
      icon: Languages, category: 'pages', action: () => go('/languages'),
    },
    {
      id: 'ai-hub', title: 'AI Hub', subtitle: 'Cài đặt trợ lý AI',
      icon: Bot, category: 'pages', action: () => go('/languages/ai-hub'),
    },
    {
      id: 'embedding', title: 'Cài đặt Embedding', subtitle: 'Vector embedding cho AI',
      icon: Database, category: 'pages', action: () => go('/languages/embedding'),
    },
    {
      id: 'audit-logs', title: 'Nhật ký hệ thống', subtitle: 'Lịch sử thao tác quản trị',
      icon: ClipboardList, category: 'pages', action: () => go('/audit-logs'), shortcut: [altKey, 'L'],
    },
    {
      id: 'profile', title: 'Hồ sơ cá nhân', subtitle: 'Thông tin tài khoản của bạn',
      icon: UserCircle, category: 'pages', action: () => go('/profile'),
    },
  ]

  // Hành động nhanh
  const actionCommands: CommandItem[] = [
    {
      id: 'toggle-theme', title: 'Chuyển đổi giao diện Sáng / Tối', subtitle: 'Thay đổi theme hệ thống',
      icon: SunMoon, category: 'actions', action: () => { onToggleTheme(); onClose() }, shortcut: [altKey, 'T'],
    },
    {
      id: 'keyboard-help', title: 'Xem danh sách phím tắt', subtitle: 'Mở bảng trợ giúp phím tắt nhanh',
      icon: HelpCircle, category: 'actions',
      action: () => { onClose(); setTimeout(() => onOpenHelp(), 100) }, shortcut: ['?'],
    },
    {
      id: 'logout', title: 'Đăng xuất khỏi hệ thống', subtitle: 'Kết thúc phiên làm việc hiện tại',
      icon: LogOut, category: 'actions', action: () => { onLogout(); onClose() },
    },
  ]

  // Chuyển kết quả search API thành CommandItem
  const buildSearchCommands = (): CommandItem[] => {
    if (!searchResults) return []
    const items: CommandItem[] = []

    for (const a of searchResults.articles) {
      const statusLabel = a.status === 'published' ? 'Đã đăng' : a.status === 'draft' ? 'Bản nháp' : a.status === 'archived' ? 'Lưu trữ' : a.status
      const parts: string[] = []
      if (a.category_name) parts.push(a.category_name)
      parts.push(statusLabel)
      // Thêm slug rút gọn nếu title trùng nhau
      const shortSlug = a.slug.length > 30 ? a.slug.substring(0, 30) + '…' : a.slug
      parts.push(`/${shortSlug}`)
      items.push({
        id: `article-${a.id}`, title: a.title,
        subtitle: parts.join(' · '),
        icon: FileText, category: 'search-articles',
        action: () => go(`/articles/${a.id}/edit`),
      })
    }
    for (const u of searchResults.users) {
      items.push({
        id: `user-${u.id}`, title: u.full_name, subtitle: u.email,
        icon: Users, category: 'search-users',
        action: () => go(`/users/${u.id}/edit`),
      })
    }
    for (const c of searchResults.categories) {
      items.push({
        id: `cat-${c.id}`, title: c.name, subtitle: 'Danh mục',
        icon: FolderTree, category: 'search-categories',
        action: () => go('/categories'),
      })
    }
    for (const t of searchResults.tags) {
      items.push({
        id: `tag-${t.id}`, title: t.name, subtitle: 'Thẻ',
        icon: Tags, category: 'search-tags',
        action: () => go('/tags'),
      })
    }
    for (const s of searchResults.staff) {
      items.push({
        id: `staff-${s.id}`, title: s.full_name, subtitle: s.email || 'Nhân sự',
        icon: GraduationCap, category: 'search-staff',
        action: () => go(`/teachers/${s.id}/edit`),
      })
    }
    return items
  }

  // Gọi API tìm kiếm (debounce 300ms)
  const performSearch = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const { data } = await httpClient.get<SearchResults>('/admin/search', { params: { q: keyword, limit: 5 } })
      setSearchResults(data)
    } catch {
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.trim().length >= 2) {
      setIsSearching(true)
      debounceRef.current = setTimeout(() => performSearch(search.trim()), 300)
    } else {
      setSearchResults(null)
      setIsSearching(false)
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, performSearch])

  // Xây dựng danh sách command
  const searchCommands = buildSearchCommands()
  const hasSearchQuery = search.trim().length >= 2

  // Filter pages/actions theo text
  const filteredPages = pageCommands.filter((cmd) => {
    const s = `${cmd.title} ${cmd.subtitle || ''}`.toLowerCase()
    return s.includes(search.toLowerCase())
  })
  const filteredActions = actionCommands.filter((cmd) => {
    const s = `${cmd.title} ${cmd.subtitle || ''}`.toLowerCase()
    return s.includes(search.toLowerCase())
  })

  // Gộp tất cả commands: search results trước, rồi pages, rồi actions
  const allCommands = hasSearchQuery
    ? [...searchCommands, ...filteredPages, ...filteredActions]
    : [...filteredPages, ...filteredActions]

  // Categories cho UI
  const searchCategories = [
    { id: 'search-articles', name: '📄 Bài viết' },
    { id: 'search-users', name: '👤 Thành viên' },
    { id: 'search-categories', name: '📂 Danh mục' },
    { id: 'search-tags', name: '🏷️ Thẻ' },
    { id: 'search-staff', name: '👨‍🏫 Nhân sự' },
  ]

  const displayCategories = hasSearchQuery
    ? [
        ...searchCategories,
        { id: 'pages', name: 'Trang quản trị' },
        { id: 'actions', name: 'Thao tác nhanh' },
      ]
    : [
        { id: 'pages', name: 'Trang quản trị & Điều hướng' },
        { id: 'actions', name: 'Thao tác nhanh' },
      ]

  // Reset khi search thay đổi
  useEffect(() => { setSelectedIndex(0) }, [search])

  // Focus input khi mở
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setSearchResults(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || allCommands.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % allCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + allCommands.length) % allCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        allCommands[selectedIndex]?.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allCommands, selectedIndex])

  // Auto-scroll active item
  useEffect(() => {
    if (!listRef.current) return
    const activeItem = listRef.current.querySelector('[data-active="true"]') as HTMLElement
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const totalSearchResults = searchCommands.length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 border-border bg-background/80 backdrop-blur-lg shadow-2xl transition-all duration-300">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <img src={logoDhVinh} alt="Đại học Vinh Logo" className="h-6 w-6 object-contain" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold tracking-tight text-foreground leading-tight">
                ĐẠI HỌC VINH
              </span>
              <span className="text-[8px] text-muted-foreground font-mono leading-none">
                CMS Search Portal
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-card px-2 py-0.5 rounded border border-border/40">
            Hộp lệnh nhanh
          </span>
        </div>

        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3.5">
          <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Tìm kiếm bài viết, thành viên, danh mục, hoặc gõ lệnh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
              <span>ESC</span>
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
          {allCommands.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
              <p className="text-sm">Không tìm thấy kết quả phù hợp</p>
            </div>
          ) : (
            displayCategories.map((cat) => {
              const catCommands = allCommands.filter((cmd) => cmd.category === cat.id)
              if (catCommands.length === 0) return null

              return (
                <div key={cat.id} className="mb-3 last:mb-0">
                  <h4 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                    {cat.name}
                  </h4>
                  <div className="space-y-0.5 mt-1">
                    {catCommands.map((cmd) => {
                      const globalIndex = allCommands.findIndex((c) => c.id === cmd.id)
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
                          <div className="flex items-center gap-3 min-w-0">
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
                            <div className="overflow-hidden min-w-0">
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

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Dùng phím <kbd className="font-mono bg-card border px-1 rounded">↑↓</kbd> để di chuyển</span>
            <span><kbd className="font-mono bg-card border px-1 rounded">Enter</kbd> để thực thi</span>
          </div>
          <div>
            {hasSearchQuery && totalSearchResults > 0 ? (
              <span>{totalSearchResults} kết quả tìm kiếm</span>
            ) : (
              <span>{pageCommands.length} trang · {actionCommands.length} hành động</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
