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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRewriteOpen, setIsRewriteOpen] = useState(false)

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsFullscreen(false)
  }, [])

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isFullscreen, handleEsc])

  // Inline editor layout
  const inlineEditor = (
    <Card className="bg-card text-card-foreground text-left">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Nội dung bài viết</CardTitle>
          <CardDescription className="text-xs">Soạn thảo chi tiết nội dung hiển thị của bài viết tin tức.</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Phóng to</span>
        </Button>
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
  )

  // Fullscreen overlay layout
  const fullscreenEditor = isFullscreen ? (
    <div className="fixed inset-0 z-50 bg-background flex flex-col text-left">
      {/* Fullscreen Header */}
      <div className="flex items-center justify-between border-b px-6 py-3 bg-card shrink-0">
        <div>
          <h2 className="text-base font-semibold text-foreground">Nội dung bài viết (Toàn màn hình)</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Esc</kbd> hoặc nút Thu nhỏ để thoát chế độ toàn màn hình
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsRewriteOpen(true)}
            disabled={disabled || !content.trim()}
            className="gap-1.5 cursor-pointer text-xs text-purple-600 border-purple-500/30 hover:bg-purple-500/5 font-semibold"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Tối ưu bằng AI (Rewrite)
          </Button>

          {showTranslateActions && onTranslateContent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTranslateContent}
              disabled={isTranslatingContent || disabled}
              className="gap-1.5 cursor-pointer text-xs text-primary border-primary/30 hover:bg-primary/5"
            >
              {isTranslatingContent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-4 w-4" />}
              Dịch từ Tiếng Việt
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="gap-1.5 cursor-pointer"
          >
            <Minimize2 className="h-4 w-4" />
            Thu nhỏ
          </Button>
        </div>
      </div>

      {/* Editor container taking full space */}
      <div className="flex-1 overflow-hidden p-6 bg-background ck-editor-fullscreen">
        <CmsEditor
          value={content}
          onChange={setContent}
          disabled={disabled}
          placeholder="Viết nội dung bài viết ở đây..."
          minHeight={450}
          maxHeight={9999}
        />
      </div>
    </div>
  ) : null

  return (
    <>
      {inlineEditor}
      {fullscreenEditor}

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
