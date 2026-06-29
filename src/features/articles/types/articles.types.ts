export interface CategoryInfo {
  id: string
  name: string
  slug: string
}

export interface TagInfo {
  id: string
  name: string
  slug: string
  color?: string
}

export interface AuthorInfo {
  id: string
  username: string
  full_name: string
  avatar_url?: string | null
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string | null
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
  created_at: string
  published_at?: string | null
  publish_at?: string | null
  expire_at?: string | null
  seo_title?: string | null
  seo_description?: string | null
  canonical_url?: string | null
  robots?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image?: string | null
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
  name: string
  slug: string
  color?: string
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
  title: string
  slug?: string | null
  excerpt?: string | null
  content?: string | null
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
  seo_title?: string | null
  seo_description?: string | null
  canonical_url?: string | null
  robots?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image?: string | null
}
