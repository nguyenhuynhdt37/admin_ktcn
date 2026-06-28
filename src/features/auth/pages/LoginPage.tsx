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
import { ShieldAlert } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(3, { message: 'Tên đăng nhập phải từ 3 ký tự' }),
  password: z.string().min(6, { message: 'Mật khẩu phải từ 6 ký tự' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Rate limit state
  const [retryAfter, setRetryAfter] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin',
      password: 'adminpassword',
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
      const loginResponse = await httpClient.post('/auth/login', {
        username: data.username,
        password: data.password,
      })
      const { access_token } = loginResponse.data

      const userResponse = await httpClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      login(userResponse.data, access_token)
      toast.success('Đăng nhập thành công!')
      navigate(from, { replace: true })
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
    <Card className="border shadow-md bg-card text-card-foreground">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Đăng nhập Admin</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Cổng thông tin quản trị Trường Kỹ thuật Công nghệ (KTCN)
        </CardDescription>
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
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tài khoản (ví dụ: admin)..." disabled={isLocked} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" disabled={isLocked} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full mt-2 cursor-pointer"
              disabled={form.formState.isSubmitting || isLocked}
            >
              {isLocked
                ? `Thử lại sau ${retryAfter}s`
                : form.formState.isSubmitting
                  ? 'Đang xác thực...'
                  : 'Đăng nhập'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground border-t pt-4">
        <p>Tài khoản mặc định của Trường: admin / adminpassword</p>
      </CardFooter>
    </Card>
  )
}
export default LoginPage
