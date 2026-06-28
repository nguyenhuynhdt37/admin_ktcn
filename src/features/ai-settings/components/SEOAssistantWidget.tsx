import React, { useState } from 'react'
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useMutation, useQuery } from '@tanstack/react-query'
import { aiSettingsService } from '../services/aiSettingsService'
import type { SEOGenerateResponse } from '../types'
import { toast } from 'sonner'

interface SEOAssistantWidgetProps {
  title: string
  description: string
  content?: string
  onSEOGenerated: (data: SEOGenerateResponse) => void
}

export function SEOAssistantWidget({ title, description, content, onSEOGenerated }: SEOAssistantWidgetProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 1. Kiểm tra trạng thái AI xem có được bật không
  const { data: aiSettings } = useQuery({
    queryKey: ['ai-settings', 'text'],
    queryFn: () => aiSettingsService.getSettings('text'),
    staleTime: 5 * 60 * 1000, // 5 phút cache
  })

  // 2. Mutation gọi AI sinh SEO
  const generateSEOMutation = useMutation({
    mutationFn: aiSettingsService.generateSEO,
    onSuccess: (data) => {
      setErrorMessage(null)
      onSEOGenerated(data) // Đổ dữ liệu Preview ra form
      toast.success('Đã tối ưu hóa SEO thành công bằng AI!')
    },
    onError: (err: any) => {
      const errResponse = err?.response?.data
      const errCode = errResponse?.error?.code || errResponse?.detail?.code
      const errMsg = errResponse?.error?.message || errResponse?.detail?.message || errResponse?.detail

      if (errCode === 'AI_BUDGET_EXCEEDED') {
        setErrorMessage(
          'Ngân sách sử dụng AI hàng tháng của hệ thống đã cạn kiệt. Vui lòng liên hệ Quản trị viên để nâng hạn mức.'
        )
      } else if (errCode === 'AI_DISABLED') {
        setErrorMessage('Tính năng trợ lý AI hiện đang bị vô hiệu hóa trong hệ thống.')
      } else {
        setErrorMessage(
          typeof errMsg === 'string' 
            ? errMsg 
            : 'Gọi trợ lý AI thất bại. Vui lòng kiểm tra lại cấu hình API hoặc thử lại sau.'
        )
      }
    },
  })

  const handleGenerate = () => {
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập Tên danh mục hoặc Tiêu đề bài viết trước khi sinh SEO.')
      return
    }
    setErrorMessage(null)
    generateSEOMutation.mutate({
      title: title.trim(),
      description: description?.trim() || '',
      content: content?.trim() || '',
    })
  }

  const isApiKeyConfigured = aiSettings?.api_key_masked !== null

  // 3. Nếu AI bị tắt toàn hệ thống, không hiển thị nút bấm
  if (aiSettings && !aiSettings.is_enabled) {
    return null
  }

  return (
    <div className="space-y-3 w-full border border-dashed border-indigo-200/60 rounded-xl p-3 bg-indigo-50/20 dark:bg-indigo-950/5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
          <Sparkles className="h-4 w-4 text-indigo-500 fill-indigo-100 dark:fill-indigo-950 animate-pulse" />
          <span>Trợ lý Tối ưu SEO bằng AI (Gemini)</span>
        </div>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={generateSEOMutation.isPending || !isApiKeyConfigured}
          variant="outline"
          className={`h-8 text-xs font-medium border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950 transition-all duration-200 flex items-center gap-1.5 ${
            !isApiKeyConfigured ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title={!isApiKeyConfigured ? 'Vui lòng cấu hình API Key AI trong phần cài đặt hệ thống trước khi sử dụng.' : 'Tự động sinh SEO bằng AI'}
        >
          {generateSEOMutation.isPending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-indigo-600 dark:text-indigo-400" />
              Đang sinh SEO...
            </>
          ) : (
            <>
              ✨ Tự động sinh bằng AI
            </>
          )}
        </Button>
      </div>

      {!isApiKeyConfigured && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200 leading-normal font-medium dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">API Key AI chưa được cấu hình</p>
            <p className="text-[11px] opacity-90">Vui lòng cấu hình Google Gemini API Key trong menu quản trị hệ thống để sử dụng trợ lý AI SEO.</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20 leading-normal font-medium">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Lỗi phản hồi trợ lý AI</p>
            <p className="text-[11px] opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}
