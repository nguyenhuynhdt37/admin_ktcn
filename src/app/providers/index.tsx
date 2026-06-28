import type { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { Toaster } from 'sonner'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </TooltipProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
