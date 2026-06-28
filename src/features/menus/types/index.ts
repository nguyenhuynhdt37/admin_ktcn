export interface TargetInfo {
  id: string
  type: string
  name: string
  slug?: string | null
  status?: string | null
  path?: string | null
}

export interface MenuItemNode {
  id: string
  title: string
  target_type: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | null
  target_id: string | null
  target_info: TargetInfo | null
  external_url: string | null
  open_in_new_tab: boolean
  icon: string | null
  depth: number
  sort_order: number
  is_visible: boolean
  has_link: boolean
  children: MenuItemNode[]
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
  title: string
  target_type: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | null
  target_id: string | null
  external_url: string | null
  open_in_new_tab: boolean
  icon: string | null
  is_visible: boolean
}

export interface FlatMenuItem extends Omit<MenuItemNode, 'children'> {
  parent_id: string | null
  isGhost?: boolean
  isPlaceholder?: boolean
  isValid?: boolean
}

