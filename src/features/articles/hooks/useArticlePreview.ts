import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { articleService } from '../services/articleService'
import { getMediaUrl } from '../utils/media'
import { SEO_CONFIG } from '../constants'

export type PreviewLang = 'vi' | 'en'

export interface DisplayData {
  title: string
  slug: string
  excerpt: string
  content: string
  seo_title: string
  seo_description: string
  canonical_url: string
  robots: string
  og_title: string
  og_description: string
}

export interface SeoAnalysis {
  finalTitle: string
  finalDescription: string
  titleLength: number
  descriptionLength: number
  maxTitleLength: number
  maxDescriptionLength: number
  isTitleOverLimit: boolean
  isDescOverLimit: boolean
  robots: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
}

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80'

export function useArticlePreview() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<PreviewLang>('vi')
  const { user } = useAuthStore()

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['articles', id],
    queryFn: () => articleService.getDetail(id!),
    enabled: !!id,
  })

  // Xác định xem người dùng hiện tại có phải tác giả hay không
  const isAuthor = useMemo(() => {
    if (!article || !user) return false
    return user.id === article.author_id || user.id === article.author?.id
  }, [article, user])

  // Dữ liệu hiển thị theo ngôn ngữ
  const displayData = useMemo<DisplayData | null>(() => {
    if (!article) return null

    const t = article.translations?.[activeTab] || {}
    return {
      title: t.title || '',
      slug: t.slug || '',
      excerpt: t.excerpt || '',
      content: t.content || '',
      seo_title: t.seo_title || '',
      seo_description: t.seo_description || '',
      canonical_url: t.canonical_url || '',
      robots: t.robots || 'index, follow',
      og_title: t.og_title || '',
      og_description: t.og_description || '',
    }
  }, [article, activeTab])

  // Cover URL
  const coverUrl = article
    ? getMediaUrl(article.cover_object_key || article.thumbnail_object_key) || FALLBACK_COVER
    : FALLBACK_COVER

  // SEO Analysis
  const seoAnalysis = useMemo<SeoAnalysis | null>(() => {
    if (!displayData) return null

    const maxTitleLen = Math.max(0, SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH - SEO_CONFIG.SUFFIX.length)
    let cleanTitle = displayData.seo_title
    if (cleanTitle.endsWith(SEO_CONFIG.SUFFIX)) {
      cleanTitle = cleanTitle.slice(0, -SEO_CONFIG.SUFFIX.length)
    }
    const baseFallback = displayData.title
      ? displayData.title.length > maxTitleLen
        ? displayData.title.slice(0, maxTitleLen)
        : displayData.title
      : ''
    const finalTitle = (cleanTitle.trim() || baseFallback) + SEO_CONFIG.SUFFIX

    const fallbackDesc =
      displayData.excerpt ||
      (displayData.content
        ? displayData.content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 155)
        : 'Mô tả chi tiết bài viết...')
    const finalDesc = displayData.seo_description || fallbackDesc

    return {
      finalTitle,
      finalDescription: finalDesc,
      titleLength: finalTitle.length,
      descriptionLength: finalDesc.length,
      maxTitleLength: SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH,
      maxDescriptionLength: SEO_CONFIG.MAX_DESCRIPTION_LENGTH,
      isTitleOverLimit: finalTitle.length > SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH,
      isDescOverLimit: finalDesc.length > SEO_CONFIG.MAX_DESCRIPTION_LENGTH,
      robots: displayData.robots,
      canonicalUrl:
        displayData.canonical_url ||
        (displayData.slug ? `https://kcnt.vinhuni.edu.vn/articles/${displayData.slug}` : ''),
      ogTitle: displayData.og_title || displayData.title || '',
      ogDescription:
        displayData.og_description ||
        displayData.excerpt ||
        'Đọc chi tiết bài viết trên website Trường Kỹ thuật và Công nghệ - Đại học Vinh.',
    }
  }, [displayData])

  return {
    id,
    article,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    displayData,
    coverUrl,
    fallbackCover: FALLBACK_COVER,
    seoAnalysis,
    isAuthor,
  }
}
