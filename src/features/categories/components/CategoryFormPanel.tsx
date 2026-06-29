import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, X, Loader2, Camera, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { httpClient } from '@/services/http/client'
import { cn } from '../../../lib/utils'
import { categoryService } from '../services/categoryService'
import { CategorySEOSection } from './CategorySEOSection'
import type { CategoryStatus } from '../types'
import { useAuth } from '@/app/providers/AuthProvider'

interface CategoryFormPanelProps {
  selectedCategoryId: string
  onClose: () => void
  refetchTree: () => void
}

interface FormState {
  name: string
  slug: string
  description: string
  parent_id: string | null
  status: CategoryStatus
  is_visible: boolean
  thumbnail_id: string | null
  seo_title: string
  seo_description: string
  seo_keywords: string
  seo_canonical: string
  seo_robots: string
  seo_og_image_id: string | null
}

const INITIAL_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  parent_id: null,
  status: 'ACTIVE',
  is_visible: true,
  thumbnail_id: null,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  seo_canonical: '',
  seo_robots: 'index, follow',
  seo_og_image_id: null,
}

export function CategoryFormPanel({
  selectedCategoryId,
  onClose,
  refetchTree,
}: CategoryFormPanelProps) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('category.update')

  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  // Lấy chi tiết category
  const { data: categoryDetail, isLoading: isLoadingDetail, isError } = useQuery({
    queryKey: ['category-detail', selectedCategoryId],
    queryFn: () => categoryService.getCategory(selectedCategoryId),
    enabled: !!selectedCategoryId,
  })

  // Đổ dữ liệu vào form khi nhận được detail
  useEffect(() => {
    if (categoryDetail) {
      setForm({
        name: categoryDetail.name || '',
        slug: categoryDetail.slug || '',
        description: categoryDetail.description || '',
        parent_id: categoryDetail.parent_id,
        status: ((categoryDetail.status || 'ACTIVE').toUpperCase() as CategoryStatus) || 'ACTIVE',
        is_visible: categoryDetail.is_visible !== false,
        thumbnail_id: categoryDetail.thumbnail_id || null,
        seo_title: categoryDetail.seo_title || '',
        seo_description: categoryDetail.seo_description || '',
        seo_keywords: categoryDetail.seo_keywords || '',
        seo_canonical: categoryDetail.seo_canonical || '',
        seo_robots: categoryDetail.seo_robots || 'index, follow',
        seo_og_image_id: categoryDetail.seo_og_image_id || null,
      })
    }
  }, [categoryDetail])

  // SEO field change handler
  const handleFieldChange = useCallback(
    (field: keyof FormState, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Thumbnail Image states and handlers (moved out of SEO section)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (form.thumbnail_id) {
        try {
          const res = await httpClient.get<{ url: string }>(`/media/${form.thumbnail_id}/url`)
          setThumbnailUrl(res.data.url)
        } catch {
          setThumbnailUrl(null)
        }
      } else {
        setThumbnailUrl(null)
      }
    }
    fetchThumbnailUrl()
  }, [form.thumbnail_id])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingThumbnail(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await httpClient.post<{ id: string; name: string }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const urlRes = await httpClient.get<{ url: string }>(`/media/${data.id}/url`)
      setForm((prev) => ({ ...prev, thumbnail_id: data.id }))
      setThumbnailUrl(urlRes.data.url)
      toast.success('Đã tải lên ảnh đại diện danh mục!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Tải ảnh lên thất bại')
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  const handleThumbnailRemove = () => {
    setForm((prev) => ({ ...prev, thumbnail_id: null }))
    setThumbnailUrl(null)
    toast.success('Đã gỡ bỏ hình ảnh đại diện.')
  }

  // ─── DEBOUNCE CHECK SLUG REALTIME ───
  const [slugCheck, setSlugCheck] = useState<{
    isChecking: boolean
    exists: boolean
    suggested: string | null
  }>({
    isChecking: false,
    exists: false,
    suggested: null,
  })

  useEffect(() => {
    if (!form.slug || form.slug.trim() === '') {
      setSlugCheck({ isChecking: false, exists: false, suggested: null })
      return
    }

    // Nếu slug trùng với slug hiện tại của danh mục đang chỉnh sửa thì không báo trùng
    if (categoryDetail && form.slug === categoryDetail.slug) {
      setSlugCheck({ isChecking: false, exists: false, suggested: null })
      return
    }

    setSlugCheck((prev) => ({ ...prev, isChecking: true }))

    const timer = setTimeout(async () => {
      try {
        const res = await categoryService.checkSlug(form.slug, selectedCategoryId)
        setSlugCheck({
          isChecking: false,
          exists: res.exists,
          suggested: res.exists ? res.suggested_slug : null,
        })
      } catch {
        setSlugCheck({ isChecking: false, exists: false, suggested: null })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [form.slug, selectedCategoryId, categoryDetail])

  // Xử lý lỗi API
  const handleApiError = (error: any, defaultMsg: string) => {
    const errorCode = error?.response?.data?.error_code
    const errorMap: Record<string, string> = {
      CIRCULAR_REFERENCE: 'Không thể gán danh mục cha làm con của chính nó hoặc danh mục con của nó.',
      CATEGORY_HAS_CHILDREN: 'Không thể xóa danh mục này vì đang chứa danh mục con. Vui lòng xóa các danh mục con trước.',
      CATEGORY_NOT_FOUND: 'Danh mục không tồn tại hoặc đã bị xóa.',
      AI_BUDGET_EXCEEDED: 'Hạn mức AI tháng của hệ thống đã dùng hết.',
    }
    toast.error(errorMap[errorCode] || error?.response?.data?.message || defaultMsg)
  }

  // Mutation cập nhật
  const updateMutation = useMutation({
    mutationFn: () =>
      categoryService.updateCategory(selectedCategoryId, {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        parent_id: form.parent_id,
        status: form.status,
        is_visible: form.is_visible,
        thumbnail_id: form.thumbnail_id,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_keywords: form.seo_keywords || null,
        seo_canonical: form.seo_canonical || null,
        seo_robots: form.seo_robots || null,
        seo_og_image_id: form.seo_og_image_id,
      }),
    onSuccess: (updated) => {
      toast.success(`Đã cập nhật danh mục "${updated.name}" thành công!`)
      refetchTree()
      queryClient.invalidateQueries({ queryKey: ['category-tree'] })
      queryClient.invalidateQueries({ queryKey: ['categories-list'] })
      queryClient.invalidateQueries({ queryKey: ['category-detail', selectedCategoryId] })
    },
    onError: (error: any) => handleApiError(error, 'Cập nhật danh mục thất bại.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục.')
      return
    }
    if (!canUpdate) {
      toast.error('Bạn không có quyền cập nhật danh mục.')
      return
    }
    updateMutation.mutate()
  }

  if (isLoadingDetail) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 border border-dashed rounded-xl bg-muted/10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Đang tải cấu hình...</span>
      </div>
    )
  }

  if (isError || !categoryDetail) {
    return (
      <div className="p-6 text-center text-sm text-destructive border border-dashed rounded-xl bg-destructive/5">
        Không thể tải thông tin danh mục. Vui lòng thử lại.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-180px)] bg-card rounded-xl border border-border shadow-xs max-w-[500px] w-full ml-auto overflow-hidden">
      {/* Header Panel (Chỉ hiển thị tên danh mục) */}
      <div className="flex items-center justify-between border-b p-4 shrink-0">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">
            {categoryDetail.name}
          </h3>
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

      {/* Form cấu hình - Cuộn độc lập */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tên danh mục */}
        <div className="space-y-1.5">
          <Label htmlFor="cat_name" className="text-xs font-semibold text-foreground/80">
            Tên danh mục <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cat_name"
            value={form.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="VD: Tin tức nổi bật"
            disabled={!canUpdate}
            className="h-9"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="cat_slug" className="text-xs font-semibold text-foreground/80">
            Slug (URL)
          </Label>
          <div className="relative">
            <Input
              id="cat_slug"
              value={form.slug}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
              placeholder="tin-tuc-noi-bat"
              disabled={!canUpdate}
              className={cn(
                "h-9 text-sm font-mono pr-8",
                slugCheck.exists && "border-amber-500 focus-visible:ring-amber-500 bg-amber-500/5 text-amber-900"
              )}
            />
            {slugCheck.isChecking && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          {slugCheck.exists && (
            <div className="text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded border border-amber-200/60 mt-1 space-y-1.5 leading-normal">
              <p className="flex items-center gap-1 font-semibold">
                ⚠️ Slug này đã tồn tại trong hệ thống (kể cả đã xóa mềm).
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, slug: slugCheck.suggested || '' }))
                  setSlugCheck({ isChecking: false, exists: false, suggested: null })
                }}
                className="text-primary hover:underline block text-left font-semibold cursor-pointer"
              >
                👉 Sử dụng gợi ý: <span className="font-mono bg-primary/10 px-1 py-0.5 rounded text-xs">{slugCheck.suggested}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mô tả */}
        <div className="space-y-1.5">
          <Label htmlFor="cat_desc" className="text-xs font-semibold text-foreground/80">
            Mô tả ngắn
          </Label>
          <Textarea
            id="cat_desc"
            value={form.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Mô tả ngắn gọn về danh mục này..."
            disabled={!canUpdate}
            className="min-h-[80px] resize-none text-sm"
          />
        </div>

        {/* Ảnh đại diện (đã dời ra khỏi SEO) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">Ảnh đại diện</Label>
          <div className="relative border border-border/80 rounded-lg aspect-video max-w-[240px] bg-muted/20 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors group">
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                {canUpdate && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm gap-2">
                    <span className="text-xs font-semibold">Thay đổi ảnh</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px] px-2.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleThumbnailRemove()
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Gỡ ảnh
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 text-center cursor-pointer text-xs text-muted-foreground w-full h-full"
                disabled={isUploadingThumbnail || !canUpdate}
              >
                {isUploadingThumbnail ? (
                  <Loader2 className="h-5 w-5 animate-spin mb-1.5 text-primary" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                    <Camera className="h-6 w-6" />
                    <span className="text-xs font-medium">Tải ảnh lên</span>
                  </div>
                )}
              </button>
            )}
          </div>
          <input
            type="file"
            ref={thumbnailInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailUpload}
          />
        </div>


        {/* Trạng thái */}
        <div className="space-y-1.5">
          <Label htmlFor="cat_status" className="text-xs font-semibold text-foreground/80">
            Trạng thái
          </Label>
          <select
            id="cat_status"
            value={form.status}
            disabled={!canUpdate}
            onChange={(e) => handleFieldChange('status', e.target.value as CategoryStatus)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          >
            <option value="ACTIVE" className="bg-popover text-popover-foreground">Hoạt động</option>
            <option value="DRAFT" className="bg-popover text-popover-foreground">Nháp</option>
            <option value="INACTIVE" className="bg-popover text-popover-foreground">Không hoạt động</option>
          </select>
        </div>

        {/* Hiển thị */}
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
          <Label htmlFor="cat_visible" className="cursor-pointer text-sm font-semibold text-foreground/80">
            Hiển thị trên website
          </Label>
          <Switch
            id="cat_visible"
            checked={form.is_visible}
            disabled={!canUpdate}
            onCheckedChange={(checked) => handleFieldChange('is_visible', checked)}
          />
        </div>

        {/* SEO & Cấu hình nâng cao Section (Accordion) */}
        <CategorySEOSection
          name={form.name}
          description={form.description}
          seoTitle={form.seo_title}
          seoDescription={form.seo_description}
          seoKeywords={form.seo_keywords}
          seoCanonical={form.seo_canonical}
          seoRobots={form.seo_robots}
          seoOgImageId={form.seo_og_image_id}
          thumbnailUrl={thumbnailUrl}
          seoResolved={(categoryDetail as any)?.seo_resolved}
          onChange={handleFieldChange}
          disabled={!canUpdate}
        />
      </form>

      {/* Footer cố định không bị cuộn */}
      <div className="p-4 border-t bg-card shrink-0 flex gap-2 w-full justify-end">
        <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
          Đóng
        </Button>
        {canUpdate && (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="h-9 text-xs"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Lưu cấu hình
          </Button>
        )}
      </div>
    </div>
  )
}
