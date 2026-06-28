import { useState } from 'react'
import { CmsEditor } from '@/shared/components/CmsEditor'
import { SEOAssistantWidget } from '@/features/ai-settings/components/SEOAssistantWidget'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'

export function EditorTestPage() {
  const [title, setTitle] = useState('Thông báo tuyển sinh Đại học 2026')
  const [description, setDescription] = useState(
    'Viện Kỹ thuật và Công nghệ thông báo xét tuyển đại học chính quy năm 2026 bằng học bạ và điểm thi THPT.'
  )
  const [content, setContent] = useState(
    '<p>Chi tiết kế hoạch tuyển sinh của Viện Kỹ thuật và Công nghệ năm 2026...</p>'
  )

  // State SEO
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')

  const handleSEOGenerated = (data: { seo_title: string; seo_description: string; seo_keywords: string }) => {
    setSeoTitle(data.seo_title)
    setSeoDescription(data.seo_description)
    setSeoKeywords(data.seo_keywords)
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Thử nghiệm Biên tập & Trợ lý SEO AI</h2>
        <p className="text-sm text-muted-foreground">
          Trang giả lập form soạn thảo bài viết/trang tĩnh tích hợp trợ lý tối ưu SEO bằng AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form soạn thảo chính */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-foreground/90">Nội dung bài viết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-foreground/80">Tiêu đề bài viết</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold text-foreground/80">Tóm tắt ngắn</Label>
                <textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập tóm tắt..."
                  rows={3}
                  className="flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Nội dung chi tiết</Label>
                <CmsEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Gõ nội dung tại đây..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar cấu hình SEO */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-foreground/90">Cấu hình Meta SEO</CardTitle>
              <CardDescription className="text-xs">
                Tối ưu hóa hiển thị bài viết trên công cụ tìm kiếm Google.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Widget trợ lý SEO AI */}
              <SEOAssistantWidget
                title={title}
                description={description}
                content={content}
                onSEOGenerated={handleSEOGenerated}
              />

              <div className="space-y-1.5">
                <Label htmlFor="seoTitle" className="text-xs font-semibold text-foreground/80">Tiêu đề SEO (Meta Title)</Label>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Tiêu đề hiển thị trên Google..."
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seoDesc" className="text-xs font-semibold text-foreground/80">Mô tả SEO (Meta Description)</Label>
                <textarea
                  id="seoDesc"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt hiển thị trên Google..."
                  rows={4}
                  className="flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seoKeywords" className="text-xs font-semibold text-foreground/80">Từ khóa SEO (Keywords)</Label>
                <Input
                  id="seoKeywords"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="tuyen sinh 2026, khoa cntt..."
                  className="h-9 text-xs"
                />
                <p className="text-[9px] text-muted-foreground leading-normal">
                  Ngăn cách các từ khóa bằng dấu phẩy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
