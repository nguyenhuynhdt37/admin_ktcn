import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, User, Loader2, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { profileService } from '../services/profileService'
import { getMediaUrl } from '@/features/articles/utils/media'
import type { MyProfileResponse } from '../types/profile.types'

interface ProfileInfoTabProps {
  profile: MyProfileResponse
}

export function ProfileInfoTab({ profile }: ProfileInfoTabProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [title, setTitle] = useState(profile.title ?? '')
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url ? getMediaUrl(profile.avatar_url) : null
  )
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setFullName(profile.full_name)
    setPhone(profile.phone ?? '')
    setBio(profile.bio ?? '')
    setTitle(profile.title ?? '')
    setAvatarPreview(profile.avatar_url ? getMediaUrl(profile.avatar_url) : null)
    setAvatarId(null)
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {}
      if (fullName !== profile.full_name) payload.full_name = fullName
      if (phone !== (profile.phone ?? '')) payload.phone = phone || null
      if (bio !== (profile.bio ?? '')) payload.bio = bio || null
      if (title !== (profile.title ?? '')) payload.title = title || null
      if (avatarId) payload.avatar_id = avatarId
      return profileService.updateProfile(payload)
    },
    onSuccess: () => {
      toast.success('Cập nhật hồ sơ thành công')
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Cập nhật hồ sơ thất bại')
    },
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await profileService.uploadAvatar(file)
      setAvatarId(res.id)
      // Preview ngay bằng object URL
      setAvatarPreview(URL.createObjectURL(file))
      toast.success('Tải ảnh lên thành công')
    } catch {
      toast.error('Không thể tải ảnh lên')
    } finally {
      setIsUploading(false)
    }
  }

  const hasChanges =
    fullName !== profile.full_name ||
    phone !== (profile.phone ?? '') ||
    bio !== (profile.bio ?? '') ||
    title !== (profile.title ?? '') ||
    avatarId !== null

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      {/* Avatar */}
      <Card className="group overflow-hidden h-fit">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="relative size-28 rounded-full overflow-hidden border-2 bg-muted flex items-center justify-center shadow-sm group-hover:border-primary/60 transition-colors">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="size-full object-cover transition-transform group-hover:scale-105 duration-200" />
            ) : (
              <User className="size-14 text-muted-foreground/45" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-medium"
            >
              {isUploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Camera className="size-4 mb-0.5" />
                  Thay đổi
                </>
              )}
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <div className="text-center">
            <p className="text-sm font-semibold">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {profile.roles.includes('super_admin') ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật tên, số điện thoại, chức danh và mô tả bản thân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-username">Tên đăng nhập</Label>
              <Input id="profile-username" value={profile.username} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={profile.email} disabled className="bg-muted/50" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-fullname">Họ và tên <span className="text-destructive">*</span></Label>
              <Input
                id="profile-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Số điện thoại</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-title">Chức danh</Label>
            <Input
              id="profile-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Trưởng phòng CNTT"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">Mô tả bản thân</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Viết vài dòng giới thiệu về bạn..."
              rows={4}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!hasChanges || updateMutation.isPending || !fullName.trim()}
              className="gap-2 cursor-pointer"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
