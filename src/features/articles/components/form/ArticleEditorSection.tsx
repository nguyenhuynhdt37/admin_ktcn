import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { CmsEditor } from '@/shared/components/CmsEditor'
import { Maximize2, Minimize2, Languages, Loader2, Sparkles } from 'lucide-react'
import { AiRewriteModal } from './AiRewriteModal'

interface ArticleEditorSectionProps {
  content: string
  setContent: (value: string) => void
  disabled?: boolean
  errors?: { content?: string }

  // Props dịch nhanh
  showTranslateActions?: boolean
  onTranslateContent?: () => void
  isTranslatingContent?: boolean

  // Props phục vụ AI SEO Rewrite
  articleId: string | null
  focusKeyword: string
  lang: 'vi' | 'en'
}

export function ArticleEditorSection({
  content,
  setContent,
  disabled = false,
  errors,
  showTranslateActions = false,
  onTranslateContent,
  isTranslatingContent = false,
  articleId,
  focusKeyword,
  lang,
}: ArticleEditorSectionProps) {
  const [isRewriteOpen, setIsRewriteOpen] = useState(false)

  return (
    <>
      <Card className="bg-card text-card-foreground text-left">
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Nội dung bài viết</CardTitle>
            <CardDescription className="text-xs">Soạn thảo chi tiết nội dung hiển thị của bài viết tin tức.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs font-semibold text-foreground">
              Chi tiết nội dung
            </Label>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRewriteOpen(true)}
                disabled={disabled || !content.trim()}
                className="h-6 px-2 text-[10px] text-purple-600 dark:text-purple-400 hover:bg-purple-500/5 cursor-pointer flex items-center gap-1 font-semibold border border-purple-500/20"
                title="Sử dụng AI tối ưu hóa và viết lại nội dung"
              >
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>Tối ưu bằng AI (Rewrite)</span>
              </Button>

              {showTranslateActions && onTranslateContent && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onTranslateContent}
                  disabled={isTranslatingContent || disabled}
                  className="h-6 px-2 text-[10px] text-primary hover:bg-primary/5 cursor-pointer flex items-center gap-1 font-semibold border border-primary/20"
                >
                  {isTranslatingContent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  <span>Dịch từ Tiếng Việt</span>
                </Button>
              )}
            </div>
          </div>
          <CmsEditor
            value={content}
            onChange={setContent}
            disabled={disabled}
            placeholder="Viết nội dung bài viết ở đây..."
            minHeight={300}
            maxHeight={500}
          />
          {errors?.content && (
            <p className="text-xs text-destructive font-medium mt-1 animate-fade-in">{errors.content}</p>
          )}
        </CardContent>
      </Card>

      <AiRewriteModal
        isOpen={isRewriteOpen}
        onClose={() => setIsRewriteOpen(false)}
        articleId={articleId}
        currentContent={content}
        defaultFocusKeyword={focusKeyword}
        lang={lang}
        onApply={setContent}
      />
    </>
  )
}
