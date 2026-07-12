/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Save, Link as LinkIcon, Eye, EyeOff, Loader2, Languages } from 'lucide-react'
import { httpClient } from '@/services/http/client'
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
import { menusService } from '../services/menusService'
import { articleService } from '@/features/articles/services/articleService'
import { departmentService } from '@/features/departments/services/departmentService'
import { CategoryTreeSelect } from './CategoryTreeSelect'
import { ArticleSelect, DepartmentSelect } from './MenuItemConfigPanel'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useAuth } from '@/app/providers/AuthProvider'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

interface MenuItemCreatePanelProps {
  menuId: string
  parentId: string | null
  onClose: () => void
  refetchTree: () => void
  onSelectCreatedItem: (id: string) => void
}

export function MenuItemCreatePanel({
  menuId,
  parentId,
  onClose,
  refetchTree,
  onSelectCreatedItem,
}: MenuItemCreatePanelProps) {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('menu.create')
  const queryClient = useQueryClient()

  // State đa ngôn ngữ và tab
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [lastTranslatedVi, setLastTranslatedVi] = useState('')

  // State form
  const [translations, setTranslations] = useState({
    vi: { title: '', external_url: '' },
    en: { title: '', external_url: '' },
  })
  const [targetType, setTargetType] = useState<string>('NONE')
  const [targetId, setTargetId] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleTranslateClick = () => {
    const enTitle = translations.en.title.trim()
    if (enTitle && enTitle !== 'Đang dịch...' && enTitle !== 'Translating...') {
      setShowConfirm(true)
    } else {
      handleAutoTranslate()
    }
  }


  // State tìm bài viết
  const [articleSearch, setArticleSearch] = useState('')
  const debouncedArticleSearch = useDebounce(articleSearch, 400)

  // Query bài viết
  const { data: articlesData, isLoading: isLoadingArticles } = useQuery({
    queryKey: ['menus-create-search-articles', debouncedArticleSearch],
    queryFn: () => articleService.list({
      status: 'PUBLISHED',
      is_draft: false,
      page: 1,
      page_size: 100,
      search: debouncedArticleSearch || undefined
    }),
    enabled: targetType === 'ARTICLE',
  })

  // Query bộ môn
  const { data: departmentsData } = useQuery({
    queryKey: ['menus-create-departments'],
    queryFn: () => departmentService.list({
      is_active: true,
      page: 1,
      page_size: 1000
    }),
    enabled: targetType === 'DEPARTMENT',
  })

  const articlesList = articlesData?.items || []
  const departmentsList = departmentsData?.items || []

  const handleTranslationChange = (lang: 'vi' | 'en', field: 'title' | 'external_url', value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }))
  }

  // Dịch tự động tiêu đề
  const handleAutoTranslate = async () => {
    const textToTranslate = translations.vi.title.trim()
    if (!textToTranslate) {
      toast.error('Vui lòng nhập Tiêu đề Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslating(true)
    try {
      const res = await httpClient.post<Record<string, string>>('/translation', {
        text: textToTranslate,
        target_languages: ['en'],
        context: 'menu_name'
      }, {
        timeout: 60000
      })
      
      if (res.data?.en) {
        handleTranslationChange('en', 'title', res.data.en)
        toast.success('Đã dịch tự động sang Tiếng Anh thành công!')
      } else {
        toast.error('Không nhận được bản dịch từ máy chủ.')
      }
    } catch {
      toast.error('Dịch tự động thất bại.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Mutation tạo
  const createMutation = useMutation({
    mutationFn: (payload: any) => menusService.createItem(menuId, payload),
    onSuccess: (resData) => {
      toast.success(`Đã thêm mục menu "${resData.title || resData.translations?.vi?.title}" thành công!`)
      refetchTree()
      queryClient.invalidateQueries({ queryKey: ['menu-tree', menuId] })
      onSelectCreatedItem(resData.id) // Focus và chuyển sang edit
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error_code
      const errorMap: Record<string, string> = {
        TARGET_CATEGORY_NOT_FOUND: 'Danh mục được chọn không tồn tại.',
        TARGET_CATEGORY_NOT_ACTIVE: 'Danh mục được chọn không hoạt động.',
        TARGET_ARTICLE_NOT_FOUND: 'Bài viết không tồn tại.',
        TARGET_DEPARTMENT_NOT_FOUND: 'Bộ môn không tồn tại.',
      }
      toast.error(errorMap[errorCode] || 'Tạo mục menu thất bại.')
    },
  })

  const isTabComplete = (lang: 'vi' | 'en') => {
    return !!translations[lang].title.trim()
  }

  const isFormValid = () => {
    return isTabComplete('vi') && isTabComplete('en')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreate) {
      toast.error('Bạn không có quyền tạo mục menu.')
      return
    }
    if (!translations.vi.title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề ở Tiếng Việt 🇻🇳')
      setActiveTab('vi')
      return
    }
    if (!translations.en.title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề ở Tiếng Anh 🇬🇧')
      setActiveTab('en')
      return
    }

    const isExternal = targetType === 'EXTERNAL_LINK'

    const payload = {
      target_type: !targetType || targetType === 'NONE' ? null : targetType,
      target_id: ['CATEGORY', 'ARTICLE', 'PAGE', 'MODULE', 'DEPARTMENT'].includes(targetType || '') ? (targetId.trim() || null) : null,
      open_in_new_tab: openInNewTab,
      is_visible: isVisible,
      parent_id: parentId || null,
      translations: {
        vi: {
          title: translations.vi.title.trim(),
          external_url: isExternal ? (translations.vi.external_url?.trim() || null) : null,
        },
        en: {
          title: translations.en.title.trim(),
          external_url: isExternal ? (translations.en.external_url?.trim() || null) : null,
        },
      }
    }

    createMutation.mutate(payload)
  }

  return (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border shadow-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">Tạo mục menu mới</h3>
          <p className="text-muted-foreground text-xs truncate">
            {parentId ? 'Tạo làm mục con' : 'Tạo làm mục gốc'}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
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
            <Label htmlFor="create-title" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
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
            id="create-title"
            value={translations[activeTab].title}
            onChange={(e) => handleTranslationChange(activeTab, 'title', e.target.value)}
            placeholder={activeTab === 'vi' ? 'VD: Liên hệ' : 'VD: Contact Us'}
            className="font-medium bg-background border-border/80"
          />
        </div>

        {/* Loại liên kết */}
        <div className="space-y-1.5">
          <Label htmlFor="create-targetType" className="text-xs font-semibold text-foreground/80">
            Loại liên kết
          </Label>
          <Select
            value={targetType}
            onValueChange={(val) => {
              setTargetType(val)
              setTargetId('')
              setExternalUrl('')
            }}
          >
            <SelectTrigger id="create-targetType" className="h-9 text-sm">
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

        {/* Hiển thị input tương ứng */}
        {targetType === 'EXTERNAL_LINK' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label htmlFor="create-externalUrl" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
              Đường dẫn liên kết ({activeTab === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})
            </Label>
            <Input
              id="create-externalUrl"
              value={translations[activeTab].external_url}
              onChange={(e) => handleTranslationChange(activeTab, 'external_url', e.target.value)}
              placeholder={activeTab === 'vi' ? 'https://example.com/trang-viet' : 'https://example.com/english-page'}
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
              disabled={false}
            />
          </div>
        )}

        {targetType === 'DEPARTMENT' && (
          <div className="space-y-1.5 border-l-2 border-primary/30 pl-3 py-1">
            <Label htmlFor="create-targetId" className="text-xs font-semibold text-foreground/80">
              Chọn bộ môn liên kết <span className="text-destructive">*</span>
            </Label>
            <DepartmentSelect
              value={targetId}
              onValueChange={setTargetId}
              departmentsList={departmentsList}
              disabled={false}
            />
          </div>
        )}

        <div className="h-px bg-border my-2" />

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          {/* Mở tab mới */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="create-openInNewTab" className="text-xs font-semibold text-foreground/80">
                Mở trong tab mới
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Thêm thuộc tính target="_blank"
              </p>
            </div>
            <Switch
              id="create-openInNewTab"
              checked={openInNewTab}
              onCheckedChange={setOpenInNewTab}
              className="cursor-pointer scale-75"
            />
          </div>

          {/* Hiển thị / Ẩn */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="create-isVisible" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                {isVisible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                Trạng thái hiển thị
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Cho phép hiển thị trên giao diện người dùng
              </p>
            </div>
            <Switch
              id="create-isVisible"
              checked={isVisible}
              onCheckedChange={setIsVisible}
              className="cursor-pointer scale-75"
            />
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="border-t p-4 bg-muted/20 rounded-b-xl flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="cursor-pointer"
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          size="sm"
          onClick={handleSubmit}
          disabled={createMutation.isPending || !isFormValid()}
          className="cursor-pointer shadow-sm flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold"
        >
          <Save className="h-4 w-4" />
          {createMutation.isPending ? 'Đang tạo...' : 'Tạo mục menu'}
        </Button>
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
