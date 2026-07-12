import { useState } from 'react'
import { toast } from 'sonner'
import { departmentService } from '../services/departmentService'
import type { DepartmentSeoAnalysisResponse } from '../types'

interface UseDepartmentSeoAnalysisProps {
  departmentId: string | null
  lang: 'vi' | 'en'
}

export function useDepartmentSeoAnalysis({
  departmentId,
  lang,
}: UseDepartmentSeoAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<DepartmentSeoAnalysisResponse | null>(null)
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null)
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(true)
  const [focusKeyword, setFocusKeyword] = useState('')

  const handleAnalyze = async (formValues: {
    name: string
    description: string
    mission: string
    vision: string
    history: string
    research_overview: string
    seo_title: string
    seo_description: string
    thumbnail_object_key: string
    logo_object_key: string
    banner_object_key: string
    slug?: string
  }) => {
    if (!formValues.name.trim()) {
      toast.error('Vui lòng nhập Tên bộ môn trước khi phân tích.')
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('AI đang phân tích SEO trang bộ môn...')
    const targetId = departmentId || (crypto.randomUUID ? crypto.randomUUID() : 'f47ac10b-58cc-4372-a567-0e02b2c3d479')

    try {
      const response = await departmentService.analyzeSeo(targetId, {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || '',
        mission: formValues.mission?.trim() || '',
        vision: formValues.vision?.trim() || '',
        history: formValues.history?.trim() || '',
        research_overview: formValues.research_overview?.trim() || '',
        seo_title: formValues.seo_title?.trim() || null,
        seo_description: formValues.seo_description?.trim() || null,
        focus_keyword: focusKeyword.trim() || null,
        thumbnail_object_key: formValues.thumbnail_object_key || null,
        logo_object_key: formValues.logo_object_key || null,
        banner_object_key: formValues.banner_object_key || null,
        slug: formValues.slug?.trim() || null,
        lang,
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
    focusKeyword,
    setFocusKeyword,
    handleAnalyze,
    handleCopyLink,
    getStatusConfig,
  }
}
