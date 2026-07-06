import { createBrowserRouter, Navigate } from 'react-router'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { UserCreatePage } from '@/features/users/pages/UserCreatePage'
import { UserEditPage } from '@/features/users/pages/UserEditPage'
import { UserActivityPage } from '@/features/users/pages/UserActivityPage'
import { AuditLogsPage } from '@/features/audit-logs/pages/AuditLogsPage'
import { MenusPage } from '@/features/menus/pages/MenusPage'
import { LanguagesPage } from '@/features/languages/pages/LanguagesPage'
import { AIHubPage } from '@/features/ai-hub/pages/AIHubPage'
import { EmbeddingSettingsPage } from '@/features/ai-hub/pages/EmbeddingSettingsPage'



import { CategoriesPage } from '@/features/categories/pages/CategoriesPage'
import { PositionsPage } from '@/features/positions/pages/PositionsPage'
import { DepartmentsPage } from '@/features/departments/pages/DepartmentsPage'
import { BannersPage } from '@/features/banners/pages/BannersPage'
import { TeachersPage } from '@/features/teachers/pages/TeachersPage'
import TeacherCreatePage from '@/features/teachers/pages/TeacherCreatePage'
import TeacherEditPage from '@/features/teachers/pages/TeacherEditPage'
import TeacherDetailPage from '@/features/teachers/pages/TeacherDetailPage'

import { TagsPage } from '@/features/tags/pages/TagsPage'
import { ArticlesPage } from '@/features/articles/pages/ArticlesPage'
import ArticleFormPage from '@/features/articles/pages/ArticleFormPage'
import ArticleEditPage from '@/features/articles/pages/ArticleEditPage'
import ArticleDetailPage from '@/features/articles/pages/ArticleDetailPage'
import { ArticleDraftsPage } from '@/features/articles/pages/ArticleDraftsPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { ConsultationsPage } from '@/features/consultations/pages/ConsultationsPage'
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
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
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
        path: 'positions',
        element: <PositionsPage />,
      },
      {
        path: 'departments',
        element: <DepartmentsPage />,
      },
      {
        path: 'tags',
        element: <TagsPage />,
      },
      {
        path: 'banners',
        element: <BannersPage />,
      },
      {
        path: 'teachers',
        element: <TeachersPage />,
      },
      {
        path: 'teachers/create',
        element: <TeacherCreatePage />,
      },
      {
        path: 'teachers/:id/edit',
        element: <TeacherEditPage />,
      },
      {
        path: 'teachers/:slug',
        element: <TeacherDetailPage />,
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
        element: <ArticleEditPage />,
      },
      {
        path: 'articles/:id/preview',
        element: <ArticleDetailPage />,
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
        path: 'languages',
        element: <LanguagesPage />,
      },

      {
        path: 'languages/ai-hub',
        element: <AIHubPage />,
      },
      {
        path: 'languages/embedding',
        element: <EmbeddingSettingsPage />,
      },


      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'consultations',
        element: <ConsultationsPage />,
      },

      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
