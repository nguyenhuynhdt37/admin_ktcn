export interface DepartmentMinimal {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export interface PositionMinimal {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface StaffTranslation {
  academic_title: string | null
  degree: string | null
  biography: string | null
  research_interests: string | null
}

export interface Staff {
  id: string
  department_id: string
  position_id: string
  full_name: string
  english_name: string | null
  slug: string
  academic_title: string | null
  degree: string | null
  avatar_object_key: string | null
  email: string | null
  phone: string | null
  website: string | null
  office: string | null
  biography: string | null
  research_interests: string | null
  sort_order: number
  is_active: boolean
  is_translated: Record<string, boolean>
  translations: Record<string, StaffTranslation>
  created_at: string
  updated_at: string
  department?: DepartmentMinimal
  position?: PositionMinimal
}

export interface CreateStaffPayload {
  department_id: string
  position_id: string
  full_name: string
  english_name?: string | null
  avatar_object_key?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
  translations: Record<string, {
    academic_title?: string | null
    degree?: string | null
    biography?: string | null
    research_interests?: string | null
  }>
}

export interface UpdateStaffPayload {
  department_id?: string
  position_id?: string
  full_name?: string
  english_name?: string | null
  avatar_object_key?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  is_active?: boolean
  translations?: Record<string, {
    academic_title?: string | null
    degree?: string | null
    biography?: string | null
    research_interests?: string | null
  }>
}

export interface UpdateStaffStatusPayload {
  is_active: boolean
}

export interface StaffListParams {
  page?: number
  page_size?: number
  search?: string | null
  department_id?: string | null
  position_id?: string | null
  academic_title_id?: string | null
  degree_id?: string | null
  is_active?: boolean | null
  sort_by?: 'full_name' | 'sort_order' | 'created_at'
  order?: 'asc' | 'desc'
}

export interface StaffPagination {
  items: Staff[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface StatDetail {
  total: number
  active: number
  inactive: number
}

export interface StaffStats {
  departments: StatDetail
  positions: StatDetail
  staffs: StatDetail
}

export interface AcademicTitle {
  id: string
  name: string
  is_active: boolean
  sort_order: number
}

export interface Degree {
  id: string
  name: string
  is_active: boolean
  sort_order: number
}
