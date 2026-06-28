import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 md:p-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
