import { httpClient } from '@/services/http/client'
import type {
  RoleListItem,
  RoleDetail,
  RoleCreatePayload,
  RoleUpdatePayload,
  SystemPermission,
} from '../types/roles.types'

export const rolesService = {
  // Lấy danh sách vai trò
  list: (): Promise<RoleListItem[]> =>
    httpClient.get('/roles').then((r) => r.data),

  // Xem chi tiết vai trò
  getDetail: (id: string): Promise<RoleDetail> =>
    httpClient.get(`/roles/${id}`).then((r) => r.data),

  // Tạo vai trò mới
  create: (payload: RoleCreatePayload): Promise<RoleDetail> =>
    httpClient.post('/roles', payload).then((r) => r.data),

  // Cập nhật tên và mô tả vai trò
  update: (id: string, payload: RoleUpdatePayload): Promise<RoleDetail> =>
    httpClient.put(`/roles/${id}`, payload).then((r) => r.data),

  // Xóa vai trò
  delete: (id: string): Promise<{ success: boolean }> =>
    httpClient.delete(`/roles/${id}`).then((r) => r.data),

  // Gán danh sách quyền cho vai trò
  assignPermissions: (roleId: string, permissionIds: string[]): Promise<{ success: boolean }> =>
    httpClient.post(`/roles/${roleId}/permissions`, {
      permission_ids: permissionIds,
    }).then((r) => r.data),

  // Lấy tất cả quyền hạn có sẵn trong hệ thống
  listAllPermissions: (): Promise<SystemPermission[]> =>
    httpClient.get('/permissions').then((r) => r.data),
}
