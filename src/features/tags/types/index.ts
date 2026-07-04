export interface TagTranslation {
  name: string
  slug: string
  description: string | null
}

export interface Tag {
  id: string
  color: string | null
  usage_count: number
  article_count: number
  sort_order: number
  is_active: boolean
  is_translated: Record<string, boolean>
  translations: Record<string, TagTranslation>
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface CreateTagPayload {
  color?: string | null
  sort_order?: number
  is_active?: boolean
  translations: Record<string, {
    name: string
    slug?: string
    description?: string | null
  }>
}

export interface UpdateTagPayload {
  color?: string | null
  sort_order?: number
  is_active?: boolean
  translations?: Record<string, {
    name: string
    slug?: string
    description?: string | null
  }>
}

export interface TagPagination {
  items: Tag[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface TagListParams {
  page?: number
  limit?: number
  search?: string | null
  is_active?: boolean | null
  only_has_articles?: boolean
}
