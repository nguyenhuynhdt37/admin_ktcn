// src/features/users/types/accessOverview.types.ts

export interface RoleItem {
  id: string
  name: string
  code: string
}

export interface GrantedPermission {
  id: string
  name: string
  code: string
  module: string
  action: string
  description: string | null
}

export interface AccessibleFeature {
  id: string
  name: string
  code: string
  route: string | null
  icon: string | null
  sort_order: number
  is_visible: boolean
  granted_permissions: GrantedPermission[]
}

export interface UserAccessOverview {
  user_id: string
  username: string
  full_name: string
  is_active: boolean
  roles: RoleItem[]
  permission_codes: string[]
  accessible_features: AccessibleFeature[]
  total_permissions: number
  total_accessible_features: number
}
