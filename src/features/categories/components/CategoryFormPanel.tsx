/* eslint-disable */
import { Languages, Globe, Camera, Trash2, ShieldCheck, HelpCircle, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { cn } from '@/lib/utils'
import { CategorySEOSection } from './CategorySEOSection'
import { useAuth } from '@/app/providers/AuthProvider'
import { useCategoryForm, INITIAL_TRANSLATION } from '../hooks/useCategoryForm'

interface CategoryFormPanelProps {
  mode: 'create' | 'edit'
  selectedCategoryId: string
  createParentId: string | null
  onClose: () => void
  refetchTree: () => void
  onSelectCreatedItem: (id: string) => void
}

export function CategoryFormPanel({
  mode,
  selectedCategoryId,
  createParentId,
  onClose,
  refetchTree,
  onSelectCreatedItem,
}: CategoryFormPanelProps) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('category.update')
  const canCreate = hasPermission('category.create')

  // Sử dụng custom hook đóng gói toàn bộ logic
  const {
    form,
    activeTab,
    setActiveTab,
    isTranslating,
    showValidationErrors,
    isLoadingDetail,
    isError,
    categoryDetail,
    handleFieldChange,
    handleTranslationChange,
    handleAutoTranslate,
    isUploadingThumbnail,
    thumbnailUrl,
    thumbnailInputRef,
    handleThumbnailUpload,
    handleThumbnailRemove,
    slugCheck,
    isTabComplete,
    isFormValid,
    handleSubmit,
    saveMutation,
  } = useCategoryForm({
    mode,
    selectedCategoryId,
    createParentId,
    refetchTree,
    onSelectCreatedItem,
  })

  if (mode === 'edit' && isLoadingDetail) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 border border-dashed rounded-xl bg-muted/10">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground font-medium">Đang tải cấu hình...</span>
      </div>
    )
  }

  if (mode === 'edit' && (isError || !categoryDetail)) {
    return (
      <div className="p-6 text-center text-sm text-destructive border border-dashed rounded-xl bg-destructive/5">
        Không thể tải thông tin danh mục. Vui lòng thử lại.
      </div>
    )
  }

  const activeTranslation = form.translations?.[activeTab] || INITIAL_TRANSLATION

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-180px)] bg-card rounded-xl border border-border shadow-md max-w-[500px] w-full ml-auto overflow-hidden relative">
      
      {/* Lớp overlay khóa màn hình trong lúc dịch */}
      {isTranslating && (
        <div className="absolute inset-0 bg-background/60 z-50 flex flex-col items-center justify-center gap-2.5 backdrop-blur-xs">
          <div className="relative flex items-center justify-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <Languages className="h-4 w-4 text-primary absolute" />
          </div>
          <span className="text-xs font-bold text-foreground animate-pulse">
            Đang dịch tự động sang các ngôn ngữ khác...
          </span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex items-center justify-between border-b p-4 shrink-0 bg-muted/5">
        <div className="min-w-0 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Languages className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm truncate leading-snug">
              {mode === 'create' ? 'Tạo danh mục mới' : 'Chỉnh sửa danh mục'}
            </h3>
            {mode === 'edit' && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[340px]">
                {categoryDetail?.translations?.vi?.name || categoryDetail?.name}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 cursor-pointer rounded-full hover:bg-muted"
        >
          <span className="text-sm font-semibold">✕</span>
        </Button>
      </div>

      {/* Form cấu hình - Cuộn độc lập */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* ─── KHỐI 1: THÔNG TIN ĐA NGÔN NGỮ (Translations level) ─── */}
        <div className="space-y-4 border border-border/85 p-4 rounded-xl bg-card shadow-xs relative">
          <div className="flex items-center justify-between border-b pb-2 shrink-0">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              <span>Nội dung Đa Ngôn Ngữ</span>
            </div>
            {activeTab === 'vi' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 border-primary/40 text-[10px] px-2.5 text-primary hover:bg-primary/5 cursor-pointer shrink-0"
                onClick={handleAutoTranslate}
                disabled={isTranslating || !form.translations?.vi?.name?.trim()}
              >
                <Languages className="h-3 w-3 mr-1" /> Dịch tự động
              </Button>
            )}
          </div>

          {/* Tabs Selector đa ngôn ngữ thiết kế CMS */}
          <div className="flex border-b border-border bg-muted/20 rounded-lg p-1 gap-1">
            {[
              { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
              { code: 'en', label: 'Tiếng Anh', flag: '🇬🇧' },
            ].map((tab) => {
              const isTabDone = isTabComplete(tab.code as any)
              return (
                <button
                  key={tab.code}
                  type="button"
                  onClick={() => setActiveTab(tab.code as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer relative",
                    activeTab === tab.code
                      ? "bg-card text-foreground shadow-xs border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <span>{tab.flag}</span>
                  <span>{tab.label}</span>
                  {/* Chấm đỏ báo lỗi/cảnh báo thiếu trường trực quan */}
                  {!isTabDone && (
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse absolute -top-0.5 -right-0.5" title="Chưa hoàn thiện bản dịch" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Các trường nhập của tab hiện tại */}
          <div className="space-y-4 pt-1">
            {/* Tên danh mục */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="cat_name" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                  Tên danh mục <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="cat_name"
                value={activeTranslation.name}
                onChange={(e) => handleTranslationChange(activeTab, 'name', e.target.value)}
                placeholder={activeTab === 'vi' ? 'Nhập tên danh mục (ví dụ: Cơ cấu tổ chức)' : 'Category Name'}
                className={cn(
                  "h-9 text-xs focus-visible:ring-1 focus-visible:ring-primary/80",
                  showValidationErrors && !activeTranslation.name.trim() && "border-destructive/80 focus-visible:ring-destructive/80"
                )}
              />
            </div>

            {/* Đường dẫn Slug */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="cat_slug" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                  Đường dẫn (Slug) <span className="text-destructive">*</span>
                </Label>
                {slugCheck.isChecking && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">Đang check...</span>
                )}
              </div>
              <Input
                id="cat_slug"
                value={activeTranslation.slug}
                onChange={(e) => handleTranslationChange(activeTab, 'slug', e.target.value)}
                placeholder="co-cau-to-chuc"
                className={cn(
                  "h-9 text-xs font-mono focus-visible:ring-1 focus-visible:ring-primary/80",
                  showValidationErrors && !activeTranslation.slug.trim() && "border-destructive/80 focus-visible:ring-destructive/80",
                  slugCheck.exists && "border-amber-500/80 bg-amber-500/5 focus-visible:ring-amber-500/80 text-amber-600"
                )}
              />
              {/* Cảnh báo trùng lặp slug hoặc backend sinh slug mới */}
              {slugCheck.exists && (
                <div className="text-[10px] text-amber-600 font-semibold bg-amber-500/10 px-2 py-1 rounded-sm border border-amber-500/20 leading-relaxed">
                  ⚠️ Slug đã tồn tại. Backend sẽ tự động đồng bộ sang dạng:{' '}
                  <span className="underline font-mono">{slugCheck.suggested}</span> khi bạn lưu cấu hình.
                </div>
              )}
            </div>

            {/* Mô tả ngắn */}
            <div className="space-y-1.5">
              <Label htmlFor="cat_desc" className="text-xs font-semibold text-foreground/80">
                Mô tả ngắn
              </Label>
              <Textarea
                id="cat_desc"
                value={activeTranslation.description}
                onChange={(e) => handleTranslationChange(activeTab, 'description', e.target.value)}
                placeholder="Nhập mô tả ngắn cho danh mục..."
                className="min-h-[70px] text-xs resize-none focus-visible:ring-1 focus-visible:ring-primary/80"
              />
            </div>
          </div>
        </div>

        {/* ─── KHỐI 2: META SEO PREVIEW & ADVANCED SEO SECTION ─── */}
        <CategorySEOSection
          activeTab={activeTab}
          seoTitle={activeTranslation.seo_title}
          seoDescription={activeTranslation.seo_description}
          name={activeTranslation.name}
          description={activeTranslation.description}
        />

        {/* ─── KHỐI 3: THÔNG TIN CHUNG (Root level settings) ─── */}
        <div className="space-y-4 border border-border/85 p-4 rounded-xl bg-card shadow-xs">
          <div className="text-xs font-bold text-foreground border-b pb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Cấu hình Hệ thống</span>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground/80">Ảnh đại diện (Thumbnail)</Label>
            <input
              type="file"
              accept="image/*"
              ref={thumbnailInputRef}
              onChange={handleThumbnailUpload}
              className="hidden"
            />
            
            {thumbnailUrl ? (
              <div className="group relative h-28 w-full border rounded-lg overflow-hidden bg-muted/20">
                <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[10px] cursor-pointer"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    Thay đổi
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 text-[10px] cursor-pointer"
                    onClick={handleThumbnailRemove}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => thumbnailInputRef.current?.click()}
                className="h-28 w-full border border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground"
              >
                {isUploadingThumbnail ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Camera className="h-5 w-5 opacity-70" />
                )}
                <span className="text-[10px] font-semibold">Tải ảnh lên (Khuyên dùng: 1:1, JPG/PNG)</span>
              </div>
            )}
          </div>

          {/* Status Switch (Active / Inactive) */}
          <div className="flex items-center justify-between border-b pb-3 pt-1">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground">Trạng thái Hoạt động</Label>
              <p className="text-[10px] text-muted-foreground">Bật danh mục để hiển thị trên Portal và cho phép gán bài viết.</p>
            </div>
            <Switch
              checked={form.status === 'ACTIVE'}
              onCheckedChange={(checked) => handleFieldChange('status', checked ? 'ACTIVE' : 'INACTIVE')}
              className="cursor-pointer"
            />
          </div>

          {/* Cấu hình nâng cao Switches */}
          <div className="space-y-3 pt-1">
            {/* Hiển thị trên Menu */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-semibold text-foreground/80 cursor-pointer">Hiển thị công khai</Label>
                <HelpCircle className="h-3 w-3 text-muted-foreground" title="Bật để hiển thị công khai danh mục trên trang chính" />
              </div>
              <Switch
                checked={form.is_visible}
                onCheckedChange={(checked) => handleFieldChange('is_visible', checked)}
                className="scale-90 cursor-pointer"
              />
            </div>

            {/* Weekly Schedule */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-semibold text-foreground/80 cursor-pointer">Lịch học tuần</Label>
                <HelpCircle className="h-3 w-3 text-muted-foreground" title="Đánh dấu danh mục này dùng cho mục đích xếp lịch học tuần" />
              </div>
              <Switch
                checked={form.is_weekly_schedule}
                onCheckedChange={(checked) => handleFieldChange('is_weekly_schedule', checked)}
                className="scale-90 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Footer Buttons */}
      <div className="border-t p-4 flex items-center justify-end gap-2 shrink-0 bg-muted/5">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-9 text-xs px-4 cursor-pointer hover:bg-muted"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={!isFormValid() || saveMutation.isPending}
          className="h-9 text-xs px-4 bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer font-bold flex items-center gap-1.5"
        >
          {saveMutation.isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Lưu cấu hình
        </Button>
      </div>
    </div>
  )
}
