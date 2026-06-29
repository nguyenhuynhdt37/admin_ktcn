import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/lib/utils'

interface AccountDetailsSectionProps {
  isEditMode: boolean
  username: string
  setUsername: (username: string) => void
  email: string
  setEmail: (email: string) => void
  fullName: string
  setFullName: (name: string) => void
  phone: string
  setPhone: (phone: string) => void
  password?: string
  setPassword?: (password: string) => void
  confirmPassword?: string
  setConfirmPassword?: (password: string) => void
  emailError: string | null
  isCheckingEmail: boolean
  usernameError?: string | null
  isCheckingUsername?: boolean
  disabled?: boolean
}

export function AccountDetailsSection({
  isEditMode,
  username,
  setUsername,
  email,
  setEmail,
  fullName,
  setFullName,
  phone,
  setPhone,
  password = '',
  setPassword,
  confirmPassword = '',
  setConfirmPassword,
  emailError,
  isCheckingEmail,
  usernameError = null,
  isCheckingUsername = false,
  disabled = false,
}: AccountDetailsSectionProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin tài khoản</CardTitle>
        <CardDescription>Các thông tin cơ bản dùng để xác thực và định danh.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Tên đăng nhập *</Label>
            <div className="relative">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isEditMode || disabled}
                placeholder="Ví dụ: hoang_editor"
                className={cn(
                  "pr-9",
                  usernameError && 'border-destructive focus-visible:ring-destructive'
                )}
                required
              />
              {isCheckingUsername && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {usernameError && (
              <p className="text-[10px] text-destructive font-medium mt-1">{usernameError}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Địa chỉ Email *</Label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditMode || disabled}
                placeholder="hoang.editor@university.edu.vn"
                className={cn(
                  "pr-9",
                  emailError && 'border-destructive focus-visible:ring-destructive'
                )}
                required
              />
              {isCheckingEmail && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {emailError && (
              <p className="text-[10px] text-destructive font-medium mt-1">{emailError}</p>
            )}
          </div>

          {/* Password Fields */}
          {!isEditMode && setPassword && setConfirmPassword && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Mật khẩu tài khoản *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword?.(e.target.value)}
                    disabled={disabled}
                    placeholder="Mật khẩu bảo mật..."
                    className="pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Xác nhận mật khẩu *</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword?.(e.target.value)}
                    disabled={disabled}
                    placeholder="Nhập lại mật khẩu..."
                    className="pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Họ và Tên *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={disabled}
              placeholder="Ví dụ: Nguyễn Minh Hoàng"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Số điện thoại</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={disabled}
              placeholder="Ví dụ: 0912345678"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
