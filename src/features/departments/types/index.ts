export interface DepartmentTranslation {
  name: string
  description: string | null
  short_description: string | null
  mission: string | null
  vision: string | null
  seo_title: string | null
  seo_description: string | null
  slug?: string
}

export interface Department {
  id: string
  code: string | null
  unit_type: 'school' | 'faculty' | 'department' | 'office' | 'center' | 'lab'
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  thumbnail_object_key: string | null
  banner_object_key: string | null
  phone: string | null
  email: string | null
  website: string | null
  office: string | null
  sort_order: number
  is_active: boolean
  content_status: 'draft' | 'review' | 'published'
  staff_count: number
  is_translated: Record<string, boolean>
  translations: Record<string, DepartmentTranslation>
  created_at: string
  updated_at: string
}

export interface CreateDepartmentPayload {
  code?: string | null
  unit_type?: Department['unit_type']
  parent_id?: string | null
  thumbnail_object_key?: string | null
  banner_object_key?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
  content_status?: Department['content_status']
  translations: Record<string, {
    name: string
    description?: string | null
    short_description?: string | null
    mission?: string | null
    vision?: string | null
  }>
}

export interface UpdateDepartmentPayload {
  code?: string | null
  unit_type?: Department['unit_type']
  parent_id?: string | null
  thumbnail_object_key?: string | null
  banner_object_key?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
  content_status?: Department['content_status']
  translations?: Record<string, {
    name: string
    description?: string | null
    short_description?: string | null
    mission?: string | null
    vision?: string | null
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
