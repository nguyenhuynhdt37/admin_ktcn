import { useRef } from 'react'
import { Camera, User, Loader2 } from 'lucide-react'
import { usersService } from '../../services/usersService'
import { Card, CardContent } from '@/shared/components/ui/card'
import { toast } from 'sonner'

interface AvatarSectionProps {
  avatarUrl: string | null
  isUploading: boolean
  setIsUploading: (uploading: boolean) => void
  setAvatarId: (id: string | null) => void
  setAvatarUrl: (url: string | null) => void
  disabled?: boolean
}

export function AvatarSection({
  avatarUrl,
  isUploading,
  setIsUploading,
  setAvatarId,
  setAvatarUrl,
  disabled,
}: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const res = await usersService.uploadAvatar(file)
      setAvatarId(res.id)
      const url = await usersService.getMediaUrl(res.id)
      setAvatarUrl(url)
      toast.success('Tải ảnh đại diện lên thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh đại diện lên')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="group overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative size-24 rounded-full overflow-hidden border bg-muted flex items-center justify-center shadow-sm group-hover:border-primary/60 transition-colors">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="size-full object-cover transition-transform group-hover:scale-105 duration-200" />
          ) : (
            <User className="size-12 text-muted-foreground/45" />
          )}
          
          {!disabled && (
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
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          className="hidden"
        />
        
        <div className="text-center">
          <h4 className="text-sm font-semibold text-foreground">Ảnh đại diện</h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">
            Nên chọn ảnh vuông, tỷ lệ 1:1, tối đa 2MB
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
