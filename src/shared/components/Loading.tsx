import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  fullPage?: boolean
}

export function Loading({ className, size = 'default', fullPage = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const spinner = (
    <Loader2
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
    />
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          {spinner}
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      {spinner}
    </div>
  )
}
