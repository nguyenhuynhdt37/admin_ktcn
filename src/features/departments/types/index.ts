export interface DepartmentTranslation {
  name: string
  description: string | null
  slug?: string
}

export interface Department {
  id: string
  name: string
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
  is_translated: Record<string, boolean>
  translations: Record<string, DepartmentTranslation>
  created_at: string
  updated_at: string
}

export interface CreateDepartmentPayload {
  thumbnail_object_key: string
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
  translations: Record<string, {
    name: string
    description?: string | null
  }>
}

export interface UpdateDepartmentPayload {
  thumbnail_object_key: string
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
  translations?: Record<string, {
    name: string
    description?: string | null
  }>
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
