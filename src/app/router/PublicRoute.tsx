import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

interface PublicRouteProps {
  children: React.ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
