export interface TargetInfo {
  id: string
  type: string
  name: string
  slug?: string | null
  status?: string | null
  path?: string | null
}

export interface MenuItemTranslation {
  title: string
  external_url?: string | null
}

export interface MenuItemNode {
  id: string
  title: string
  target_type: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | 'DEPARTMENT' | null
  target_id: string | null
  target_info: TargetInfo | null
  external_url: string | null
  open_in_new_tab: boolean
  depth: number
  sort_order: number
  is_visible: boolean
  has_link: boolean
  children: MenuItemNode[]
  translations?: Record<string, MenuItemTranslation> | null
  is_translated?: Record<string, boolean> | null
}

export interface MenuTreeResponse {
  id: string
  name: string
  code: string
  is_active: boolean
  items: MenuItemNode[]
}

export interface MenuListItem {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export interface MenuItemPayload {
  target_type: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | 'DEPARTMENT' | null
  target_id: string | null
  open_in_new_tab: boolean
  is_visible: boolean
  translations: Record<string, MenuItemTranslation>
}

export interface FlatMenuItem extends Omit<MenuItemNode, 'children'> {
  parent_id: string | null
  isGhost?: boolean
  isPlaceholder?: boolean
  isValid?: boolean
  isVirtual?: boolean
  children_count?: number
}

