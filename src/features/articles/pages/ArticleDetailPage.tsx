import { Link } from 'react-router'
import { ArrowLeft, Edit, Info, Loader2, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { cn } from '@/lib/utils'

import { useArticlePreview } from '../hooks/useArticlePreview'
import ArticlePreviewContent from '../components/preview/ArticlePreviewContent'
import ArticleSeoInspector from '../components/preview/ArticleSeoInspector'

const LANG_TABS = [
  { code: 'vi' as const, label: 'Tiếng Việt' },
  { code: 'en' as const, label: 'English' },
] as const

export default function ArticleDetailPage() {
  const {
    article,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    displayData,
    coverUrl,
    fallbackCover,
    seoAnalysis,
    isAuthor,
  } = useArticlePreview()

  // Loading State
  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Đang tải bản xem trước...
        </p>
      </div>
    )
  }

  // Error State
  if (error || !article) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center p-6 bg-card border rounded-xl shadow-xs max-w-md mx-auto my-12">
        <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
          <Info className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Không tìm thấy bài viết</h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-xs leading-relaxed">
          Không thể tải thông tin bài viết. Bài viết có thể đã bị xóa hoặc đường dẫn không hợp lệ.
        </p>
        <Button asChild className="mt-6 cursor-pointer" variant="outline" size="sm">
          <Link to="/articles" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-left">
      {/* Scoped CSS for HTML content rendering */}
      <style>{articleHtmlStyles}</style>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Link to="/articles" className="hover:text-primary transition-colors">
              Quản lý bài viết
            </Link>
            <ChevronRight className="h-3 w-3 text-border" />
            <span className="text-foreground">Xem trước</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Xem trước bài viết
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link to="/articles" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Link>
          </Button>
          {isAuthor && (
            <Button asChild size="sm" className="cursor-pointer font-semibold shadow-xs">
              <Link to={`/articles/${article.id}/edit`} className="gap-1.5">
                <Edit className="h-4 w-4" /> Chỉnh sửa
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN — Article Preview (8/12) */}
        <div className="lg:col-span-8">
          <Card className="border shadow-xs overflow-hidden">
            {/* Language Tabs */}
            <div className="px-5 pt-3 pb-2 border-b border-border/60 flex items-center justify-between bg-muted/15">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Ngôn ngữ xem trước
              </span>
              <div className="flex border bg-muted/30 rounded-lg p-0.5 gap-0.5">
                {LANG_TABS.map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setActiveTab(tab.code)}
                    className={cn(
                      'flex items-center gap-1 py-1 px-2.5 rounded-md text-[10px] font-bold transition-all cursor-pointer',
                      activeTab === tab.code
                        ? 'bg-card text-foreground shadow-xs border border-border/60'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {displayData && (
              <ArticlePreviewContent
                article={article}
                displayData={displayData}
                activeTab={activeTab}
                coverUrl={coverUrl}
                fallbackCover={fallbackCover}
              />
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN — SEO Inspector (4/12) */}
        <div className="lg:col-span-4">
          {seoAnalysis && (
            <ArticleSeoInspector
              seoAnalysis={seoAnalysis}
              activeTab={activeTab}
              coverUrl={coverUrl}
              fallbackCover={fallbackCover}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Scoped CSS cho nội dung HTML bài viết.
 * Được tách thành hằng string để giữ JSX gọn gàng.
 */
const articleHtmlStyles = `
  .article-html-view h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.3;
    text-align: left;
  }
  .article-html-view h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    line-height: 1.3;
    text-align: left;
  }
  .article-html-view p {
    font-size: 15px;
    line-height: 1.75;
    color: hsl(var(--foreground) / 0.85);
    margin-bottom: 1.15rem;
    text-align: justify;
  }
  .article-html-view strong {
    font-weight: 700;
    color: hsl(var(--foreground));
  }
  .article-html-view ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 1.15rem;
    text-align: left;
  }
  .article-html-view ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 1.15rem;
    text-align: left;
  }
  .article-html-view li {
    font-size: 15px;
    line-height: 1.65;
    margin-bottom: 0.35rem;
    color: hsl(var(--foreground) / 0.85);
  }
  .article-html-view img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 1.5rem auto;
    display: block;
    border: 1px solid hsl(var(--border) / 0.6);
  }
  .article-html-view blockquote {
    border-left: 3px solid hsl(var(--primary) / 0.5);
    padding: 0.75rem 1rem;
    font-style: italic;
    color: hsl(var(--muted-foreground));
    margin: 1.25rem 0;
    background-color: hsl(var(--muted) / 0.25);
    border-radius: 0 6px 6px 0;
    text-align: left;
  }
  .article-html-view a {
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .article-html-view a:hover {
    color: hsl(var(--primary) / 0.75);
  }
  .article-html-view table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.25rem 0;
  }
  .article-html-view th, .article-html-view td {
    border: 1px solid hsl(var(--border));
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-size: 14px;
  }
  .article-html-view th {
    background-color: hsl(var(--muted) / 0.4);
    font-weight: 600;
  }
`
