import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/app/providers/AuthProvider'
import { useAuthStore } from '@/stores/authStore'

interface PermissionRouteProps {
  children: React.ReactNode
  permission: string
}

export function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const { hasPermission, isLoading } = useAuth()
  const location = useLocation()

  // Still initialising — avoid a premature redirect
  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center gap-3">
        <span className="text-7xl">🔒</span>
        <h2 className="text-3xl font-bold tracking-tight">403</h2>
        <p className="text-muted-foreground max-w-xs">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
