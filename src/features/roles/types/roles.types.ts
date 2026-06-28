export interface SystemPermission {
  id: string
  name: string
  code: string
  module: string
  action: string
  description: string | null
}

export interface RoleListItem {
  id: string
  name: string
  code: string
  description: string | null
  permissions_count: number
}

export interface RoleDetail {
  id: string
  name: string
  code: string
  description: string | null
  permissions: SystemPermission[]
}

export interface RoleCreatePayload {
  name: string
  code: string
  description?: string
}

export interface RoleUpdatePayload {
  name: string
  description?: string
}

export interface AssignPermissionsPayload {
  permission_ids: string[]
}
