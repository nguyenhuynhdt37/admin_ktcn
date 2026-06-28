import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { httpClient } from '@/services/http/client'
import axios from 'axios'
import { env } from '@/app/config/env'

interface AuthContextType {
  isLoading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

let activeRefreshPromise: Promise<string> | null = null

const performRefresh = async (): Promise<string> => {
  if (activeRefreshPromise) {
    return activeRefreshPromise
  }

  activeRefreshPromise = (async () => {
    try {
      const refreshResponse = await axios.post(
        `${env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      return refreshResponse.data.access_token
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { logout, setUser, setToken, setLoading, isLoading } = useAuthStore()
  const [init, setInit] = useState(false)

  const checkAuth = async () => {
    try {
      setLoading(true)
      const access_token = await performRefresh()
      setToken(access_token)

      const userResponse = await httpClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      
      setUser(userResponse.data)
      console.log('Authenticated profile synced successfully')
    } catch (error) {
      console.warn('Session restoration failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const runInit = async () => {
      try {
        setLoading(true)
        const access_token = await performRefresh()

        if (active) {
          setToken(access_token)
          const userResponse = await httpClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` },
          })
          setUser(userResponse.data)
        }
      } catch (error) {
        console.warn('No active session found during boot:', error)
        if (active) {
          logout()
        }
      } finally {
        if (active) {
          setLoading(false)
          setInit(true)
        }
      }
    }

    setTimeout(() => {
      runInit()
    }, 0)

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!init || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải ứng dụng...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const { user } = useAuthStore()

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.role === 'super_admin' || user.permissions.includes('*') || user.permissions.includes(permission)) {
      return true
    }
    return false
  }

  return {
    ...context,
    hasPermission,
  }
}

