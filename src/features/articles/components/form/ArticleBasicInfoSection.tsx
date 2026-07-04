import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Languages, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { articleService } from '../../services/articleService'

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

  // Props cho AI Summarize
  articleId: string | null
  content: string
  lang: 'vi' | 'en'
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
  articleId,
  content,
  lang,
}: ArticleBasicInfoSectionProps) {
  const [isSummarizing, setIsSummarizing] = useState(false)

  const handleSummarize = async () => {
    if (!content.trim()) {
      toast.error('Nội dung bài viết hiện đang trống. Vui lòng viết nội dung trước khi tóm tắt.')
      return
    }

    setIsSummarizing(true)
    const toastId = toast.loading('AI đang phân tích và tóm tắt bài viết của bạn...')
    const targetId = articleId || (crypto.randomUUID ? crypto.randomUUID() : 'f47ac10b-58cc-4372-a567-0e02b2c3d479')

    try {
      const res = await articleService.seoSummarize(targetId, {
        content: content.trim(),
        max_length: 150,
        lang,
      })
      setExcerpt(res.summary)
      toast.success('Tóm tắt bài viết bằng AI thành công!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.error?.message || 'Tóm tắt bài viết thất bại. Vui lòng thử lại.', { id: toastId })
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <Card className="bg-card text-card-foreground text-left">
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
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSummarize}
                disabled={isSummarizing || disabled || !content.trim()}
                className="h-6 px-2 text-[10px] text-purple-600 dark:text-purple-400 hover:bg-purple-500/5 cursor-pointer flex items-center gap-1 font-semibold border border-purple-500/20"
                title="Sử dụng AI tự động tóm tắt từ nội dung bài viết dài"
              >
                {isSummarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 animate-pulse" />}
                <span>Tóm tắt bằng AI</span>
              </Button>

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
