import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { httpClient } from '@/services/http/client'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { toast } from 'sonner'
import { ShieldAlert, User, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react'
import logoDhVinh from '@/assets/logo-dhvinh.png'

const loginSchema = z.object({
  username: z.string().min(3, { message: 'Tên đăng nhập phải từ 3 ký tự' }),
  password: z.string().min(6, { message: 'Mật khẩu phải từ 6 ký tự' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // State ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false)

  // Rate limit state
  const [retryAfter, setRetryAfter] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  // Countdown timer cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRetryAfter(seconds)

    timerRef.current = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const isLocked = retryAfter > 0

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await httpClient.post('/auth/login', {
        username: data.username,
        password: data.password,
      })

      const userResponse = await httpClient.get('/auth/me')
      const user = userResponse.data
      const isAdmin = !!user.is_admin || user.roles?.includes('super_admin') || user.roles?.includes('admin')
      const defaultPath = isAdmin ? '/dashboard' : '/articles'
      const targetPath = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultPath

      login(user, '')
      toast.success('Đăng nhập thành công!')
      navigate(targetPath, { replace: true })
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (err as any).response
      const status = response?.status
      const responseData = response?.data as {
        success?: boolean
        error?: { code?: string; message?: string; details?: { retry_after?: number } }
      } | undefined

      if (status === 429) {
        const waitSeconds = responseData?.error?.details?.retry_after || 60
        startCountdown(waitSeconds)
        return // toast đã bị chặn bởi interceptor, không cần hiển thị thêm
      }

      const errorMessage = responseData?.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      toast.error(errorMessage)
    }
  }

  return (
    <Card className="border border-border/40 shadow-2xl bg-card/85 dark:bg-card/75 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:shadow-primary/5">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex mb-3">
            <img src={logoDhVinh} alt="Đại học Vinh Logo" className="h-16 w-16 object-contain" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground uppercase">
            Đại học Vinh
          </CardTitle>
          <CardDescription className="text-xs font-semibold text-primary mt-1 tracking-wider uppercase">
            TRƯỜNG KỸ THUẬT VÀ CÔNG NGHỆ
          </CardDescription>
          <div className="h-[2px] w-12 bg-primary/40 rounded-full mt-3" />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Rate limit warning */}
        {isLocked && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-destructive">Tạm thời bị khóa</p>
              <p className="text-xs text-muted-foreground">
                Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau{' '}
                <span className="font-semibold text-destructive tabular-nums">{retryAfter}s</span>
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground/80">Tên đăng nhập</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
                      <Input 
                        placeholder="Nhập tài khoản..." 
                        disabled={isLocked} 
                        className="pl-9 bg-background/50 border-border/60 focus-visible:ring-primary"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground/80">Mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="••••••••" 
                        disabled={isLocked} 
                        className="pl-9 pr-9 bg-background/50 border-border/60 focus-visible:ring-primary"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLocked}
                        className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center bg-transparent border-none outline-hidden"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full mt-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 font-bold transition-all shadow-md active:scale-[0.98] h-10"
              disabled={form.formState.isSubmitting || isLocked}
            >
              {isLocked
                ? `Thử lại sau ${retryAfter}s`
                : form.formState.isSubmitting
                  ? 'Đang xác thực...'
                  : 'Đăng nhập cổng quản trị'}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2 text-center text-[10px] text-muted-foreground/80 border-t border-border/40 pt-4 bg-muted/5 dark:bg-transparent">
        <p>Hệ thống chỉ dành cho cán bộ quản lý và biên tập viên được ủy quyền.</p>
      </CardFooter>
    </Card>
  )
}

export default LoginPage
