/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Save, Link as LinkIcon, Eye, EyeOff, Smile, Loader2, Check, ChevronsUpDown, Search, AlertTriangle, Languages } from 'lucide-react'
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

import { useMenuItemConfig } from '../hooks/useMenuItemConfig'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

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
  const {
    form,
    activeTab,
    setActiveTab,
    isTranslating,
    title,
    targetType,
    targetId,
    externalUrl,
    openInNewTab,
    isVisible,
    setTargetType,
    setTargetId,
    setOpenInNewTab,
    setIsVisible,
    handleTranslationChange,
    handleAutoTranslate,
    articleSearch,
    setArticleSearch,
    articlesList,
    departmentsList,
    isLoadingArticles,
    canUpdate,
    handleSubmit,
    updateMutation,
    isFormValid,
    isTabComplete,
  } = useMenuItemConfig({
    menuId,
    itemId,
    item,
    onClose,
    refetchTree,
  })

  const [showConfirm, setShowConfirm] = useState(false)

  const handleTranslateClick = () => {
    const enTitle = form.translations.en.title.trim()
    if (enTitle && enTitle !== 'Đang dịch...' && enTitle !== 'Translating...') {
      setShowConfirm(true)
    } else {
      handleAutoTranslate()
    }
  }

  return (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border shadow-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">Cấu hình mục</h3>
          <p className="text-muted-foreground text-xs truncate">
            {form.translations.vi.title || item.title || 'Mục menu'}
          </p>
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
        {/* Banner cảnh báo liên kết hỏng (đích đã bị xóa) */}
        {item?.target_info?.status === 'DELETED' && (
          <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-[11px] leading-normal flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Cảnh báo liên kết hỏng:</span> Tài nguyên liên kết đích của mục menu này đã bị xóa khỏi hệ thống. Vui lòng chọn liên kết mới hoặc đổi loại liên kết.
            </div>
          </div>
        )}

        {/* Tab đa ngôn ngữ (VI / EN) */}
        <div className="space-y-3 bg-muted/20 p-2 rounded-lg border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Nội dung đa ngôn ngữ
            </span>
            {activeTab === 'vi' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleTranslateClick}
                disabled={isTranslating}
                className="h-7 text-[10px] px-2 text-primary hover:bg-primary/10 cursor-pointer flex items-center gap-1 font-semibold"
              >
                {isTranslating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Languages className="h-3.5 w-3.5" />
                    <span>Dịch sang Tiếng Anh</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="flex border-b border-border/80 p-0.5 bg-muted/40 rounded-md">
            <button
              type="button"
              onClick={() => setActiveTab('vi')}
              className={cn(
                'flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5',
                activeTab === 'vi'
                  ? 'bg-background text-primary shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>🇻🇳 Tiếng Việt</span>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isTabComplete('vi') ? "bg-emerald-500" : "bg-destructive")} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={cn(
                'flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5',
                activeTab === 'en'
                  ? 'bg-background text-primary shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>🇬🇧 Tiếng Anh</span>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isTabComplete('en') ? "bg-emerald-500" : "bg-destructive")} />
            </button>
          </div>
        </div>

        {/* Tiêu đề theo ngôn ngữ đang active */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
              Tiêu đề hiển thị ({activeTab === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})
              <span className="text-destructive">*</span>
            </Label>
            {isTranslating && (
              <span className="text-[10px] text-primary font-semibold animate-pulse flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                Đang dịch tự động...
              </span>
            )}
          </div>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTranslationChange(activeTab, 'title', e.target.value)}
            disabled={!canUpdate}
            placeholder={activeTab === 'vi' ? 'VD: Giới thiệu' : 'VD: About Us'}
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
            onValueChange={setTargetType}
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
              Đường dẫn liên kết ({activeTab === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})
            </Label>
            <Input
              id="externalUrl"
              value={externalUrl}
              onChange={(e) => handleTranslationChange(activeTab, 'external_url', e.target.value)}
              placeholder={activeTab === 'vi' ? 'https://example.com/trang-viet' : 'https://example.com/english-page'}
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
              onChange={(id) => setTargetId(id ?? '')}
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
            disabled={updateMutation.isPending || !isFormValid()}
            className="cursor-pointer shadow-sm flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Xác nhận ghi đè bản dịch"
        description="Tiêu đề hiển thị Tiếng Anh hiện tại đã có dữ liệu. Bạn có chắc chắn muốn dịch lại và ghi đè bản dịch cũ không?"
        onConfirm={() => {
          handleAutoTranslate()
          setShowConfirm(false)
        }}
      />
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

  const selectedArticle = useMemo(() => {
    return articlesList.find((art) => art.id === value) ?? null
  }, [articlesList, value])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full h-auto min-h-10 justify-between font-normal bg-background px-3 py-2 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/30"
        >
          {selectedArticle ? (
            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-left">
              <span className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug">
                {selectedArticle.translations?.vi?.title || selectedArticle.translations?.en?.title || selectedArticle.title || '(Chưa có tiêu đề)'}
              </span>
              <span className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5">
                {selectedArticle.category?.name && (
                  <span className="bg-muted px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium">{selectedArticle.category.name}</span>
                )}
                {selectedArticle.view_count != null && (
                  <span>{selectedArticle.view_count.toLocaleString()} lượt xem</span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground flex-1 text-left">Chọn bài viết liên kết...</span>
          )}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedArticle && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 shadow-xl" align="start" sideOffset={4}>
        <div className="flex flex-col max-h-[380px] overflow-hidden rounded-lg border bg-popover">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <input
              placeholder="Tìm tiêu đề bài viết..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-[13px] outline-none border-none py-0.5 placeholder:text-muted-foreground/50"
              autoFocus
            />
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
            ) : searchTerm ? (
              <button
                onClick={() => onSearchChange('')}
                className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>

          {/* Article list */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {articlesList.length === 0 ? (
              <div className="text-center py-10 text-[13px] text-muted-foreground">
                {isLoading ? 'Đang tìm kiếm...' : 'Không tìm thấy bài viết nào.'}
              </div>
            ) : (
              articlesList.map((art) => {
                const isSelected = art.id === value
                const publishedDate = art.published_at
                  ? new Date(art.published_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : null

                const statusLabel: Record<string, { label: string; color: string }> = {
                  PUBLISHED: { label: 'Đã đăng', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                  SCHEDULED: { label: 'Lên lịch', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                  ARCHIVED: { label: 'Lưu trữ', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
                }
                const statusInfo = statusLabel[art.status]

                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      onValueChange(art.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-md transition-colors cursor-pointer border border-transparent flex flex-col gap-1.5',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn('text-[13px] font-medium leading-snug line-clamp-2 flex-1', isSelected ? 'text-primary-foreground' : 'text-foreground')}>
                        {art.translations?.vi?.title || art.translations?.en?.title || art.title || '(Chưa có tiêu đề)'}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-foreground mt-0.5" />}
                    </div>

                    {/* Meta row */}
                    <div className={cn('flex flex-wrap items-center gap-1.5 text-[11px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {statusInfo && (
                        <span className={cn('px-1.5 py-0.5 rounded-[4px] font-medium text-[10px]', isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      )}
                      {art.category?.name && (
                        <span className={cn('px-1.5 py-0.5 rounded-[4px] font-medium text-[10px]', isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                          {art.category.name}
                        </span>
                      )}
                      {art.view_count != null && (
                        <span className="flex items-center gap-0.5">
                          {art.view_count.toLocaleString()} lượt xem
                        </span>
                      )}
                      {publishedDate && <span>{publishedDate}</span>}
                      {art.author?.full_name && (
                        <span className="truncate max-w-[100px]">{art.author.full_name}</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {!isLoading && articlesList.length > 0 && (
            <div className="border-t px-3 py-2 bg-muted/20">
              <p className="text-[11px] text-muted-foreground/60">
                {articlesList.length} bài viết · Click để chọn
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── DepartmentSelect ─────────────────────────────────────────────────────────

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

  const selectedDept = useMemo(() => {
    return departmentsList.find((dept) => dept.id === value) ?? null
  }, [departmentsList, value])

  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return departmentsList
    const term = searchTerm.toLowerCase()
    return departmentsList.filter(
      (dept) =>
        (dept.name && dept.name.toLowerCase().includes(term)) ||
        (dept.code && dept.code.toLowerCase().includes(term)) ||
        (dept.email && dept.email.toLowerCase().includes(term))
    )
  }, [departmentsList, searchTerm])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full h-auto min-h-10 justify-between font-normal bg-background px-3 py-2 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/30"
        >
          {selectedDept ? (
            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-left">
              <span className="text-[13px] font-medium text-foreground truncate w-full">
                {selectedDept.name}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-2">
                {selectedDept.staff_count != null && (
                  <span>{selectedDept.staff_count} giảng viên</span>
                )}
                {selectedDept.email && (
                  <span className="truncate max-w-[140px]">{selectedDept.email}</span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground flex-1 text-left">Chọn bộ môn liên kết...</span>
          )}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedDept && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 shadow-xl" align="start" sideOffset={4}>
        <div className="flex flex-col max-h-[360px] overflow-hidden rounded-lg border bg-popover">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <input
              placeholder="Tìm theo tên, mã hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-[13px] outline-none border-none py-0.5 placeholder:text-muted-foreground/50"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Department list */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredDepts.length === 0 ? (
              <div className="text-center py-10 text-[13px] text-muted-foreground">
                Không tìm thấy bộ môn nào.
              </div>
            ) : (
              filteredDepts.map((dept) => {
                const isSelected = dept.id === value
                const isActive = dept.is_active !== false

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
                      'w-full text-left px-2.5 py-2 rounded-md transition-colors cursor-pointer border border-transparent flex flex-col gap-1.5',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {/* Name row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn('text-[13px] font-medium leading-snug flex-1', isSelected ? 'text-primary-foreground' : 'text-foreground')}>
                        {dept.name}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-foreground mt-0.5" />}
                    </div>

                    {/* Meta row */}
                    <div className={cn('flex flex-wrap items-center gap-1.5 text-[11px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {/* Active badge */}
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-[4px] font-medium text-[10px]',
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {isActive ? 'Hoạt động' : 'Ngừng'}
                      </span>

                      {/* Staff count */}
                      {dept.staff_count != null && (
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-[4px] font-medium text-[10px]',
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {dept.staff_count} GV
                        </span>
                      )}

                      {/* Code */}
                      {dept.code && (
                        <span className="font-mono text-[10px] opacity-70">{dept.code}</span>
                      )}

                      {/* Office */}
                      {dept.office && (
                        <span className="truncate max-w-[120px]">{dept.office}</span>
                      )}

                      {/* Email */}
                      {dept.email && (
                        <span className="truncate max-w-[140px]">{dept.email}</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {filteredDepts.length > 0 && (
            <div className="border-t px-3 py-2 bg-muted/20">
              <p className="text-[11px] text-muted-foreground/60">
                {filteredDepts.length} bộ môn · Click để chọn
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

