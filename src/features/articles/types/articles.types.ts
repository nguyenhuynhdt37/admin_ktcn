export interface CategoryInfo {
  id: string
  name: string
  slug: string
}

export interface TagTranslation {
  name: string
  slug: string
  description?: string | null
}

export interface TagInfo {
  id: string
  color?: string
  is_translated?: Record<string, boolean>
  translations?: {
    vi: TagTranslation
    en: TagTranslation
  }
  name?: string // Mẹo: Fallback dùng cho hiển thị nhanh
  slug?: string
}

export interface AuthorInfo {
  id: string
  username: string
  full_name: string
  avatar_url?: string | null
}

export interface ArticleTranslation {
  title: string
  slug: string
  excerpt: string
  content: string | null
  seo_title: string | null
  seo_description: string | null
  canonical_url: string | null
  robots: string | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
}

export interface Article {
  id: string
  category_id: string
  author_id: string
  thumbnail_object_key?: string | null
  cover_object_key?: string | null
  category: CategoryInfo
  tags: TagInfo[]
  author: AuthorInfo
  status: 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
  is_featured: boolean
  is_pinned: boolean
  is_draft: boolean // Phân tách bản nháp
  view_count: number
  word_count: number
  reading_time: number
  created_at: string
  updated_at: string
  published_at?: string | null
  publish_at?: string | null
  expire_at?: string | null
  is_translated: Record<string, boolean>
  translations: {
    vi: ArticleTranslation
    en: ArticleTranslation
  }
}

export interface ArticleListParams {
  page?: number
  page_size?: number
  search?: string | null
  category_id?: string | null
  author_id?: string | null
  tag_ids?: string[] | null
  status?: 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | null
  is_featured?: boolean | null
  is_pinned?: boolean | null
  is_draft?: boolean | null // Lọc nháp
  created_from?: string | null
  created_to?: string | null
  published_from?: string | null
  published_to?: string | null
  deleted?: boolean
  sort_by?: 'title' | 'created_at' | 'updated_at' | 'published_at' | 'view_count' | 'sort_order'
  sort_dir?: 'asc' | 'desc'
  lang?: string // Ngôn ngữ dùng để tìm kiếm/sắp xếp
}

export interface ArticleListResponse {
  items: Article[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// Autocomplete types
export interface CategorySearchItem {
  id: string
  name: string
  slug: string
  article_count?: number
}

export interface AuthorSearchItem {
  id: string
  username: string
  full_name: string
  avatar_url?: string | null
  is_active: boolean
}

export interface TagSearchItem {
  id: string
  color?: string
  article_count?: number
  is_translated?: Record<string, boolean>
  translations?: {
    vi: TagTranslation
    en: TagTranslation
  }
  name?: string // Fallback dùng cho hiển thị nhanh
  slug?: string
}

export interface Tag {
  id: string
  color?: string
  usage_count: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  is_translated: Record<string, boolean>
  translations: {
    vi: TagTranslation
    en: TagTranslation
  }
}

export interface ArticleStats {
  published_count: number
  scheduled_count: number
  draft_count: number
  archived_count: number
  trash_count: number
  total_views_this_month: number
}

export interface BulkStatusPayload {
  article_ids: string[]
  action: 'archive' | 'publish' | 'delete' | 'restore'
}

export interface BulkStatusResponse {
  success_count: number
  failed_count: number
  failed_ids: string[]
  message: string
}

export interface ArticleCreatePayload {
  category_id?: string | null
  tag_ids?: string[] | null
  status?: 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
  is_draft: boolean // Thêm trường phân tách bản nháp
  publish_at?: string | null
  expire_at?: string | null
  thumbnail_object_key?: string | null
  cover_object_key?: string | null
  is_featured?: boolean
  is_pinned?: boolean
  translations: {
    vi: Partial<ArticleTranslation>
    en?: Partial<ArticleTranslation> | null
  }
}

export interface SeoIssue {
  type: string
  message: string
}

export interface InternalLink {
  anchor_text: string
  url: string
  reason: string
}

export interface SeoAnalysisResponse {
  score: number
  status: 'good' | 'warning' | 'error'
  issues: SeoIssue[]
  suggestions: string[]
  generated_seo_title: string
  generated_meta_description: string
  focus_keywords: string[]
  internal_links: InternalLink[]
}

export interface SeoAnalyzePayload {
  title: string
  content: string
  excerpt: string
  seo_title: string | null
  seo_description: string | null
  focus_keyword: string | null
  lang: 'vi' | 'en'
  thumbnail_object_key?: string | null
  slug?: string | null
}

export interface ArticleSEORewriteRequest {
  content: string
  focus_keyword?: string | null
  tone?: 'chuyên nghiệp' | 'thuyết phục' | 'sáng tạo' | 'học thuật' | string
  lang?: 'vi' | 'en' | string
}

export interface ArticleSEORewriteResponse {
  content: string
}

export interface ArticleGenerateByIdeaRequest {
  idea: string
  focus_keyword?: string | null
  tone?: 'chuyên nghiệp' | 'thuyết phục' | 'sáng tạo' | 'học thuật' | string
  lang?: 'vi' | 'en' | string
}

export interface ArticleGenerateByIdeaResponse {
  title: string
  excerpt: string
  content: string
  seo_title: string
  seo_description: string
  slug: string
}

export interface ArticleSummaryRequest {
  content: string
  max_length?: number
  lang?: 'vi' | 'en' | string
}

export interface ArticleSummaryResponse {
  summary: string
}



