import { createBrowserRouter, Navigate } from 'react-router'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { UserCreatePage } from '@/features/users/pages/UserCreatePage'
import { UserEditPage } from '@/features/users/pages/UserEditPage'
import { UserActivityPage } from '@/features/users/pages/UserActivityPage'
import { AuditLogsPage } from '@/features/audit-logs/pages/AuditLogsPage'
import { MenusPage } from '@/features/menus/pages/MenusPage'
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage'

import { ArticlesPage } from '@/features/articles/pages/ArticlesPage'
import ArticleFormPage from '@/features/articles/pages/ArticleFormPage'
import { ArticleDraftsPage } from '@/features/articles/pages/ArticleDraftsPage'
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
        element: <CategoriesPage />,
      },
      {
        path: 'articles',
        element: <ArticlesPage />,
      },
      {
        path: 'articles/create',
        element: <ArticleFormPage />,
      },
      {
        path: 'articles/:id/edit',
        element: <ArticleFormPage />,
      },
      {
        path: 'articles/drafts',
        element: <ArticleDraftsPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'users/create',
        element: <UserCreatePage />,
      },
      {
        path: 'users/:id/edit',
        element: <UserEditPage />,
      },
      {
        path: 'users/:id/activity',
        element: <UserActivityPage />,
      },
      {
        path: 'audit-logs',
        element: <AuditLogsPage />,
      },
      {
        path: 'menus',
        element: <MenusPage />,
      },

      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
