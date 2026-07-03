import { httpClient } from '@/services/http/client'
import type {
  ArticleListParams,
  ArticleListResponse,
  CategorySearchItem,
  AuthorSearchItem,
  TagSearchItem,
  ArticleStats,
  BulkStatusPayload,
  BulkStatusResponse,
  ArticleCreatePayload,
  Article,
  TagTranslation,
  SeoAnalyzePayload,
  SeoAnalysisResponse,
  ArticleSEORewriteRequest,
  ArticleSEORewriteResponse,
  ArticleGenerateByIdeaRequest,
  ArticleGenerateByIdeaResponse,
  ArticleSummaryRequest,
  ArticleSummaryResponse
} from '../types/articles.types'

export const articleService = {
  list: async (params: ArticleListParams): Promise<ArticleListResponse> => {
    const cleanedParams: Record<string, any> = {}
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanedParams[key] = value
      }
    })

    const { data } = await httpClient.get<ArticleListResponse>('/admin/articles', {
      params: cleanedParams,
    })
    return data
  },

  searchCategories: async (search: string): Promise<CategorySearchItem[]> => {
    const { data } = await httpClient.get<CategorySearchItem[]>('/admin/categories', {
      params: { search },
    })
    return data
  },

  searchAuthors: async (search: string): Promise<AuthorSearchItem[]> => {
    const { data } = await httpClient.get<{ items: AuthorSearchItem[] }>('/users', {
      params: {
        page: 1,
        page_size: 10,
        search,
        is_active: 'true',
      },
    })
    if (Array.isArray(data)) {
      return data
    }
    return (data as any)?.items || []
  },

  searchTags: async (search: string): Promise<TagSearchItem[]> => {
    const { data } = await httpClient.get<{ items: TagSearchItem[] } | TagSearchItem[]>('/admin/tags', {
      params: {
        page: 1,
        limit: 10,
        search,
        is_active: 'true',
      },
    })
    if (Array.isArray(data)) {
      return data
    }
    return (data as any)?.items || []
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await httpClient.delete<{ success: boolean }>(`/admin/articles/${id}`)
    return data
  },

  restore: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await httpClient.post<{ success: boolean }>(`/admin/articles/${id}/restore`)
    return data
  },

  archive: async (id: string): Promise<any> => {
    const { data } = await httpClient.patch<any>(`/admin/articles/${id}/archive`)
    return data
  },

  publish: async (id: string): Promise<any> => {
    const { data } = await httpClient.patch<any>(`/admin/articles/${id}/publish`)
    return data
  },

  getStats: async (): Promise<ArticleStats> => {
    const { data } = await httpClient.get<ArticleStats>('/admin/articles/stats')
    return data
  },

  bulkStatus: async (payload: BulkStatusPayload): Promise<BulkStatusResponse> => {
    const { data } = await httpClient.post<BulkStatusResponse>('/admin/articles/bulk-status', payload)
    return data
  },

  updateAttributes: async (id: string, payload: { is_featured?: boolean; is_pinned?: boolean }): Promise<Article> => {
    const { data } = await httpClient.patch<Article>(`/admin/articles/${id}/attributes`, payload)
    return data
  },

  listCategories: async (): Promise<CategorySearchItem[]> => {
    const { data } = await httpClient.get<CategorySearchItem[]>('/admin/categories', {
      params: { status: 'ACTIVE' }
    })
    return data
  },

  listTags: async (): Promise<TagSearchItem[]> => {
    const { data } = await httpClient.get<{ items: TagSearchItem[] } | TagSearchItem[]>('/admin/tags', {
      params: { limit: 100, is_active: true },
    })
    if (Array.isArray(data)) {
      return data
    }
    return (data as any)?.items || []
  },

  create: async (payload: ArticleCreatePayload): Promise<Article> => {
    const { data } = await httpClient.post<Article>('/admin/articles', payload)
    return data
  },

  update: async (id: string, payload: Partial<ArticleCreatePayload>): Promise<Article> => {
    const { data } = await httpClient.put<Article>(`/admin/articles/${id}`, payload)
    return data
  },

  getDetail: async (id: string): Promise<Article> => {
    const { data } = await httpClient.get<Article>(`/admin/articles/${id}`)
    return data
  },

  uploadMedia: async (file: File): Promise<{ id?: string; object_key: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{ id?: string; object_key: string }>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  createTag: async (payload: {
    color?: string
    sort_order?: number
    is_active?: boolean
    translations: {
      vi: TagTranslation
      en?: TagTranslation | null
    }
  }): Promise<TagSearchItem> => {
    const { data } = await httpClient.post<TagSearchItem>('/admin/tags', payload)
    return data
  },

  checkSlug: async (slug: string): Promise<{ available: boolean; suggested_slug: string }> => {
    const { data } = await httpClient.get<{ available: boolean; suggested_slug: string }>('/admin/articles/check-slug', {
      params: { slug }
    })
    return data
  },

  listMyDrafts: async (params?: { page?: number; page_size?: number }): Promise<ArticleListResponse> => {
    const { data } = await httpClient.get<ArticleListResponse>('/admin/articles/drafts', { params })
    return data
  },

  countMyDrafts: async (): Promise<{ count: number }> => {
    const { data } = await httpClient.get<{ count: number }>('/admin/articles/drafts/count')
    return data
  },

  analyzeSeo: async (articleId: string, payload: SeoAnalyzePayload): Promise<SeoAnalysisResponse> => {
    const { data } = await httpClient.post<SeoAnalysisResponse>(`/admin/articles/${articleId}/seo/analyze`, payload, {
      timeout: 30000 // Tăng timeout lên 30 giây cho phân tích SEO
    })
    return data
  },

  seoRewrite: async (articleId: string, payload: ArticleSEORewriteRequest): Promise<ArticleSEORewriteResponse> => {
    const { data } = await httpClient.post<ArticleSEORewriteResponse>(`/admin/articles/${articleId}/seo/rewrite`, payload, {
      timeout: 60000 // Tăng timeout lên 60 giây cho viết lại nội dung bằng AI
    })
    return data
  },

  generateByIdea: async (payload: ArticleGenerateByIdeaRequest): Promise<ArticleGenerateByIdeaResponse> => {
    const { data } = await httpClient.post<ArticleGenerateByIdeaResponse>('/admin/articles/seo/generate-by-idea', payload, {
      timeout: 60000 // Tăng timeout lên 60 giây cho sinh bài viết bằng AI
    })
    return data
  },

  seoSummarize: async (articleId: string, payload: ArticleSummaryRequest): Promise<ArticleSummaryResponse> => {
    const { data } = await httpClient.post<ArticleSummaryResponse>(`/admin/articles/${articleId}/seo/summarize`, payload, {
      timeout: 30000 // Tăng timeout lên 30 giây cho tóm tắt bài viết bằng AI
    })
    return data
  },
}
