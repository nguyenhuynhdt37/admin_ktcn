/* eslint-disable */
import { useState } from 'react'
import { Globe, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/lib/utils'

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

interface SEOResolved {
  seo_title: string
  seo_description: string
  seo_og_image_url: string | null
}

interface CategorySEOSectionProps {
  name: string
  description: string
  // Form states
  seoTitle: string
  seoDescription: string
  seoResolved?: SEOResolved
}

export function CategorySEOSection({
  name,
  description,
  seoTitle,
  seoDescription,
  seoResolved,
}: CategorySEOSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const fallbackTitle = seoResolved?.seo_title || `${name || 'Tên danh mục'} | Trường Kỹ thuật và Công nghệ - Đại học Vinh`
  const fallbackDesc = seoResolved?.seo_description || (description ? description.slice(0, 155) : "Mô tả mặc định của website...")

  return (
    <div className="border border-border/80 rounded-lg overflow-hidden bg-muted/5">
      {/* Nút Toggle Collapse */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Cấu hình SEO tự động (Advanced SEO)
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Nội dung cấu hình SEO */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out border-t border-border/50 p-4 space-y-4",
          isOpen ? "block" : "hidden"
        )}
      >
        {/* Google SERP Preview */}
        <div className="bg-background border rounded-lg p-3 space-y-1 text-left shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Xem trước trên Google</div>
          <div className="text-[#1a0dab] hover:underline text-[16px] leading-[20px] font-medium truncate">
            {seoTitle.trim() || fallbackTitle}
          </div>
          <div className="text-[#006621] text-[12px] leading-[16px] truncate flex items-center gap-1">
            {`https://kcnt.vinhuni.edu.vn/${name ? generateSlug(name) : 'danh-muc'}`}
          </div>
          <div className="text-[#545454] text-[13px] leading-[18px] line-clamp-2">
            {seoDescription.trim() || fallbackDesc}
          </div>
        </div>

        {/* 1. SEO Title */}
        <div className="space-y-1.5 opacity-80">
          <div className="flex justify-between items-center">
            <Label htmlFor="cat_seo_title" className="text-xs font-semibold text-foreground/80">
              SEO Title (Xem trước)
            </Label>
            <span className="text-[10px] text-muted-foreground">
              {seoTitle.length || 0}/60 ký tự
            </span>
          </div>
          <Input
            id="cat_seo_title"
            value={seoTitle}
            disabled={true}
            placeholder={fallbackTitle}
            className="h-9 text-sm bg-muted/30 cursor-not-allowed select-none"
          />
        </div>

        {/* 2. SEO Description */}
        <div className="space-y-1.5 opacity-80">
          <div className="flex justify-between items-center">
            <Label htmlFor="cat_seo_desc" className="text-xs font-semibold text-foreground/80">
              SEO Description (Xem trước)
            </Label>
            <span className="text-[10px] text-muted-foreground">
              {seoDescription.length || 0}/160 ký tự
            </span>
          </div>
          <Textarea
            id="cat_seo_desc"
            value={seoDescription}
            disabled={true}
            placeholder={fallbackDesc}
            className="min-h-[72px] resize-none text-sm bg-muted/30 cursor-not-allowed select-none"
          />
        </div>
      </div>
    </div>
  )
}
