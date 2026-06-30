export interface Language {
  id: string
  code: string
  name: string
  native_name: string
  flag_id: string | null
  flag_url: string | null
  is_default: boolean
  is_system: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LanguageCreateInput {
  code: string
  name: string
  native_name: string
  flag_id?: string | null
  is_default?: boolean
  is_active?: boolean
  sort_order?: number
}

export interface LanguageUpdateInput {
  name: string
  native_name: string
  flag_id?: string | null
  is_default?: boolean
  is_active?: boolean
  sort_order?: number
}
