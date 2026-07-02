import { Outlet } from 'react-router'
import bgImage from '@/assets/vinh-university-bg.png'

export function AuthLayout() {
  return (
    <div 
      className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-6 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay phủ tối màu kết hợp blur nhẹ giúp nâng cao chiều sâu và độ tương phản cho Form */}
      <div className="absolute inset-0 bg-slate-950/45 dark:bg-slate-950/60 backdrop-blur-[3px]" />
      
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
