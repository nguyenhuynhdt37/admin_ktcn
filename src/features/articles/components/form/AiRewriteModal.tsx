import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Sparkles, Loader2, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { articleService } from '../../services/articleService'

interface AiRewriteModalProps {
  isOpen: boolean
  onClose: () => void
  articleId: string | null
  currentContent: string
  defaultFocusKeyword: string
  lang: 'vi' | 'en'
  onApply: (newContent: string) => void
}

export function AiRewriteModal({
  isOpen,
  onClose,
  articleId,
  currentContent,
  defaultFocusKeyword,
  lang,
  onApply,
}: AiRewriteModalProps) {
  const [focusKeyword, setFocusKeyword] = useState(defaultFocusKeyword)
  const [tone, setTone] = useState<string>('chuyên nghiệp')
  const [isLoading, setIsLoading] = useState(false)
  const [rewrittenContent, setRewrittenContent] = useState<string | null>(null)

  const handleRewrite = async () => {
    if (!currentContent.trim()) {
      toast.error('Nội dung hiện tại trống, vui lòng viết nội dung trước khi tối ưu.')
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('AI đang tối ưu hóa và viết lại nội dung của bạn...')
    const targetId = articleId || (crypto.randomUUID ? crypto.randomUUID() : 'f47ac10b-58cc-4372-a567-0e02b2c3d479')

    try {
      const res = await articleService.seoRewrite(targetId, {
        content: currentContent,
        focus_keyword: focusKeyword.trim() || null,
        tone,
        lang,
      })

      setRewrittenContent(res.content)
      toast.success('Đã tối ưu hóa nội dung thành công!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.error?.message || 'Không thể tối ưu hóa nội dung lúc này.', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (rewrittenContent) {
      onApply(rewrittenContent)
      toast.success('Đã áp dụng nội dung tối ưu hóa mới!')
      setRewrittenContent(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val && !isLoading) onClose() }}>
      <DialogContent className={rewrittenContent ? "max-w-4xl w-full" : "max-w-md w-full"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Tối ưu hóa bài viết bằng AI (SEO Rewrite)</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hệ thống AI sẽ viết lại, nâng cao chất lượng văn phong và phân bổ từ khóa chính một cách tự nhiên (Hình ảnh Base64 được bảo toàn nguyên vẹn).
          </DialogDescription>
        </DialogHeader>

        {!rewrittenContent ? (
          <div className="space-y-4 py-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="rewriteFocusKeyword" className="text-xs font-semibold text-foreground/80">
                Từ khóa chính cần chèn (Focus Keyword)
              </Label>
              <Input
                id="rewriteFocusKeyword"
                placeholder="Nhập từ khóa chính để AI chèn tự nhiên..."
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                disabled={isLoading}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rewriteTone" className="text-xs font-semibold text-foreground/80">
                Tone giọng / Văn phong
              </Label>
              <Select value={tone} onValueChange={setTone} disabled={isLoading}>
                <SelectTrigger id="rewriteTone" className="h-9 text-xs">
                  <SelectValue placeholder="Chọn tone giọng" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="chuyên nghiệp" className="cursor-pointer">Chuyên nghiệp (Trang trọng, chuẩn mực)</SelectItem>
                  <SelectItem value="thuyết phục" className="cursor-pointer">Thuyết phục (Cuốn hút, kêu gọi hành động)</SelectItem>
                  <SelectItem value="sáng tạo" className="cursor-pointer">Sáng tạo (Trẻ trung, năng động)</SelectItem>
                  <SelectItem value="học thuật" className="cursor-pointer">Học thuật (Nghiêm túc, nghiên cứu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[450px] overflow-hidden text-left">
            <div className="flex flex-col space-y-1.5 border rounded-lg p-3 bg-muted/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nội dung ban đầu</span>
              <div 
                className="flex-1 overflow-y-auto pr-1 text-xs leading-relaxed space-y-2 max-h-[350px] select-all prose dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: currentContent }}
              />
            </div>

            <div className="flex flex-col space-y-1.5 border border-purple-500/20 rounded-lg p-3 bg-purple-500/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Nội dung đã tối ưu từ AI
              </span>
              <div 
                className="flex-1 overflow-y-auto pr-1 text-xs leading-relaxed space-y-2 max-h-[350px] select-all prose dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: rewrittenContent }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!rewrittenContent ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="cursor-pointer">
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRewrite}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Đang viết lại...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Bắt đầu tối ưu
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setRewrittenContent(null)} 
                disabled={isLoading}
                className="cursor-pointer mr-auto"
              >
                Quay lại thiết lập
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={onClose} 
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Áp dụng nội dung mới
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
