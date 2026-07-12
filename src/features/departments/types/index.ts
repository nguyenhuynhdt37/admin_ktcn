export type DepartmentUnitType = 'school' | 'faculty' | 'department' | 'office' | 'center' | 'lab'

export interface DepartmentTranslation {
  name: string
  description: string | null
  slug?: string
  mission?: string | null
  vision?: string | null
  history?: string | null
  research_overview?: string | null
  seo_title?: string | null
  seo_description?: string | null
  is_translated?: boolean
}

export interface Department {
  id: string
  code: string | null
  unit_type: DepartmentUnitType
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  mission: string | null
  vision: string | null
  history: string | null
  research_overview: string | null
  seo_title: string | null
  seo_description: string | null
  thumbnail_object_key: string | null
  logo_object_key: string | null
  banner_object_key: string | null
  phone: string | null
  email: string | null
  website: string | null
  office: string | null
  sort_order: number
  display_order: number
  is_active: boolean
  head_staff_id: string | null
  staff_count: number
  is_translated: Record<string, boolean>
  translations: Record<string, DepartmentTranslation>
  created_at: string
  updated_at: string
}

export interface CreateDepartmentPayload {
  code?: string | null
  unit_type?: DepartmentUnitType
  parent_id?: string | null
  thumbnail_object_key?: string | null
  logo_object_key?: string | null
  banner_object_key?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  display_order?: number
  is_active?: boolean
  head_staff_id?: string | null
  translations: Record<string, {
    name: string
    description?: string | null
    mission?: string | null
    vision?: string | null
    history?: string | null
    research_overview?: string | null
    seo_title?: string | null
    seo_description?: string | null
  }>
}

export interface UpdateDepartmentPayload {
  code?: string | null
  unit_type?: DepartmentUnitType
  parent_id?: string | null
  thumbnail_object_key?: string | null
  logo_object_key?: string | null
  banner_object_key?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  office?: string | null
  sort_order?: number
  display_order?: number
  is_active?: boolean
  head_staff_id?: string | null
  translations?: Record<string, {
    name: string
    description?: string | null
    mission?: string | null
    vision?: string | null
    history?: string | null
    research_overview?: string | null
    seo_title?: string | null
    seo_description?: string | null
  }>
}

export interface DepartmentPagination {
  items: Department[]
  page: number
  page_size: number
  total: number
  total_pages: number
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
  unit_type?: string | null
  sort_by?: 'sort_order' | 'name' | 'created_at'
  order?: 'asc' | 'desc'
}

// ─── SEO Analysis Types ─────────────────────────────────────────────────────

export interface DepartmentSeoIssue {
  type: string
  message: string
}

export interface DepartmentInternalLink {
  anchor_text: string
  url: string
  reason: string
}

export interface DepartmentSeoAnalysisResponse {
  score: number
  status: 'good' | 'warning' | 'error'
  issues: DepartmentSeoIssue[]
  suggestions: string[]
  generated_seo_title: string
  generated_meta_description: string
  focus_keywords: string[]
  internal_links: DepartmentInternalLink[]
  google_preview?: {
    title: string
    url: string
    description: string
  }
}

export interface DepartmentSeoAnalyzePayload {
  name: string
  description: string
  mission: string
  vision: string
  history: string
  research_overview: string
  seo_title: string | null
  seo_description: string | null
  focus_keyword: string | null
  thumbnail_object_key?: string | null
  logo_object_key?: string | null
  banner_object_key?: string | null
  slug?: string | null
  lang: 'vi' | 'en'
}
