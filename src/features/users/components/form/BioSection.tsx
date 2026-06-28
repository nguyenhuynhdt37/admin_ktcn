import { useState, useEffect, useCallback } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { CmsEditor } from '@/shared/components/CmsEditor'

interface BioSectionProps {
  bio: string
  setBio: (bio: string) => void
}

export function BioSection({ bio, setBio }: BioSectionProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsFullscreen(false)
  }, [])

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isFullscreen, handleEsc])

  // Inline editor (thu gọn)
  const inlineEditor = (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Tiểu sử & Thông tin cá nhân (Bio)</CardTitle>
          <CardDescription>Soạn thảo hồ sơ tóm tắt của thành viên hiển thị trên trang tác giả.</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Phóng to</span>
        </Button>
      </CardHeader>

      <CardContent>
        <CmsEditor
          value={bio}
          onChange={setBio}
          placeholder="Giới thiệu chi tiết kỹ năng, kinh nghiệm biên tập, hoặc tiểu sử của thành viên..."
          minHeight={280}
          maxHeight={350}
        />
      </CardContent>
    </Card>
  )

  // Fullscreen overlay
  const fullscreenEditor = isFullscreen ? (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3 bg-card shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tiểu sử & Thông tin cá nhân (Bio)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Esc</kbd> hoặc nút Thu nhỏ để thoát chế độ toàn màn hình
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsFullscreen(false)}
          className="gap-1.5 cursor-pointer"
        >
          <Minimize2 className="h-4 w-4" />
          Thu nhỏ
        </Button>
      </div>

      {/* Editor chiếm toàn bộ không gian */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 ck-editor-fullscreen">
        <CmsEditor
          value={bio}
          onChange={setBio}
          placeholder="Giới thiệu chi tiết kỹ năng, kinh nghiệm biên tập, hoặc tiểu sử của thành viên..."
          minHeight={400}
          maxHeight={9999}
        />
      </div>
    </div>
  ) : null

  return (
    <>
      {inlineEditor}
      {fullscreenEditor}
    </>
  )
}
