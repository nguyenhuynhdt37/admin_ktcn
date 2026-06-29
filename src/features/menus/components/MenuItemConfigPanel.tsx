import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Save, Link as LinkIcon, Eye, EyeOff, HelpCircle, Smile } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
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
import { CategoryTreeSelect } from './CategoryTreeSelect'
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

const MOCK_ARTICLES = [
  { id: 'art-1', title: 'Thông báo tuyển sinh Đại học năm 2026' },
  { id: 'art-2', title: 'Lễ tốt nghiệp và trao bằng thạc sĩ khóa 32' },
  { id: 'art-3', title: 'Hội nghị khoa học quốc tế về Công nghệ thông tin' },
]

const MOCK_PAGES = [
  { id: 'page-about', title: 'Giới thiệu chung' },
  { id: 'page-contact', title: 'Liên hệ & Bản đồ' },
  { id: 'page-rules', title: 'Quy chế đào tạo' },
  { id: 'page-history', title: 'Lịch sử phát triển' },
]

interface MenuItemConfigPanelProps {
  menuId: string
  itemId: string
  onClose: () => void
  refetchTree: () => void
}

export function MenuItemConfigPanel({
  menuId,
  itemId,
  onClose,
  refetchTree,
}: MenuItemConfigPanelProps) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('menu.update')

  const queryClient = useQueryClient()

  // 1. Query lấy thông tin chi tiết của menu item
  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['menu-item', menuId, itemId],
    queryFn: () => menusService.getItem(menuId, itemId),
    enabled: !!itemId,
  })

  // Query lấy danh sách icons cấu hình từ Backend
  const { data: iconCategories } = useQuery({
    queryKey: ['menu-config-icons'],
    queryFn: menusService.getCuratedIcons,
  })

  // State quản lý form
  const [title, setTitle] = useState('')
  const [targetType, setTargetType] = useState<string>('NONE')
  const [targetId, setTargetId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [icon, setIcon] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Danh sách biểu tượng mở rộng phong phú ở client-side
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

  // Gộp nhóm biểu tượng từ Backend API và danh sách mở rộng ở Client
  const allCategories = [
    ...(iconCategories || []),
    {
      category: 'Biểu tượng phổ biến khác',
      icons: EXTENDED_ICONS,
    },
  ]

  // Lọc danh sách biểu tượng dựa trên từ khóa tìm kiếm
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

  // Đồng bộ dữ liệu từ API vào state của form khi data load xong
  useEffect(() => {
    if (item) {
      setTitle(item.title || '')
      setTargetType(item.target_type || 'NONE')
      setTargetId(item.target_id || '')
      setExternalUrl(item.external_url || '')
      setIcon(item.icon || '')
      setOpenInNewTab(item.open_in_new_tab || false)
      setIsVisible(item.is_visible !== false)
    }
  }, [item])

  // 2. Mutation cập nhật cấu hình item
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
      }
      toast.error(errorMap[errorCode] || 'Không thể cập nhật cấu hình.')
    },
  })

  // 3. Xử lý lưu
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
      target_id: ['CATEGORY', 'ARTICLE', 'PAGE', 'MODULE'].includes(targetType) ? targetId.trim() || null : null,
      external_url: targetType === 'EXTERNAL_LINK' ? externalUrl.trim() || null : null,
      open_in_new_tab: openInNewTab,
      icon: icon.trim() || null,
      is_visible: isVisible,
    }

    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Đang tải cấu hình...</span>
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className="p-4 text-center text-sm text-destructive">
        Không thể tải thông tin mục menu. Vui lòng thử lại.
      </div>
    )
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
              <SelectItem value="NONE">Không liên kết (Chỉ làm menu cha)</SelectItem>
              <SelectItem value="EXTERNAL_LINK">Liên kết ngoài (URL)</SelectItem>
              <SelectItem value="CATEGORY">Danh mục bài viết</SelectItem>
              <SelectItem value="ARTICLE">Bài viết chi tiết</SelectItem>
              <SelectItem value="PAGE">Trang tĩnh</SelectItem>
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
            <Label htmlFor="targetId" className="text-xs font-semibold text-foreground/80">
              Chọn bài viết liên kết <span className="text-destructive">*</span>
            </Label>
            <Select value={targetId} onValueChange={setTargetId} disabled={!canUpdate}>
              <SelectTrigger id="targetId" className="h-9 text-sm bg-background">
                <SelectValue placeholder="Chọn bài viết cụ thể" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ARTICLES.map((art) => (
                  <SelectItem key={art.id} value={art.id}>
                    {art.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {targetType === 'PAGE' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label htmlFor="targetId" className="text-xs font-semibold text-foreground/80">
              Chọn trang tĩnh liên kết <span className="text-destructive">*</span>
            </Label>
            <Select value={targetId} onValueChange={setTargetId} disabled={!canUpdate}>
              <SelectTrigger id="targetId" className="h-9 text-sm bg-background">
                <SelectValue placeholder="Chọn trang giới thiệu" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PAGES.map((pg) => (
                  <SelectItem key={pg.id} value={pg.id}>
                    {pg.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            className="cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        )}
      </div>
    </div>
  )
}
