export type CategoryStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  thumbnail_id: string | null
  sort_order: number
  status: CategoryStatus
  is_visible: boolean
  seo_title: string
  seo_description: string
  seo_keywords: string | null
  seo_canonical?: string | null
  seo_robots?: string | null
  seo_og_image_id?: string | null
  created_at: string
  updated_at: string
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
  seo_title: string
  seo_description: string
  seo_keywords: string | null
  seo_canonical?: string | null
  seo_robots?: string | null
  seo_og_image_id?: string | null
  children: CategoryTreeNode[]
}

export interface CategoryCreatePayload {
  name: string
  parent_id?: string | null
  slug?: string | null
  description?: string | null
  thumbnail_id?: string | null
  sort_order?: number
  status?: CategoryStatus
  is_visible?: boolean
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
  seo_canonical?: string | null
  seo_robots?: string | null
  seo_og_image_id?: string | null
}

export interface CategoryUpdatePayload {
  name?: string
  parent_id?: string | null
  slug?: string | null
  description?: string | null
  thumbnail_id?: string | null
  sort_order?: number
  status?: CategoryStatus
  is_visible?: boolean
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
  seo_canonical?: string | null
  seo_robots?: string | null
  seo_og_image_id?: string | null
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
  isGhost?: boolean
  isPlaceholder?: boolean
  isValid?: boolean
}
