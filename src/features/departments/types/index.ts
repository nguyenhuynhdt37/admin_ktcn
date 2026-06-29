export interface Department {
  id: string
  name: string
  english_name: string | null
  slug: string
  description: string | null
  thumbnail_object_key: string | null
  phone: string | null
  email: string | null
  website: string | null
  office: string | null
  sort_order: number
  is_active: boolean
  staff_count: number
  created_at: string
  updated_at: string
}

export interface CreateDepartmentPayload {
  name: string
  english_name?: string | null
  description?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface UpdateDepartmentPayload {
  name?: string
  english_name?: string | null
  description?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface UpdateDepartmentStatusPayload {
  is_active: boolean
}

export interface DepartmentPagination {
  items: Department[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface DepartmentStats {
  total: number
  active: number
  inactive: number
  total_staff: number
}

export interface DepartmentListParams {
  page?: number
  page_size?: number
  search?: string | null
  is_active?: boolean | null
  sort_by?: 'sort_order' | 'name' | 'created_at'
  order?: 'asc' | 'desc'
}
