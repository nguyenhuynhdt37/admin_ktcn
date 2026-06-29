export interface Position {
  id: string
  name: string
  english_name: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  staff_count: number
  created_at: string
  updated_at: string
}

export interface CreatePositionPayload {
  name: string
  english_name?: string | null
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface UpdatePositionPayload {
  name?: string
  english_name?: string | null
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface UpdatePositionStatusPayload {
  is_active: boolean
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
  total_staff: number
}

export interface PositionListParams {
  page?: number
  page_size?: number
  search?: string | null
  is_active?: boolean | null
  sort_by?: 'sort_order' | 'name' | 'created_at'
  order?: 'asc' | 'desc'
}
