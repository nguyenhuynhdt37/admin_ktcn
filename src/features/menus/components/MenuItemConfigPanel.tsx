/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Save, Link as LinkIcon, Eye, EyeOff, Smile, Loader2, Check, ChevronsUpDown, Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { menusService } from '../services/menusService'
import { articleService } from '@/features/articles/services/articleService'
import { departmentService } from '@/features/departments/services/departmentService'
import { CategoryTreeSelect } from './CategoryTreeSelect'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { MenuItemPayload } from '../types'
import { useAuth } from '@/app/providers/AuthProvider'

// Helper chuyển đổi tên icon sang PascalCase để khớp thư viện Lucide
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Component vẽ icon Lucide động
export function LucideIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  if (!name) return null
  const pascalName = toPascalCase(name)
  const IconComponent = (LucideIcons as any)[pascalName]
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}

interface MenuItemConfigPanelProps {
  menuId: string
  itemId: string
  onClose: () => void
  refetchTree: () => void
}

// 1. Component Wrapper: Quản lý loading/error query từ API
export function MenuItemConfigPanel({
  menuId,
  itemId,
  onClose,
  refetchTree,
}: MenuItemConfigPanelProps) {
  // Query lấy thông tin chi tiết của menu item
  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['menu-item', menuId, itemId],
    queryFn: () => menusService.getItem(menuId, itemId),
    enabled: !!itemId,
  })

  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 bg-card rounded-xl border border-border p-4 shadow-xs">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Đang tải cấu hình...</span>
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className="p-4 text-center text-sm text-destructive bg-card rounded-xl border border-border shadow-xs">
        Không thể tải thông tin mục menu. Vui lòng thử lại.
      </div>
    )
  }

  // Chỉ render Form cấu hình khi dữ liệu item đã tải xong!
  // Gán key={item.id} để ép React mount mới hoàn toàn form và reset state sạch sẽ khi đổi menu item.
  return (
    <MenuItemConfigForm
      key={item.id}
      menuId={menuId}
      itemId={itemId}
      item={item}
      onClose={onClose}
      refetchTree={refetchTree}
    />
  )
}

