export interface PositionTranslation {
  name: string
  description: string | null
}

export interface Position {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  staff_count: number
  is_translated: Record<string, boolean>
  translations: Record<string, PositionTranslation>
  created_at: string
  updated_at: string
}

export interface CreatePositionPayload {
  sort_order?: number
  is_active?: boolean
  translations: Record<string, {
    name: string
    description?: string | null
  }>
}

export interface UpdatePositionPayload {
  sort_order?: number
  is_active?: boolean
  translations?: Record<string, {
    name: string
    description?: string | null
  }>
}

export interface PositionPagination {
  items: Position[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface PositionStats {
  total: number
  active: number
  inactive: number
}

export interface PositionListParams {
  page?: number
  page_size?: number
  search?: string | null
  is_active?: boolean | null
  sort_by?: 'sort_order' | 'name' | 'created_at'
  order?: 'asc' | 'desc'
}
