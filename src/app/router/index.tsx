import { createBrowserRouter, Navigate } from 'react-router'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PermissionRoute } from './PermissionRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { UserCreatePage } from '@/features/users/pages/UserCreatePage'
import { UserEditPage } from '@/features/users/pages/UserEditPage'
import { UserActivityPage } from '@/features/users/pages/UserActivityPage'
import { RolesPage } from '@/features/roles/pages/RolesPage'
import { AuditLogsPage } from '@/features/audit-logs/pages/AuditLogsPage'
import { UiSandboxPage } from '@/features/sandbox/pages/UiSandboxPage'
import { EditorTestPage } from '@/features/sandbox/pages/EditorTestPage'
import { MenusPage } from '@/features/menus/pages/MenusPage'
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage'
import { AiSettingsPage } from '@/features/ai-settings/pages/AiSettingsPage'
import { Button } from '@/shared/components/ui/button'
import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
      <p className="mt-4 text-xl font-medium text-muted-foreground">Không tìm thấy trang yêu cầu</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        Đường dẫn bạn truy cập có thể đã thay đổi hoặc không tồn tại.
      </p>
      <Button asChild className="mt-6 cursor-pointer">
        <Link to="/dashboard">Quay lại trang chủ</Link>
      </Button>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'categories',
        element: (
          <PermissionRoute permission="category.view">
            <CategoriesPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <PermissionRoute permission="user.view">
            <UsersPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'users/create',
        element: (
          <PermissionRoute permission="user.create">
            <UserCreatePage />
          </PermissionRoute>
        ),
      },
      {
        path: 'users/:id/edit',
        element: (
          <PermissionRoute permission="user.update">
            <UserEditPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'users/:id/activity',
        element: (
          <PermissionRoute permission="user.view">
            <UserActivityPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionRoute permission="role.view">
            <RolesPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'permissions',
        element: (
          <PermissionRoute permission="permission.view">
            <RolesPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <PermissionRoute permission="audit.view">
            <AuditLogsPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'menus',
        element: (
          <PermissionRoute permission="menu.view">
            <MenusPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'settings/ai',
        element: (
          <PermissionRoute permission="ai.view">
            <AiSettingsPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'ui-sandbox',
        element: <UiSandboxPage />,
      },
      {
        path: 'editor-test',
        element: <EditorTestPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