// 2. Component Form chính: Khởi tạo state đồng bộ trực tiếp từ prop `item` đã sẵn sàng
function MenuItemConfigForm({
  menuId,
  itemId,
  item,
  onClose,
  refetchTree,
}: {
  menuId: string
  itemId: string
  item: any
  onClose: () => void
  refetchTree: () => void
}) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('menu.update')
  const queryClient = useQueryClient()

  // Query lấy danh sách icons cấu hình từ Backend
  const { data: iconCategories } = useQuery({
    queryKey: ['menu-config-icons'],
    queryFn: menusService.getCuratedIcons,
  })

  // Khởi tạo state đồng bộ đồng thời 100% từ prop `item`
  const [title, setTitle] = useState(item.title || '')
  const [targetType, setTargetType] = useState<string>(item.target_type || 'NONE')
  const [targetId, setTargetId] = useState(item.target_id || '')
  const [externalUrl, setExternalUrl] = useState(item.external_url || '')
  const [icon, setIcon] = useState(item.icon || '')
  const [openInNewTab, setOpenInNewTab] = useState(item.open_in_new_tab || false)
  const [isVisible, setIsVisible] = useState(item.is_visible !== false)
  
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // State tìm kiếm bài viết khởi tạo từ tên bài viết hiện tại (nếu là bài viết)
  const [articleSearch, setArticleSearch] = useState(() => 
    item.target_type === 'ARTICLE' && item.target_info ? item.target_info.name || '' : ''
  )
  const debouncedArticleSearch = useDebounce(articleSearch, 400)

  // Queries danh sách bài viết & bộ môn
  const { data: articlesData, isLoading: isLoadingArticles } = useQuery({
    queryKey: ['menus-search-articles', debouncedArticleSearch],
    queryFn: () => articleService.list({
      status: 'PUBLISHED',
      is_draft: false,
      page: 1,
      page_size: 100,
      search: debouncedArticleSearch || undefined
    }),
    enabled: targetType === 'ARTICLE',
  })

  const { data: departmentsData } = useQuery({
    queryKey: ['menus-active-departments'],
    queryFn: () => departmentService.list({
      is_active: true,
      page: 1,
      page_size: 1000
    }),
    enabled: targetType === 'DEPARTMENT',
  })

  // Xử lý options fallback gộp phần tử hiện tại vào đầu danh sách
  const articlesList = useMemo(() => {
    const list = [...(articlesData?.items || [])]
    if (item && item.target_type === 'ARTICLE' && item.target_id && item.target_info) {
      const hasCurrent = list.some((art) => art.id === item.target_id)
      if (!hasCurrent) {
        list.unshift({
          id: item.target_id,
          title: item.target_info.name,
          category: { name: (item.target_info as any).category_name || 'Bài viết' },
          created_at: (item.target_info as any).created_at || null,
          author: { full_name: (item.target_info as any).author_name || 'Hệ thống' }
        } as any)
      }
    }
    return list
  }, [articlesData, item])

  const departmentsList = useMemo(() => {
    const list = [...(departmentsData?.items || [])]
    if (item && item.target_type === 'DEPARTMENT' && item.target_id && item.target_info) {
      const hasCurrent = list.some((dept) => dept.id === item.target_id)
      if (!hasCurrent) {
        list.unshift({
          id: item.target_id,
          name: item.target_info.name,
          code: (item.target_info as any).code || ''
        } as any)
      }
    }
    return list
  }, [departmentsData, item])

  // Biểu tượng mở rộng client-side
  const EXTENDED_ICONS = [
    { name: 'Trang chủ / Home', code: 'home' },
    { name: 'Thành viên / User', code: 'user' },
    { name: 'Cấu hình / Settings', code: 'settings' },
    { name: 'Liên hệ / Phone', code: 'phone' },
    { name: 'Thư mục / Folder', code: 'folder' },
    { name: 'Tệp tin / File', code: 'file' },
    { name: 'Hình ảnh / Image', code: 'image' },
    { name: 'Tìm kiếm / Search', code: 'search' },
    { name: 'Ngôi sao / Star', code: 'star' },
    { name: 'Trái tim / Heart', code: 'heart' },
    { name: 'Cảnh báo / Bell', code: 'bell' },
    { name: 'Bảo mật / Lock', code: 'lock' },
    { name: 'Bảo vệ / Shield', code: 'shield' },
    { name: 'Đám mây / Cloud', code: 'cloud' },
    { name: 'Cơ sở dữ liệu / Database', code: 'database' },
    { name: 'Máy chủ / Server', code: 'server' },
    { name: 'Mã code / Code', code: 'code' },
    { name: 'Thiết bị / Laptop', code: 'laptop' },
    { name: 'Kết nối / Link', code: 'link' },
    { name: 'Tải xuống / Download', code: 'download' },
    { name: 'Tải lên / Upload', code: 'upload' },
    { name: 'Chia sẻ / Share', code: 'share-2' },
    { name: 'Giỏ hàng / Cart', code: 'shopping-cart' },
    { name: 'Thẻ tag / Tag', code: 'tag' },
    { name: 'Bộ lọc / Filter', code: 'filter' },
    { name: 'Thời tiết / Sun', code: 'sun' },
    { name: 'Ban đêm / Moon', code: 'moon' },
    { name: 'Âm nhạc / Music', code: 'music' },
    { name: 'Video / Film', code: 'film' },
    { name: 'Địa cầu / Globe', code: 'globe' },
    { name: 'Mũi tên / Arrow Right', code: 'arrow-right' },
    { name: 'Danh sách / List', code: 'list' },
    { name: 'Bảng biểu / Table', code: 'table' },
    { name: 'Đồ thị / Activity', code: 'activity' },
    { name: 'Ví tiền / Wallet', code: 'wallet' },
    { name: 'Cúp / Trophy', code: 'trophy' },
    { name: 'Mục tiêu / Target', code: 'target' },
    { name: 'Chìa khóa / Key', code: 'key' },
    { name: 'Bóng đèn / Lightbulb', code: 'lightbulb' },
  ]

  const allCategories = [
    ...(iconCategories || []),
    {
      category: 'Biểu tượng phổ biến khác',
      icons: EXTENDED_ICONS,
    },
  ]

  const filteredCategories = allCategories
    .map((cat) => {
      const filteredIcons = cat.icons.filter(
        (ico) =>
          ico.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ico.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return {
        ...cat,
        icons: filteredIcons,
      }
    })
    .filter((cat) => cat.icons.length > 0)

  // Mutation cập nhật cấu hình item
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<MenuItemPayload>) =>
      menusService.updateItem(menuId, itemId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật cấu hình mục menu thành công!')
      queryClient.invalidateQueries({ queryKey: ['menu-item', menuId, itemId] })
      refetchTree()
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error_code
      const errorMap: Record<string, string> = {
        TARGET_CATEGORY_NOT_FOUND: 'Danh mục được chọn không tồn tại.',
        TARGET_CATEGORY_DELETED: 'Danh mục đã bị xóa. Vui lòng chọn danh mục khác.',
        TARGET_CATEGORY_NOT_ACTIVE: 'Chỉ cho phép liên kết với danh mục đang hoạt động (ACTIVE).',
        TARGET_DEPARTMENT_NOT_FOUND: 'Bộ môn được chọn không tồn tại.',
        TARGET_DEPARTMENT_NOT_ACTIVE: 'Chỉ liên kết với bộ môn đang hoạt động.',
        TARGET_ARTICLE_NOT_FOUND: 'Bài viết được chọn không tồn tại hoặc chưa xuất bản.',
      }
      toast.error(errorMap[errorCode] || 'Không thể cập nhật cấu hình.')
    },
  })

  // Xử lý lưu
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canUpdate) {
      toast.error('Bạn không có quyền cập nhật menu.')
      return
    }
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề mục menu.')
      return
    }

    const payload: Partial<MenuItemPayload> = {
      title: title.trim(),
      target_type: targetType === 'NONE' ? null : (targetType as any),
      target_id: ['CATEGORY', 'ARTICLE', 'MODULE', 'DEPARTMENT'].includes(targetType) ? targetId.trim() || null : null,
      external_url: targetType === 'EXTERNAL_LINK' ? externalUrl.trim() || null : null,
      open_in_new_tab: openInNewTab,
      icon: icon.trim() || null,
      is_visible: isVisible,
    }

    updateMutation.mutate(payload)
  }

  return (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border shadow-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">Cấu hình mục</h3>
          <p className="text-muted-foreground text-xs truncate">{item.title}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 cursor-pointer rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form cấu hình */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tiêu đề */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold text-foreground/80">
            Tiêu đề hiển thị <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canUpdate}
            placeholder="VD: Giới thiệu"
            className="font-medium bg-background border-border/80"
          />
        </div>

        {/* Loại liên kết */}
        <div className="space-y-1.5">
          <Label htmlFor="targetType" className="text-xs font-semibold text-foreground/80">
            Loại liên kết
          </Label>
          <Select
            value={targetType}
            disabled={!canUpdate}
            onValueChange={(val) => {
              setTargetType(val)
              setTargetId('')
              setExternalUrl('')
            }}
          >
            <SelectTrigger id="targetType" className="h-9 text-sm">
              <SelectValue placeholder="Chọn loại liên kết" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Nhãn nhóm (Không liên kết)</SelectItem>
              <SelectItem value="EXTERNAL_LINK">Liên kết ngoài (URL)</SelectItem>
              <SelectItem value="CATEGORY">Danh mục bài viết</SelectItem>
              <SelectItem value="ARTICLE">Bài viết chi tiết</SelectItem>
              <SelectItem value="DEPARTMENT">Bộ môn giảng viên</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hiển thị input tương ứng với loại liên kết */}
        {targetType === 'EXTERNAL_LINK' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label htmlFor="externalUrl" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
              Đường dẫn liên kết (URL)
            </Label>
            <Input
              id="externalUrl"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/chuyen-muc-khac"
              disabled={!canUpdate}
              className="bg-background font-mono text-[13px] text-blue-600 dark:text-blue-400"
            />
          </div>
        )}

        {targetType === 'CATEGORY' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label className="text-xs font-semibold text-foreground/80">
              Chọn danh mục bài viết <span className="text-destructive">*</span>
            </Label>
            <CategoryTreeSelect
              value={targetId || null}
              onChange={(id) => setTargetId(id)}
              disabled={!canUpdate}
            />
          </div>
        )}

        {targetType === 'ARTICLE' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label className="text-xs font-semibold text-foreground/80">
              Chọn bài viết liên kết <span className="text-destructive">*</span>
            </Label>
            <ArticleSelect
              value={targetId}
              onValueChange={setTargetId}
              articlesList={articlesList}
              searchTerm={articleSearch}
              onSearchChange={setArticleSearch}
              isLoading={isLoadingArticles}
              disabled={!canUpdate}
            />
          </div>
        )}

        {targetType === 'DEPARTMENT' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label htmlFor="targetId" className="text-xs font-semibold text-foreground/80">
              Chọn bộ môn liên kết <span className="text-destructive">*</span>
            </Label>
            <DepartmentSelect
              value={targetId}
              onValueChange={setTargetId}
              departmentsList={departmentsList}
              disabled={!canUpdate}
            />
          </div>
        )}

        {/* Icon Picker Popover */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">
            Icon hiển thị
          </Label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-10 justify-between px-3 text-sm font-normal cursor-pointer bg-background hover:bg-muted"
                disabled={!canUpdate}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted border border-dashed text-muted-foreground">
                    {icon && icon !== 'NONE_ICON' ? (
                      <LucideIcon name={icon} size={15} />
                    ) : (
                      <Smile className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span>
                    {icon && icon !== 'NONE_ICON' ? icon : 'Không hiển thị Icon'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Thay đổi</div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 z-50" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-xs font-semibold text-foreground">Chọn biểu tượng</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => {
                      setIcon('')
                      setPopoverOpen(false)
                      setSearchTerm('')
                    }}
                  >
                    Gỡ bỏ
                  </Button>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="relative">
                  <Input
                    placeholder="Tìm kiếm biểu tượng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 text-xs pr-7 bg-muted/30"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3.5 pr-1">
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Không tìm thấy biểu tượng nào.
                    </div>
                  ) : (
                    filteredCategories.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {cat.category}
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {cat.icons.map((ico) => (
                            <Button
                              key={ico.code}
                              type="button"
                              variant={icon === ico.code ? 'default' : 'outline'}
                              className="h-10 w-10 p-0 flex items-center justify-center cursor-pointer transition-all hover:border-primary"
                              onClick={() => {
                                setIcon(ico.code)
                                setPopoverOpen(false)
                                setSearchTerm('') // Reset tìm kiếm sau khi chọn
                              }}
                              title={ico.name}
                            >
                              <LucideIcon name={ico.code} size={18} />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="h-px bg-border my-2" />

        {/* Switch toggles */}
        <div className="space-y-3 pt-1">
          {/* Mở tab mới */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="openInNewTab" className="text-xs font-semibold text-foreground/80">
                Mở trong tab mới
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Thêm thuộc tính target="_blank"
              </p>
            </div>
            <Switch
              id="openInNewTab"
              checked={openInNewTab}
              disabled={!canUpdate}
              onCheckedChange={setOpenInNewTab}
              className="cursor-pointer scale-75"
            />
          </div>

          {/* Hiển thị / Ẩn */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isVisible" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                {isVisible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                Trạng thái hiển thị
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Cho phép hiển thị trên giao diện người dùng
              </p>
            </div>
            <Switch
              id="isVisible"
              checked={isVisible}
              disabled={!canUpdate}
              onCheckedChange={setIsVisible}
              className="cursor-pointer scale-75"
            />
          </div>
        </div>
      </form>

      {/* Footer Panel */}
      <div className="border-t p-4 bg-muted/20 rounded-b-xl flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="cursor-pointer"
        >
          Hủy bỏ
        </Button>
        {canUpdate && (
          <Button
            type="submit"
            size="sm"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="cursor-pointer shadow-sm flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        )}
      </div>
    </div>
  )
}

// Component Select bài viết có ô tìm kiếm hợp nhất và hiển thị nhiều thông tin chi tiết
interface ArticleSelectProps {
  value: string
  onValueChange: (value: string) => void
  articlesList: any[]
  searchTerm: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  disabled: boolean
}

export function ArticleSelect({
  value,
  onValueChange,
  articlesList,
  searchTerm,
  onSearchChange,
  isLoading,
  disabled
}: ArticleSelectProps) {
  const [open, setOpen] = useState(false)

  // Tìm bài viết đang chọn trong danh sách hiển thị
  const selectedArticle = useMemo(() => {
    return articlesList.find((art) => art.id === value)
  }, [articlesList, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-xs h-10 font-normal bg-background px-3 hover:bg-background/80 focus:ring-1 focus:ring-primary/20 cursor-pointer"
        >
          <span className="truncate flex-1 text-left font-medium text-slate-700 dark:text-slate-300">
            {selectedArticle ? selectedArticle.title : 'Chọn bài viết liên kết...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50" align="start">
        <div className="flex flex-col max-h-[340px] overflow-hidden bg-popover text-popover-foreground rounded-lg border shadow-lg">
          {/* Hộp Tìm kiếm hợp nhất */}
          <div className="flex items-center border-b px-3 py-2.5 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              placeholder="Nhập từ khóa tìm bài viết..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-xs outline-none border-none py-0.5 placeholder:text-muted-foreground/70"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
            )}
          </div>

          {/* Danh sách bài viết chi tiết */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {articlesList.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {isLoading ? 'Đang tìm kiếm bài viết...' : 'Không tìm thấy bài viết nào.'}
              </div>
            ) : (
              articlesList.map((art) => {
                const isSelected = art.id === value
                
                // Định dạng ngày tạo hiển thị
                let dateStr = ''
                if (art.created_at) {
                  try {
                    dateStr = new Date(art.created_at).toLocaleDateString('vi-VN')
                  } catch {
                    // ignore
                  }
                }

                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      onValueChange(art.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full text-left p-2.5 rounded-md transition-colors text-xs flex flex-col gap-1.5 cursor-pointer border border-transparent",
                      isSelected 
                        ? "bg-primary/10 text-primary font-medium border-primary/20" 
                        : "hover:bg-muted/80 text-foreground"
                    )}
                  >
                    {/* Tiêu đề in đậm, cho phép ngắt 2 dòng */}
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold leading-relaxed break-words line-clamp-2 flex-1 text-slate-800 dark:text-slate-200">
                        {art.title}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />}
                    </div>

                    {/* Metadata Card: Badge Danh mục, ngày tạo và tác giả */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/90">
                      {art.category?.name && (
                        <span className="bg-slate-100 dark:bg-slate-800 dark:text-slate-300 text-slate-600 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold border border-slate-200/40 dark:border-slate-700/40">
                          {art.category.name}
                        </span>
                      )}
                      {dateStr && (
                        <span className="font-mono text-[9px]">Tạo: {dateStr}</span>
                      )}
                      {art.author?.full_name && (
                        <span className="truncate max-w-[90px] italic">bởi {art.author.full_name}</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Component Select bộ môn có ô tìm kiếm hợp nhất và hiển thị mã bộ môn
interface DepartmentSelectProps {
  value: string
  onValueChange: (value: string) => void
  departmentsList: any[]
  disabled: boolean
}

export function DepartmentSelect({
  value,
  onValueChange,
  departmentsList,
  disabled
}: DepartmentSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Tìm bộ môn đang chọn trong danh sách hiển thị
  const selectedDept = useMemo(() => {
    return departmentsList.find((dept) => dept.id === value)
  }, [departmentsList, value])

  // Lọc bộ môn theo từ khóa tìm kiếm (local filter)
  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return departmentsList
    const term = searchTerm.toLowerCase()
    return departmentsList.filter(
      (dept) =>
        (dept.name && dept.name.toLowerCase().includes(term)) ||
        (dept.code && dept.code.toLowerCase().includes(term))
    )
  }, [departmentsList, searchTerm])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-xs h-10 font-normal bg-background px-3 hover:bg-background/80 focus:ring-1 focus:ring-primary/20 cursor-pointer"
        >
          <span className="truncate flex-1 text-left font-medium text-slate-700 dark:text-slate-300">
            {selectedDept ? selectedDept.name : 'Chọn bộ môn liên kết...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50" align="start">
        <div className="flex flex-col max-h-[300px] overflow-hidden bg-popover text-popover-foreground rounded-lg border shadow-lg">
          {/* Hộp Tìm kiếm hợp nhất */}
          <div className="flex items-center border-b px-3 py-2.5 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              placeholder="Tìm theo tên hoặc mã bộ môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-xs outline-none border-none py-0.5 placeholder:text-muted-foreground/70"
              autoFocus
            />
          </div>

          {/* Danh sách bộ môn */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {filteredDepts.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Không tìm thấy bộ môn nào.
              </div>
            ) : (
              filteredDepts.map((dept) => {
                const isSelected = dept.id === value

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onValueChange(dept.id)
                      setOpen(false)
                      setSearchTerm('')
                    }}
                    className={cn(
                      "w-full text-left p-2.5 rounded-md transition-colors text-xs flex flex-col gap-1 cursor-pointer border border-transparent",
                      isSelected 
                        ? "bg-primary/10 text-primary font-medium border-primary/20" 
                        : "hover:bg-muted/80 text-foreground"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold leading-relaxed break-words flex-1 text-slate-800 dark:text-slate-200">
                        {dept.name}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />}
                    </div>
                    {dept.code && (
                      <div className="text-[10px] text-muted-foreground">
                        Mã bộ môn: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-[9px] font-bold text-slate-600 dark:text-slate-300">{dept.code}</span>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
