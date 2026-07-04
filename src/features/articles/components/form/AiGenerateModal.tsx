import { useState, useEffect } from 'react'
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
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { articleService } from '../../services/articleService'
import type { ArticleGenerateByIdeaResponse } from '../../types/articles.types'

interface AiGenerateModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerateSuccess: (data: ArticleGenerateByIdeaResponse, targetLang: 'vi' | 'en') => void
}

const LOADING_QUOTES = [
  'Đang phác thảo cấu trúc bài viết từ ý tưởng của bạn...',
  'Đang xây dựng tiêu đề cuốn hút và tối ưu SEO...',
  'Đang phát triển nội dung chi tiết theo văn phong mong muốn...',
  'Đang chèn từ khóa chính một cách tự nhiên...',
  'Đang tự động cấu hình các thông số SEO Meta và liên kết hình ảnh...',
  'Chuẩn bị hoàn thành bài viết chất lượng cao...',
]

export function AiGenerateModal({
  isOpen,
  onClose,
  onGenerateSuccess,
}: AiGenerateModalProps) {
  const [idea, setIdea] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [tone, setTone] = useState<string>('chuyên nghiệp')
  const [targetLang, setTargetLang] = useState<'vi' | 'en'>('vi')
  
  const [isLoading, setIsLoading] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Hiệu ứng chạy quotes giả lập khi loading lâu
  useEffect(() => {
    let quoteInterval: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout

    if (isLoading) {
      setProgress(0)
      setQuoteIndex(0)
      
      quoteInterval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length)
      }, 4000)

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95 // Dừng ở 95% đợi API trả về
          return prev + 1
        })
      }, 200)
    }

    return () => {
      clearInterval(quoteInterval)
      clearInterval(progressInterval)
    }
  }, [isLoading])

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast.error('Vui lòng nhập mô tả ý tưởng hoặc dàn ý thô.')
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('AI đang phân tích ý tưởng và soạn thảo toàn bộ bài viết...')

    try {
      const res = await articleService.generateByIdea({
        idea: idea.trim(),
        focus_keyword: focusKeyword.trim() || null,
        tone,
        lang: targetLang,
      })

      setProgress(100)
      setTimeout(() => {
        onGenerateSuccess(res, targetLang)
        toast.success('Đã sinh bài viết và áp dụng vào form thành công!', { id: toastId })
        // Clear form
        setIdea('')
        setFocusKeyword('')
        onClose()
      }, 500)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.error?.message || 'Không thể sinh bài viết lúc này. Vui lòng thử lại.', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val && !isLoading) onClose() }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Soạn bài viết bằng AI (AI Generate from Idea)</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Chỉ với một ý tưởng hoặc dàn ý ngắn, AI sẽ tự động sinh tiêu đề, tóm tắt, nội dung soạn thảo HTML đầy đủ, slug và cấu hình SEO tối ưu.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative h-16 w-16 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              <Sparkles className="absolute h-5 w-5 text-amber-500 top-0 right-0 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-semibold text-purple-600 animate-pulse">
                {LOADING_QUOTES[quoteIndex]}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Quá trình này có thể mất từ 15 - 30 giây. Vui lòng không đóng cửa sổ.
              </p>
            </div>

            {/* Progress Bar giả lập */}
            <div className="w-full max-w-xs bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{progress}%</span>
          </div>
        ) : (
          <div className="space-y-4 py-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="generateIdea" className="text-xs font-semibold text-foreground/80">
                Mô tả ý tưởng / Dàn ý thô của bài viết <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="generateIdea"
                placeholder="Ví dụ: Khai giảng lớp học võ cổ truyền Việt Nam miễn phí hè 2026 cho trẻ em tại trường Tiểu học Vĩnh Sơn để rèn luyện kỹ năng thoát hiểm."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                className="text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="generateFocusKeyword" className="text-xs font-semibold text-foreground/80">
                  Từ khóa chính mong muốn (Focus Keyword)
                </Label>
                <Input
                  id="generateFocusKeyword"
                  placeholder="Ví dụ: võ cổ truyền Việt Nam"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="generateTone" className="text-xs font-semibold text-foreground/80">
                  Tone giọng / Văn phong
                </Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="generateTone" className="h-9 text-xs">
                    <SelectValue placeholder="Chọn tone giọng" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="chuyên nghiệp" className="cursor-pointer">Chuyên nghiệp (Trang trọng, chuẩn mực)</SelectItem>
                    <SelectItem value="thuyết phục" className="cursor-pointer">Thuyết phục (Cuốn hút, kêu gọi)</SelectItem>
                    <SelectItem value="sáng tạo" className="cursor-pointer">Sáng tạo (Trẻ trung, năng động)</SelectItem>
                    <SelectItem value="học thuật" className="cursor-pointer">Học thuật (Tin khoa học, nghiên cứu)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="generateLang" className="text-xs font-semibold text-foreground/80">
                Ngôn ngữ đích (Đổ dữ liệu vào Form)
              </Label>
              <Select value={targetLang} onValueChange={(val: 'vi' | 'en') => setTargetLang(val)}>
                <SelectTrigger id="generateLang" className="h-9 text-xs">
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="vi" className="cursor-pointer">Tiếng Việt (Tab Tiếng Việt)</SelectItem>
                  <SelectItem value="en" className="cursor-pointer">Tiếng Anh (Tab Tiếng Anh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!isLoading && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              >
                <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
                Sinh bài viết
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
