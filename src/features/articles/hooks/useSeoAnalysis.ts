import { useState } from 'react'
import { toast } from 'sonner'
import { articleService } from '../services/articleService'
import type { SeoAnalysisResponse } from '../types/articles.types'

interface UseSeoAnalysisProps {
  articleId: string | null
  title: string
  slug: string
  content: string
  excerpt: string
  seoTitle: string
  setSeoTitle: (val: string) => void
  setIsSeoTitleOverridden: (val: boolean) => void
  seoDescription: string
  setSeoDescription: (val: string) => void
  setIsSeoDescriptionOverridden: (val: boolean) => void
  focusKeyword: string
  lang: 'vi' | 'en'
  thumbnailKey: string | null
}

export function useSeoAnalysis({
  articleId,
  title,
  slug,
  content,
  excerpt,
  seoTitle,
  setSeoTitle,
  setIsSeoTitleOverridden,
  seoDescription,
  setSeoDescription,
  setIsSeoDescriptionOverridden,
  focusKeyword,
  lang,
  thumbnailKey,
}: UseSeoAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<SeoAnalysisResponse | null>(null)
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null)
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(true)

  const handleAnalyze = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề bài viết trước khi phân tích.')
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('AI đang phân tích SEO bài viết của bạn...')
    const targetId = articleId || (crypto.randomUUID ? crypto.randomUUID() : 'f47ac10b-58cc-4372-a567-0e02b2c3d479')

    try {
      const response = await articleService.analyzeSeo(targetId, {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        focus_keyword: focusKeyword.trim() || null,
        lang,
        thumbnail_object_key: thumbnailKey,
        slug: slug.trim() || null,
      })
      setAnalysis(response)
      toast.success('Phân tích SEO thành công!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(
        err?.response?.data?.error?.message || 'Phân tích SEO thất bại. Vui lòng thử lại.',
        { id: toastId }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyTitle = (generatedTitle: string) => {
    if (!generatedTitle) return
    setIsSeoTitleOverridden(true)
    setSeoTitle(generatedTitle)
    toast.success('Đã áp dụng Tiêu đề SEO từ AI.')
  }

  const handleApplyDescription = (generatedDesc: string) => {
    if (!generatedDesc) return
    setIsSeoDescriptionOverridden(true)
    setSeoDescription(generatedDesc)
    toast.success('Đã áp dụng Mô tả SEO từ AI.')
  }

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url)
    setCopiedLinkIndex(index)
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!')
    setTimeout(() => setCopiedLinkIndex(null), 2000)
  }

  const getStatusConfig = (status: string, score: number) => {
    if (score >= 80 || status === 'good') {
      return {
        color: 'text-emerald-500',
        stroke: 'stroke-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        border: 'border-emerald-200/50 dark:border-emerald-900/30',
        label: 'Tốt',
      }
    } else if (score >= 50 || status === 'warning') {
      return {
        color: 'text-amber-500',
        stroke: 'stroke-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/10',
        border: 'border-amber-200/50 dark:border-amber-900/30',
        label: 'Cần cải thiện',
      }
    } else {
      return {
        color: 'text-rose-500',
        stroke: 'stroke-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/10',
        border: 'border-rose-200/50 dark:border-rose-900/30',
        label: 'Kém',
      }
    }
  }

  return {
    isLoading,
    analysis,
    copiedLinkIndex,
    isIssuesExpanded,
    setIsIssuesExpanded,
    handleAnalyze,
    handleApplyTitle,
    handleApplyDescription,
    handleCopyLink,
    getStatusConfig,
  }
}
