import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { env } from '@/app/config/env'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export const httpClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401) {
      const responseData = error.response?.data as { success?: boolean; error?: { code?: string; message?: string } } | undefined
      const errorCode = responseData?.error?.code

      // If the refresh request itself fails with 401
      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // If we already tried to retry once and it fails again
      if (originalRequest._retry) {
        useAuthStore.getState().logout()
        const errorMessage = responseData?.error?.message || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
        toast.error(errorMessage)
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // First time 401, check error code
      if (errorCode === 'EXPIRED_ACCESS_TOKEN') {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return httpClient(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const refreshResponse = await axios.post(
            `${env.VITE_API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
          const { access_token } = refreshResponse.data

          useAuthStore.getState().setToken(access_token)
          processQueue(null, access_token)
          isRefreshing = false

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`
          }
          return httpClient(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          isRefreshing = false
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // Other 401 errors (e.g. INACTIVE_USER, INVALID_ACCESS_TOKEN)
        useAuthStore.getState().logout()
        
        // Skip toast & redirect for login endpoint itself so the form can handle credentials/status errors
        if (!originalRequest.url?.includes('/auth/login')) {
          const errorMessage = responseData?.error?.message || 'Phiên làm việc không hợp lệ hoặc đã hết hạn'
          toast.error(errorMessage)
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh')
    const isUnauthorized = error.response?.status === 401

    if (!isRefreshCall && !isUnauthorized) {
      const responseData = error.response?.data as { error?: { message?: string }; message?: string } | undefined
      const errorMessage =
        responseData?.error?.message ||
        responseData?.message ||
        error.message ||
        'Đã xảy ra lỗi hệ thống'
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)
