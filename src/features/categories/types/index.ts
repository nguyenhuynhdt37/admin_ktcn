export type CategoryStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export interface CategoryTranslation {
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
}

export interface Category {
  id: string
  parent_id: string | null
  name?: string
  slug?: string
  description?: string | null
  thumbnail_id: string | null
  sort_order: number
  status: CategoryStatus
  is_visible: boolean
  seo_title?: string | null
  seo_description?: string | null
  is_weekly_schedule: boolean
  is_locked: boolean
  article_count?: number
  is_translated?: Record<string, boolean>
  created_at: string
  updated_at: string
  translations?: Record<string, CategoryTranslation> | null
}

export interface CategoryTreeNode {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  thumbnail_id: string | null
  sort_order: number
  status: CategoryStatus
  is_visible: boolean
  seo_title?: string | null
  seo_description?: string | null
  is_weekly_schedule: boolean
  is_locked: boolean
  article_count?: number
  is_translated?: Record<string, boolean>
  children: CategoryTreeNode[]
  translations?: Record<string, CategoryTranslation> | null
}

export interface CategoryCreatePayload {
  parent_id?: string | null
  thumbnail_id?: string | null
  sort_order?: number
  status?: CategoryStatus
  is_visible?: boolean
  is_weekly_schedule?: boolean
  is_locked?: boolean
  translations: Record<string, CategoryTranslation>
}

export interface CategoryUpdatePayload {
  parent_id?: string | null
  thumbnail_id?: string | null
  sort_order?: number
  status?: CategoryStatus
  is_visible?: boolean
  is_weekly_schedule?: boolean
  is_locked?: boolean
  translations: Record<string, CategoryTranslation>
}

export interface CategoryReorderItem {
  id: string
  parent_id: string | null
  sort_order: number
}

export interface CategoryReorderPayload {
  items: CategoryReorderItem[]
}

/** Dạng phẳng của tree node — dùng cho drag-drop internal state */
export interface FlatCategoryNode {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  sort_order: number
  status: CategoryStatus
  is_visible: boolean
  depth: number
  children_count: number
  is_weekly_schedule: boolean
  is_locked: boolean
  article_count?: number
  is_translated?: Record<string, boolean>
  isGhost?: boolean
  isPlaceholder?: boolean
  isValid?: boolean
  translations?: Record<string, CategoryTranslation> | null
}
