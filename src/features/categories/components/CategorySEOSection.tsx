import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, Trash2, Camera, ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

import { httpClient } from '@/services/http/client'
import { cn } from '@/lib/utils'

// Helpers
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '') // Bỏ ký tự đặc biệt
    .replace(/(\s+)/g, '-') // Đổi khoảng trắng thành -
    .replace(/-+/g, '-') // Bỏ - trùng lặp
    .replace(/^-+|-+$/g, '') // Bỏ - ở đầu/cuối
}

interface SEOResolved {
  seo_title: string
  seo_description: string
  seo_keywords: string
  seo_canonical: string
  seo_robots: string
  seo_og_image_url: string | null
}

interface CategorySEOSectionProps {
  name: string
  description: string
  // Form states
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  seoCanonical: string
  seoRobots: string
  seoOgImageId: string | null
  thumbnailUrl: string | null
  seoResolved?: SEOResolved
  
  // Handlers
  onChange: (field: any, value: any) => void
  disabled?: boolean
}

export function CategorySEOSection({
  name,
  description,
  seoTitle,
  seoDescription,
  seoKeywords,
  seoCanonical,
  seoRobots,
  seoOgImageId,
  thumbnailUrl,
  seoResolved,
  onChange,
  disabled = false,
}: CategorySEOSectionProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Image Upload states (Only OG Image is managed in SEO)
  const [isUploadingOg, setIsUploadingOg] = useState(false)
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null)

  const ogInputRef = useRef<HTMLInputElement>(null)

  // Fetch AI configuration omitted as AI is configured via .env now
  const isAiConfigured = true;
  let aiStatusText = "Tự động phân tích tên, mô tả danh mục để sinh thẻ SEO tối ưu bằng AI.";

  // Resolve fallback og image locally if it's pointing to the production domain
  const displayFallbackOgUrl = seoResolved?.seo_og_image_url
    ? (seoResolved.seo_og_image_url.startsWith('https://kcnt.vinhuni.edu.vn')
        ? seoResolved.seo_og_image_url.replace('https://kcnt.vinhuni.edu.vn', '')
        : seoResolved.seo_og_image_url)
    : null

  // Fetch URL for existing OG Image
  useEffect(() => {
    const fetchOgImageUrl = async () => {
      if (seoOgImageId) {
        try {
          const res = await httpClient.get<{ url: string }>(`/media/${seoOgImageId}/url`)
          setOgImageUrl(res.data.url)
        } catch {
          setOgImageUrl(null)
        }
      } else {
        setOgImageUrl(null)
      }
    }
    fetchOgImageUrl()
  }, [seoOgImageId])

  // AI Gen SEO
  const handleGenerateSEO = async () => {
    if (disabled) return
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên danh mục trước khi sinh SEO.')
      return
    }

    // Xác nhận ghi đè nếu admin đã nhập thủ công trước đó
    if (seoTitle.trim() || seoDescription.trim() || seoKeywords.trim()) {
      const confirmGen = window.confirm(
        'Bạn đã nhập thông tin SEO thủ công. Sinh SEO bằng AI sẽ ghi đè lên các trường này. Bạn có chắc chắn muốn tiếp tục?'
      )
      if (!confirmGen) return
    }

    setIsGenerating(true)
    try {
      const response = await httpClient.post('/ai/generate-seo', {
        title: name,
        description: stripHtml(description) || '',
        category_name: name,
      })
      const resData = response.data;

      onChange('seo_title', resData.seo_title)
      onChange('seo_description', resData.seo_description)
      onChange('seo_keywords', resData.seo_keywords || '')
      toast.success('Đã tự động tạo các thẻ SEO tối ưu bằng AI!')
    } catch (error: any) {
      const errorCode = error?.response?.data?.error_code
      if (errorCode === 'AI_BUDGET_EXCEEDED') {
        toast.error('Hạn mức AI tháng của hệ thống đã dùng hết. Vui lòng liên hệ quản trị viên.')
      } else {
        toast.error(error?.response?.data?.message || 'Sinh SEO bằng AI thất bại. Vui lòng kiểm tra lại API Key.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle Image Upload for OG Image
  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingOg(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await httpClient.post<{ id: string; name: string }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const urlRes = await httpClient.get<{ url: string }>(`/media/${data.id}/url`)
      onChange('seo_og_image_id', data.id)
      setOgImageUrl(urlRes.data.url)
      toast.success('Đã tải lên ảnh Open Graph!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Tải ảnh lên thất bại')
    } finally {
      setIsUploadingOg(false)
    }
  }

  const handleOgImageRemove = () => {
    if (disabled) return
    onChange('seo_og_image_id', null)
    setOgImageUrl(null)
    toast.success('Đã gỡ bỏ hình ảnh Open Graph.')
  }

  const fallbackTitle = seoResolved?.seo_title || `${name || 'Tên danh mục'} | Trường Kỹ thuật và Công nghệ - Đại học Vinh`
  const fallbackDesc = seoResolved?.seo_description || (description ? stripHtml(description).slice(0, 155) : "Mô tả mặc định của website...")

  return (
    <div className="space-y-4">
      {/* ─── PHẦN 1: SEO CƠ BẢN (LUÔN MỞ) ─── */}
      <div className="space-y-4 border border-border/80 rounded-lg p-4 bg-muted/5">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 border-b pb-2">
          <Globe className="h-4 w-4 text-primary" />
          Cấu hình SEO Cơ bản
        </h4>

        {/* Nút Sinh SEO bằng AI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
          <div className="text-[11px] text-muted-foreground max-w-[240px]">
            {aiStatusText}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-primary/30 text-xs text-primary hover:bg-primary/10 cursor-pointer"
            onClick={handleGenerateSEO}
            disabled={!isAiConfigured || isGenerating || disabled}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Sinh SEO bằng AI
          </Button>
        </div>

        {/* Google SERP Preview (Awesome UX) */}
        <div className="bg-background border rounded-lg p-3 space-y-1 text-left shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Xem trước trên Google</div>
          <div className="text-[#1a0dab] hover:underline text-[16px] leading-[20px] font-medium truncate">
            {seoTitle.trim() || fallbackTitle}
          </div>
          <div className="text-[#006621] text-[12px] leading-[16px] truncate flex items-center gap-1">
            {seoCanonical.trim() || seoResolved?.seo_canonical || `https://kcnt.vinhuni.edu.vn/${name ? generateSlug(name) : 'danh-muc'}`}
          </div>
          <div className="text-[#545454] text-[13px] leading-[18px] line-clamp-2">
            {seoDescription.trim() || fallbackDesc}
          </div>
        </div>

        {/* 1. SEO Title */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="cat_seo_title" className="text-xs font-semibold text-foreground/80">
              SEO Title
            </Label>
            <span className={cn(
              "text-[10px]",
              seoTitle.length > 60 ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {seoTitle.length || (seoResolved?.seo_title ? seoResolved.seo_title.length : (name ? name.length + 46 : 46))}/60 ký tự {!seoTitle && <span className="text-[9px] opacity-75">(tự sinh)</span>}
            </span>
          </div>
          <Input
            id="cat_seo_title"
            value={seoTitle}
            disabled={disabled}
            onChange={(e) => onChange('seo_title', e.target.value)}
            placeholder={fallbackTitle}
            className="h-9 text-sm"
          />
        </div>

        {/* 2. SEO Description */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="cat_seo_desc" className="text-xs font-semibold text-foreground/80">
              SEO Description
            </Label>
            <span className={cn(
              "text-[10px]",
              seoDescription.length > 160 ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {seoDescription.length || (seoResolved?.seo_description ? seoResolved.seo_description.length : (description ? stripHtml(description).length : 74))}/160 ký tự {!seoDescription && <span className="text-[9px] opacity-75">(tự sinh)</span>}
            </span>
          </div>
          <Textarea
            id="cat_seo_desc"
            value={seoDescription}
            disabled={disabled}
            onChange={(e) => onChange('seo_description', e.target.value)}
            placeholder={fallbackDesc}
            className="min-h-[72px] resize-none text-sm"
          />
        </div>

        {/* 3. SEO Keywords */}
        <div className="space-y-1.5">
          <Label htmlFor="cat_seo_keywords" className="text-xs font-semibold text-foreground/80">
            SEO Keywords
          </Label>
          <Input
            id="cat_seo_keywords"
            value={seoKeywords}
            disabled={disabled}
            onChange={(e) => onChange('seo_keywords', e.target.value)}
            placeholder={seoResolved?.seo_keywords || (name ? `${name}, Trường Kỹ thuật và Công nghệ...` : "từ khóa 1, từ khóa 2...")}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* ─── PHẦN 2: CẤU HÌNH SEO NÂNG CAO (COLLAPSE MẶC ĐỊNH ĐÓNG) ─── */}
      <div className="border border-border/80 rounded-lg overflow-hidden bg-muted/5">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Cấu hình SEO Nâng cao
          </span>
          {isAdvancedOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
          )}
        </button>

        <div
          className={cn(
            "transition-all duration-200 ease-in-out border-t border-border/50",
            isAdvancedOpen ? "block p-4 space-y-4" : "hidden"
          )}
        >
          {/* Canonical URL */}
          <div className="space-y-1.5">
            <Label htmlFor="cat_seo_canonical" className="text-xs font-semibold text-foreground/80">
              Canonical URL
            </Label>
            <Input
              id="cat_seo_canonical"
              value={seoCanonical}
              disabled={disabled}
              onChange={(e) => onChange('seo_canonical', e.target.value)}
              placeholder={seoResolved?.seo_canonical || "https://example.com/chuyen-muc-goc"}
              className="h-9 text-sm"
            />
            <p className="text-[10px] text-muted-foreground/70">
              Để trống hệ thống sẽ tự động sinh Canonical URL chuẩn.
            </p>
          </div>

          {/* Robots Meta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/80">
              Robots Meta
            </Label>
            <Select
              value={seoRobots || seoResolved?.seo_robots || 'index, follow'}
              onValueChange={(val) => onChange('seo_robots', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index, Follow (Mặc định)</SelectItem>
                <SelectItem value="noindex, follow">Noindex, Follow</SelectItem>
                <SelectItem value="index, nofollow">Index, Nofollow</SelectItem>
                <SelectItem value="noindex, nofollow">Noindex, Nofollow (Ẩn hoàn toàn)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/75 font-medium">
              ℹ Khuyến nghị giữ mặc định. Chỉ thay đổi khi hiểu về SEO.
            </p>
          </div>

          {/* Open Graph Image */}
          <div className="space-y-1.5 border-t pt-3">
            <Label className="text-xs font-semibold text-foreground/80">Open Graph Image (Social Image)</Label>
            
            <div className="flex gap-4 items-start">
              {/* Box Upload */}
              <div className="relative border border-border/80 rounded-lg aspect-video w-[160px] bg-muted/20 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors group">
                {ogImageUrl ? (
                  <>
                    <img src={ogImageUrl} alt="OG Image" className="w-full h-full object-cover" />
                    {!disabled && (
                      <button
                        type="button"
                        onClick={handleOgImageRemove}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-destructive p-1 rounded text-white transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => !disabled && ogInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-2 text-center cursor-pointer text-[10px] text-muted-foreground"
                    disabled={isUploadingOg || disabled}
                  >
                    {isUploadingOg ? (
                      <Loader2 className="h-4 w-4 animate-spin mb-1 text-primary" />
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mb-1" />
                        Tải ảnh SEO lên
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Status & Fallback Info */}
              <div className="text-[11px] text-muted-foreground space-y-1 flex-1 min-w-0">
                {ogImageUrl ? (
                  <p className="text-green-600 font-medium">✓ Đang sử dụng ảnh Open Graph tùy chỉnh.</p>
                ) : (
                  displayFallbackOgUrl ? (
                    <div className="space-y-1">
                      <p className="text-blue-600 font-semibold">ℹ Chưa chọn ảnh SEO tùy chỉnh.</p>
                      <p className="text-[10px] leading-relaxed">Hệ thống sẽ **tự động sử dụng ảnh gợi ý** làm ảnh hiển thị trên mạng xã hội:</p>
                      <div className="flex items-center gap-1.5 mt-1 border rounded p-1 bg-muted/10 w-fit max-w-full">
                        <img src={displayFallbackOgUrl} alt="Fallback SEO Image" className="w-16 h-10 object-cover rounded shrink-0 border" />
                        <span className="text-[9px] opacity-75 truncate">Ảnh mặc định (resolved)</span>
                      </div>
                    </div>
                  ) : (
                    <p>Chưa chọn ảnh SEO. Hệ thống sẽ tự động sử dụng **Banner mặc định của Website** làm Open Graph Image.</p>
                  )
                )}
              </div>
            </div>

            <input
              type="file"
              ref={ogInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleOgImageUpload}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
