import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Camera, Image as ImageIcon, Loader2, Trash } from 'lucide-react'
import { articleService } from '../../services/articleService'
import { toast } from 'sonner'
import { getMediaUrl } from '../../utils/media'

interface ArticleMediaSectionProps {
  thumbnailKey: string | null
  setThumbnailKey: (key: string | null) => void
  coverKey: string | null
  setCoverKey: (key: string | null) => void
  disabled?: boolean
}

export function ArticleMediaSection({
  thumbnailKey,
  setThumbnailKey,
  coverKey,
  setCoverKey,
  disabled = false,
}: ArticleMediaSectionProps) {
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [thumbUploading, setThumbUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Sync previews with initial keys (mostly for edit mode or initial render)
  useEffect(() => {
    if (thumbnailKey) {
      setThumbPreview(getMediaUrl(thumbnailKey))
    } else {
      setThumbPreview(null)
    }
  }, [thumbnailKey])

  useEffect(() => {
    if (coverKey) {
      setCoverPreview(getMediaUrl(coverKey))
    } else {
      setCoverPreview(null)
    }
  }, [coverKey])

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setThumbUploading(true)
    // Hiển thị preview local lập tức
    const localUrl = URL.createObjectURL(file)
    setThumbPreview(localUrl)

    try {
      const res = await articleService.uploadMedia(file)
      setThumbnailKey(res.object_key)
      toast.success('Tải ảnh đại diện lên thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh đại diện lên.')
      setThumbPreview(null)
    } finally {
      setThumbUploading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverUploading(true)
    // Hiển thị preview local lập tức
    const localUrl = URL.createObjectURL(file)
    setCoverPreview(localUrl)

    try {
      const res = await articleService.uploadMedia(file)
      setCoverKey(res.object_key)
      toast.success('Tải ảnh bìa lên thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh bìa lên.')
      setCoverPreview(null)
    } finally {
      setCoverUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Thumbnail Upload Card */}
      <Card className="bg-card text-card-foreground overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Ảnh đại diện (Thumbnail)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col items-center justify-center p-4">
          <div className="relative w-full aspect-video md:aspect-[4/3] rounded-lg overflow-hidden border bg-muted flex items-center justify-center group shadow-xs">
            {thumbPreview ? (
              <img
                src={thumbPreview}
                alt="Thumbnail Preview"
                className="size-full object-cover transition-transform group-hover:scale-105 duration-200"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground/60 p-4">
                <Camera className="size-8 mb-2 opacity-50" />
                <span className="text-[11px] font-medium">Chưa có ảnh đại diện</span>
              </div>
            )}

            {!disabled && !thumbUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-semibold cursor-pointer"
                  onClick={() => thumbInputRef.current?.click()}
                >
                  Tải ảnh lên
                </Button>
                {thumbPreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => {
                      setThumbnailKey(null)
                      setThumbPreview(null)
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {thumbUploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={thumbInputRef}
            onChange={handleThumbUpload}
            accept="image/*"
            className="hidden"
            disabled={disabled}
          />
          <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
            Ảnh hiển thị trong danh sách. Tỷ lệ khuyên dùng 4:3 hoặc 1:1, tối đa 2MB.
          </p>
        </CardContent>
      </Card>

      {/* Cover Upload Card */}
      <Card className="bg-card text-card-foreground overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Ảnh bìa bài viết (Cover)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col items-center justify-center p-4">
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border bg-muted flex items-center justify-center group shadow-xs">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover Preview"
                className="size-full object-cover transition-transform group-hover:scale-105 duration-200"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground/60 p-4">
                <ImageIcon className="size-8 mb-2 opacity-50" />
                <span className="text-[11px] font-medium">Chưa có ảnh bìa</span>
              </div>
            )}

            {!disabled && !coverUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-semibold cursor-pointer"
                  onClick={() => coverInputRef.current?.click()}
                >
                  Tải ảnh lên
                </Button>
                {coverPreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => {
                      setCoverKey(null)
                      setCoverPreview(null)
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {coverUploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
            disabled={disabled}
          />
          <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
            Ảnh rộng hiển thị ở đầu bài viết. Tỷ lệ khuyên dùng 16:9, tối đa 2MB.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
