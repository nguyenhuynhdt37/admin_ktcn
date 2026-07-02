import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { ChevronDown, Globe, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { httpClient } from '@/services/http/client'
import { toast } from 'sonner'
import { SEO_CONFIG } from '../../constants'
import { cleanHtml, generateSeoTitle, generateSeoDescription } from '@/shared/utils/seo'

// Helpers
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

interface ArticleSeoSectionProps {
  title: string
  slug: string
  content: string
  excerpt: string
  categoryName?: string

  seoTitle: string
  setSeoTitle: (value: string) => void
  seoDescription: string
  setSeoDescription: (value: string) => void
  canonicalUrl: string
  setCanonicalUrl: (value: string) => void
  robots: string
  setRobots: (value: string) => void
  ogTitle: string
  setOgTitle: (value: string) => void
  ogDescription: string
  setOgDescription: (value: string) => void
  disabled?: boolean

  // Cờ override thủ công
  isSeoTitleOverridden: boolean
  setIsSeoTitleOverridden: (value: boolean) => void
  isSeoDescriptionOverridden: boolean
  setIsSeoDescriptionOverridden: (value: boolean) => void
}

export function ArticleSeoSection({
  title,
  slug,
  content,
  excerpt,
  categoryName = 'tin-tuc',

  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  canonicalUrl,
  setCanonicalUrl,
  robots,
  setRobots,
  ogTitle,
  setOgTitle,
  ogDescription,
  setOgDescription,
  disabled = false,

  isSeoTitleOverridden,
  setIsSeoTitleOverridden,
  isSeoDescriptionOverridden,
  setIsSeoDescriptionOverridden,
}: ArticleSeoSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const maxTitleLength = Math.max(0, SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH - SEO_CONFIG.SUFFIX.length)

  // Render Title và Description thực tế hiển thị trên Google SERP Preview
  const displayTitle = (seoTitle.trim() || generateSeoTitle(title) || 'Tiêu đề bài viết') + SEO_CONFIG.SUFFIX
  const displayDesc = seoDescription.trim() || generateSeoDescription(content, excerpt) || 'Mô tả chi tiết bài viết...'

  // Bộ đếm ký tự
  const titleCharCount = displayTitle.length
  const descCharCount = displayDesc.length

  return (
    <Card className="bg-card text-card-foreground">
      {/* Google SERP Preview (Always Open) */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-primary" />
            Cấu hình SEO Cơ bản
          </h3>
        </div>

        {/* Live Google Search Preview Card */}
        <div className="bg-background border rounded-lg p-4 space-y-1 text-left shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
            Xem trước trên Google
          </div>
          <div className="text-[#1a0dab] hover:underline text-[16px] leading-[20px] font-medium truncate">
            {displayTitle}
          </div>
          <div className="text-[#006621] text-[12px] leading-[16px] truncate flex items-center gap-1">
            {canonicalUrl.trim() || `https://kcnt.vinhuni.edu.vn/articles/${slug || 'bai-viet'}`}
          </div>
          <div className="text-[#545454] text-[13px] leading-[18px] line-clamp-2">
            {displayDesc}
          </div>
        </div>

        {/* Basic SEO inputs */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="seoTitle" className="text-xs font-semibold text-foreground/80">
                Tiêu đề SEO (seo_title)
              </Label>
              <span
                className={cn(
                  'text-[10px]',
                  titleCharCount > SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH ? 'text-destructive font-semibold' : 'text-muted-foreground'
                )}
              >
                {titleCharCount}/{SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH} ký tự (tự sinh)
              </span>
            </div>
            <Input
              id="seoTitle"
              placeholder="Nhập tiêu đề SEO..."
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              disabled={true}
              maxLength={maxTitleLength}
              className="h-10 text-sm bg-muted/30 cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground/60 leading-normal">
              Hệ thống sẽ tự động ghép thêm hậu tố thương hiệu "{SEO_CONFIG.SUFFIX}" khi hiển thị.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="seoDescription" className="text-xs font-semibold text-foreground/80">
                Mô tả SEO (seo_description)
              </Label>
              <span
                className={cn(
                  'text-[10px]',
                  descCharCount > SEO_CONFIG.MAX_DESCRIPTION_LENGTH ? 'text-destructive font-semibold' : 'text-muted-foreground'
                )}
              >
                {descCharCount}/{SEO_CONFIG.MAX_DESCRIPTION_LENGTH} ký tự (tự sinh)
              </span>
            </div>
            <Textarea
              id="seoDescription"
              placeholder="Nhập đoạn trích ngắn cho công cụ tìm kiếm..."
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              disabled={true}
              className="min-h-20 text-sm resize-none bg-muted/30 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Advanced Accordion section */}
      <div className="border-t border-border/40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer focus:outline-hidden"
        >
          <span>TÙY CHỌN SEO NÂNG CAO & OPEN GRAPH</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div className="p-5 pt-0 space-y-4 animate-fade-in border-t border-border/20 bg-muted/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Search Engines settings */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="canonicalUrl" className="text-[11px] font-semibold text-foreground">
                    Đường dẫn gốc (canonical_url)
                  </Label>
                  <Input
                    id="canonicalUrl"
                    type="url"
                    placeholder="https://example.com/goc"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    disabled={disabled}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="robots" className="text-[11px] font-semibold text-foreground">
                    Cấu hình Robots (robots)
                  </Label>
                  <Select value={robots} onValueChange={setRobots} disabled={true}>
                    <SelectTrigger id="robots" className="h-9 text-xs cursor-not-allowed bg-muted/30">
                      <SelectValue placeholder="Mặc định: index, follow" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="index, follow" className="cursor-pointer">
                        index, follow (Google index)
                      </SelectItem>
                      <SelectItem value="noindex, nofollow" className="cursor-pointer">
                        noindex, nofollow (Chặn Google index)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Open Graph settings */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ogTitle" className="text-[11px] font-semibold text-foreground">
                    Tiêu đề OpenGraph (og_title)
                  </Label>
                  <Input
                    id="ogTitle"
                    placeholder="Tiêu đề hiển thị khi share Facebook/Zalo..."
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    disabled={true}
                    className="h-9 text-xs bg-muted/30 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ogDescription" className="text-[11px] font-semibold text-foreground">
                    Mô tả OpenGraph (og_description)
                  </Label>
                  <Textarea
                    id="ogDescription"
                    placeholder="Mô tả tóm tắt khi share Facebook/Zalo..."
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    disabled={true}
                    className="min-h-16 text-xs resize-none bg-muted/30 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
