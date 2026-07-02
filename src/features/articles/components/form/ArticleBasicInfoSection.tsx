import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Languages, Loader2 } from 'lucide-react'

interface ArticleBasicInfoSectionProps {
  title: string
  setTitle: (value: string) => void
  slug: string
  setSlug: (value: string) => void
  excerpt: string
  setExcerpt: (value: string) => void
  disabled?: boolean
  isCheckingSlug?: boolean
  errors?: { title?: string }

  // Props dịch nhanh
  showTranslateActions?: boolean
  onTranslateTitle?: () => void
  isTranslatingTitle?: boolean
  onTranslateExcerpt?: () => void
  isTranslatingExcerpt?: boolean
}

export function ArticleBasicInfoSection({
  title,
  setTitle,
  slug,
  setSlug,
  excerpt,
  setExcerpt,
  disabled = false,
  isCheckingSlug = false,
  errors,
  showTranslateActions = false,
  onTranslateTitle,
  isTranslatingTitle = false,
  onTranslateExcerpt,
  isTranslatingExcerpt = false,
}: ArticleBasicInfoSectionProps) {
  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Thông tin cơ bản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground flex items-center gap-1">
              Tiêu đề bài viết <span className="text-destructive">*</span>
            </Label>
            {showTranslateActions && onTranslateTitle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTranslateTitle}
                disabled={isTranslatingTitle || disabled}
                className="h-6 px-2 text-[10px] text-primary hover:bg-primary/5 cursor-pointer flex items-center gap-1 font-semibold border border-primary/20"
              >
                {isTranslatingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                <span>Dịch từ Tiếng Việt</span>
              </Button>
            )}
          </div>
          <Input
            id="title"
            placeholder="Nhập tiêu đề của bài viết..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled}
            maxLength={255}
            required
            className="h-10 text-sm"
          />
          {errors?.title && (
            <p className="text-xs text-destructive font-medium mt-1 animate-fade-in">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="slug" className="text-xs font-semibold text-foreground">
              Đường dẫn (Slug)
            </Label>
            {isCheckingSlug && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Đang kiểm tra trùng...
              </span>
            )}
          </div>
          <Input
            id="slug"
            placeholder={isCheckingSlug ? 'Đang tạo và kiểm tra đường dẫn tự động...' : 'Đường dẫn tự động sinh từ tiêu đề...'}
            value={slug}
            disabled={true}
            maxLength={255}
            className="h-10 text-sm font-mono bg-muted/50 cursor-not-allowed opacity-90"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="excerpt" className="text-xs font-semibold text-foreground">
              Tóm tắt ngắn (Excerpt)
            </Label>
            {showTranslateActions && onTranslateExcerpt && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTranslateExcerpt}
                disabled={isTranslatingExcerpt || disabled}
                className="h-6 px-2 text-[10px] text-primary hover:bg-primary/5 cursor-pointer flex items-center gap-1 font-semibold border border-primary/20"
              >
                {isTranslatingExcerpt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                <span>Dịch từ Tiếng Việt</span>
              </Button>
            )}
          </div>
          <Textarea
            id="excerpt"
            placeholder="Nhập đoạn giới thiệu/tóm tắt ngắn gọn của bài viết..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            disabled={disabled}
            className="min-h-20 text-sm resize-none"
            maxLength={500}
          />
        </div>
      </CardContent>
    </Card>
  )
}
