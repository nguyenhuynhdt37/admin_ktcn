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

export interface Staff {
  id: string
  department_id: string
  position_id: string
  full_name: string
  english_name: string | null
  slug: string
  academic_title: string | null
  degree: string | null
  avatar_object_key: string | null // BE returns full HTTP URL
  email: string | null
  phone: string | null
  website: string | null
  office: string | null
  biography: string | null
  research_interests: string | null
  sort_order: number
  is_active: boolean
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
  academic_title?: string | null
  degree?: string | null
  avatar_object_key?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  office?: string | null
  biography?: string | null
  research_interests?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface UpdateStaffPayload {
  department_id?: string
  position_id?: string
  full_name?: string
  english_name?: string | null
  academic_title?: string | null
  degree?: string | null
  avatar_object_key?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  office?: string | null
  biography?: string | null
  research_interests?: string | null
  sort_order?: number
  is_active?: boolean
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
  academic_title?: string | null
  degree?: string | null
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

export interface StaffStats {
  total: number
  active: number
  inactive: number
  high_qualification: number
}
