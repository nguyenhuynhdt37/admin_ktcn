import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { profileService } from '../services/profileService'

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const changePwdMutation = useMutation({
    mutationFn: () =>
      profileService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Đổi mật khẩu thất bại'
      toast.error(msg)
    },
  })

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !changePwdMutation.isPending

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Đổi mật khẩu
        </CardTitle>
        <CardDescription>
          Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi. Mật khẩu mới tối thiểu 6 ký tự.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pwd-current">Mật khẩu hiện tại</Label>
          <div className="relative">
            <Input
              id="pwd-current"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pwd-new">Mật khẩu mới</Label>
          <div className="relative">
            <Input
              id="pwd-new"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-xs text-destructive">Mật khẩu phải có ít nhất 6 ký tự</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pwd-confirm">Xác nhận mật khẩu mới</Label>
          <div className="relative">
            <Input
              id="pwd-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordMismatch && (
            <p className="text-xs text-destructive">Mật khẩu xác nhận không khớp</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => changePwdMutation.mutate()}
            disabled={!canSubmit}
            className="gap-2 cursor-pointer"
          >
            {changePwdMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Đổi mật khẩu
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
