import { httpClient } from '@/services/http/client'
import type {
  MyProfileResponse,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  ActivityResponse,
} from '../types/profile.types'
import type { UserSession, LoginHistoryResponse } from '@/features/users/types/userActivity.types'

const BASE = '/admin/profile'

export const profileService = {
  /** Lấy hồ sơ chi tiết của tài khoản đang đăng nhập */
  getProfile: (): Promise<MyProfileResponse> =>
    httpClient.get<MyProfileResponse>(BASE).then((r) => r.data),

  /** Cập nhật hồ sơ cá nhân */
  updateProfile: (payload: ProfileUpdateRequest): Promise<MyProfileResponse> =>
    httpClient.put<MyProfileResponse>(BASE, payload).then((r) => r.data),

  /** Đổi mật khẩu */
  changePassword: (payload: ChangePasswordRequest): Promise<{ success: boolean; message: string }> =>
    httpClient.put<{ success: boolean; message: string }>(`${BASE}/password`, payload).then((r) => r.data),

  /** Lấy danh sách phiên đăng nhập của bản thân */
  getSessions: (): Promise<UserSession[]> =>
    httpClient.get<UserSession[]>(`${BASE}/sessions`).then((r) => r.data),

  /** Lấy lịch sử đăng nhập */
  getLoginHistory: (params: {
    page?: number
    page_size?: number
    status?: string
  }): Promise<LoginHistoryResponse> =>
    httpClient.get<LoginHistoryResponse>(`${BASE}/login-history`, { params }).then((r) => r.data),

  /** Lấy nhật ký hoạt động */
  getActivity: (limit?: number): Promise<ActivityResponse> =>
    httpClient.get<ActivityResponse>(`${BASE}/activity`, { params: { limit: limit ?? 10 } }).then((r) => r.data),

  /** Upload avatar (reuse media upload) */
  uploadAvatar: async (file: File): Promise<{ id: string; name: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{ id: string; name: string }>('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
