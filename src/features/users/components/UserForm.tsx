import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { usersService } from '../services/usersService'
import { AvatarSection } from './form/AvatarSection'
import { AccountDetailsSection } from './form/AccountDetailsSection'
import { BioSection } from './form/BioSection'
import { StatusSection } from './form/StatusSection'

interface UserFormProps {
  userId?: string | null
}

export function UserForm({ userId }: UserFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isEditMode = !!userId
  
  const canSave = true

  // Form States
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Real-time Email Duplicate Check with 500ms Debounce
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // Real-time Username Duplicate Check with 500ms Debounce
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  // Fetch user detail in Edit Mode
  const { data: userDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersService.getDetail(userId!),
    enabled: isEditMode,
  })

  // Sync state with user detail
  useEffect(() => {
    if (isEditMode && userDetail) {
      setUsername(userDetail.username)
      setEmail(userDetail.email)
      setFullName(userDetail.full_name)
      setPhone(userDetail.phone || '')
      setBio(userDetail.bio || '')
      setAvatarId(userDetail.avatar_id)
      setIsActive(userDetail.is_active)

      if (userDetail.avatar_id) {
        usersService.getMediaUrl(userDetail.avatar_id)
          .then((url) => setAvatarUrl(url))
          .catch(() => setAvatarUrl(null))
      } else {
        setAvatarUrl(null)
      }
    }
  }, [isEditMode, userDetail])

  // Username check effect
  useEffect(() => {
    if (isEditMode || !username.trim()) {
      setUsernameError(null)
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(username)) {
      setUsernameError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true)
      try {
        const res = await usersService.checkUsername(username)
        if (res.exists) {
          setUsernameError('Tên đăng nhập này đã được sử dụng')
        } else {
          setUsernameError(null)
        }
      } catch (err) {
        console.error('Failed to validate username duplicate', err)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username, isEditMode])

  // Email check effect
  useEffect(() => {
    if (isEditMode || !email.trim()) {
      setEmailError(null)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true)
      try {
        const res = await usersService.checkEmail(email)
        if (res.exists) {
          setEmailError('Địa chỉ email này đã được sử dụng bởi thành viên khác')
        } else {
          setEmailError(null)
        }
      } catch (err) {
        console.error('Failed to validate email duplicate', err)
      } finally {
        setIsCheckingEmail(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [email, isEditMode])

  // Mutation Create / Update
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
        avatar_id: avatarId,
        is_active: isActive,
      }

      if (isEditMode) {
        return usersService.update(userId!, payload)
      } else {
        payload.username = username
        payload.email = email
        payload.password = password
        return usersService.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Cập nhật thành viên thành công!' : 'Thêm thành viên mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users')
    },
    onError: (err: any) => {
      const errorData = err?.response?.data?.error
      const code = errorData?.code

      if (code === 'USERNAME_DUPLICATE') {
        toast.error('Tên đăng nhập đã tồn tại trên hệ thống.')
      } else if (code === 'EMAIL_DUPLICATE') {
        toast.error('Địa chỉ email đã được sử dụng bởi người dùng khác.')
      } else if (code === 'AVATAR_NOT_FOUND') {
        toast.error('Lỗi: Ảnh đại diện không tồn tại trong hệ thống media.')
      } else {
        toast.error(errorData?.message || 'Không thể lưu thông tin thành viên')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSave) {
      toast.error('Bạn không có quyền thực hiện thao tác này.')
      return
    }

    // 1. Full name validation
    if (fullName.trim().length < 2 || fullName.trim().length > 50) {
      toast.error('Họ và tên phải từ 2 đến 50 ký tự')
      return
    }

    if (!isEditMode) {
      // 2. Username validation
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
      if (!usernameRegex.test(username)) {
        toast.error('Tên đăng nhập phải từ 3-30 ký tự, chỉ chứa chữ cái, số, gạch dưới (_) hoặc gạch ngang (-)')
        return
      }
      if (usernameError) {
        toast.error('Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác')
        return
      }

      // 3. Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast.error('Địa chỉ email không đúng định dạng')
        return
      }
      if (emailError) {
        toast.error('Email đã được sử dụng, vui lòng chọn email khác')
        return
      }

      // 4. Password validation
      if (!password || password.length < 6) {
        toast.error('Mật khẩu phải chứa ít nhất 6 ký tự')
        return
      }

      // 5. Password confirmation validation
      if (password !== confirmPassword) {
        toast.error('Mật khẩu xác nhận không trùng khớp')
        return
      }
    }

    // 6. Phone validation (if provided)
    if (phone && !/^[0-9+]{9,15}$/.test(phone)) {
      toast.error('Số điện thoại không hợp lệ (phải từ 9-15 số)')
      return
    }

    saveMutation.mutate()
  }

  if (isEditMode && isLoadingDetail) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Đang tải thông tin thành viên...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/users')}
            className="gap-1.5 -ml-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isEditMode ? 'Cập nhật thành viên' : 'Thêm thành viên mới'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditMode ? 'Chỉnh sửa thông tin tài khoản thành viên' : 'Tạo mới một tài khoản quản trị CMS'}
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-8) - Account Info & Bio */}
        <div className="lg:col-span-8 space-y-6">
          <AccountDetailsSection
            isEditMode={isEditMode}
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            emailError={emailError}
            isCheckingEmail={isCheckingEmail}
            usernameError={usernameError}
            isCheckingUsername={isCheckingUsername}
            disabled={!canSave}
          />

          <BioSection
            key={userId || 'new'}
            bio={bio}
            setBio={setBio}
            disabled={!canSave}
          />
        </div>

        {/* Right Column (col-span-4) - Sidebar Actions (sticky) */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-4 space-y-6">
            <AvatarSection
              avatarUrl={avatarUrl}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              setAvatarId={setAvatarId}
              setAvatarUrl={setAvatarUrl}
              disabled={!canSave}
            />

            <StatusSection
              isActive={isActive}
              setIsActive={setIsActive}
              disabled={!canSave}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="lg:col-span-12 flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/users')}
            className="cursor-pointer"
          >
            Hủy bỏ
          </Button>
          {canSave && (
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="cursor-pointer"
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Xác nhận lưu'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
