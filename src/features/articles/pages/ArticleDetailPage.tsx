import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router'
import {
  ArrowLeft,
  Edit,
  Eye,
  Calendar,
  User,
  Tag,
  Globe,
  Info,
  ChevronRight,
  Loader2
} from 'lucide-react'
import dayjs from 'dayjs'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { articleService } from '../services/articleService'
import { getMediaUrl } from '../utils/media'
import { SEO_CONFIG } from '../constants'
import { cn } from '@/lib/utils'

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')

  // Fetch article detail
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['articles', id],
    queryFn: () => articleService.getDetail(id!),
    enabled: !!id,
  })

  // Tính toán dữ liệu hiển thị theo ngôn ngữ chọn
  const displayData = useMemo(() => {
    if (!article) return null

    if (activeTab === 'vi') {
      const vi = article.translations?.vi || {}
      return {
        title: vi.title || article.translations?.vi?.title || '',
        slug: vi.slug || '',
        excerpt: vi.excerpt || '',
        content: vi.content || '',
        seo_title: vi.seo_title || '',
        seo_description: vi.seo_description || '',
        canonical_url: vi.canonical_url || '',
        robots: vi.robots || 'index, follow',
        og_title: vi.og_title || '',
        og_description: vi.og_description || '',
      }
    } else {
      const en = article.translations?.en || {}
      return {
        title: en.title || '',
        slug: en.slug || '',
        excerpt: en.excerpt || '',
        content: en.content || '',
        seo_title: en.seo_title || '',
        seo_description: en.seo_description || '',
        canonical_url: en.canonical_url || '',
        robots: en.robots || 'index, follow',
        og_title: en.og_title || '',
        og_description: en.og_description || '',
      }
    }
  }, [article, activeTab])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Đang tải bản xem trước...</p>
      </div>
    )
  }

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

  // Cover & Thumbnail URLs
  const coverUrl = getMediaUrl(article.cover_object_key || article.thumbnail_object_key)
  const fallbackCover = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80'

  // SEO Fields
  const maxTitleLength = Math.max(0, SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH - SEO_CONFIG.SUFFIX.length)
  const rawSeoTitle = displayData?.seo_title || ''
  
  let cleanSeoTitle = rawSeoTitle
  if (cleanSeoTitle.endsWith(SEO_CONFIG.SUFFIX)) {
    cleanSeoTitle = cleanSeoTitle.slice(0, -SEO_CONFIG.SUFFIX.length)
  }

  const baseTitleFallback = displayData?.title ? (displayData.title.length > maxTitleLength ? displayData.title.slice(0, maxTitleLength) : displayData.title) : ''
  const finalSeoTitle = (cleanSeoTitle.trim() || baseTitleFallback) + SEO_CONFIG.SUFFIX
  
  const fallbackDesc = displayData?.excerpt || (displayData?.content ? displayData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155) : 'Mô tả chi tiết bài viết...')
  const finalSeoDesc = displayData?.seo_description || fallbackDesc

  const renderStatusBadge = (status: typeof article.status) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-0.5 px-2.5 rounded-full hover:bg-emerald-500/10 shadow-none font-semibold text-[10px]">
            Đã xuất bản (Published)
          </Badge>
        )
      case 'SCHEDULED':
        return (
          <Badge className="bg-sky-500/10 text-sky-600 border border-sky-500/20 py-0.5 px-2.5 rounded-full hover:bg-sky-500/10 shadow-none font-semibold text-[10px]">
            Lên lịch (Scheduled)
          </Badge>
        )
      case 'ARCHIVED':
        return (
          <Badge className="bg-zinc-500/10 text-zinc-600 border border-zinc-500/20 py-0.5 px-2.5 rounded-full hover:bg-sky-500/10 shadow-none font-semibold text-[10px]">
            Lưu trữ (Archived)
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* SCOPED CSS FOR HTML CONTENT PRECISE RENDERING */}
      <style>{`
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
          line-height: 1.7;
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
          line-height: 1.6;
          margin-bottom: 0.35rem;
          color: hsl(var(--foreground) / 0.85);
        }
        .article-html-view img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 1.5rem auto;
          display: block;
          border: 1px solid hsl(var(--border) / 0.8);
        }
        .article-html-view blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          font-style: italic;
          color: hsl(var(--muted-foreground));
          margin: 1.25rem 0;
          background-color: hsl(var(--muted) / 0.3);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 4px 4px 0;
          text-align: left;
        }
        .article-html-view a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .article-html-view a:hover {
          color: hsl(var(--primary) / 0.8);
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
          background-color: hsl(var(--muted) / 0.5);
          font-weight: 600;
        }
      `}</style>

      {/* Admin Action Bar (Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Link to="/articles" className="hover:text-primary transition-colors">Quản lý bài viết</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-foreground">Xem trước</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Xem trước bài viết
            <span className="text-xs text-muted-foreground font-normal bg-muted border border-border px-2 py-0.5 rounded-md">
              Live Preview
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link to="/articles" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Link>
          </Button>
          <Button asChild size="sm" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs">
            <Link to={`/articles/${article.id}/edit`} className="gap-1.5">
              <Edit className="h-4 w-4" /> Chỉnh sửa bài viết
            </Link>
          </Button>
        </div>
      </div>

      {/* 2-Column Grid Layout (Shadcn Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - Article View (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card border shadow-xs overflow-hidden">
            {/* Language Selection Header */}
            <div className="px-6 pt-4 border-b flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngôn ngữ hiển thị bản xem trước</span>
              <div className="flex border bg-muted/30 rounded-lg p-0.5 gap-0.5 mb-2">
                {[
                  { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
                  { code: 'en' as const, label: 'Tiếng Anh', flag: '🇬🇧' },
                ].map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setActiveTab(tab.code)}
                    className={cn(
                      "flex items-center gap-1 py-1 px-2.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                      activeTab === tab.code
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{tab.flag}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Category Breadcrumb & Publish Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {article.category?.name || 'Chưa phân loại'}
                </span>
                <div className="flex items-center gap-2">
                  {renderStatusBadge(article.status)}
                  {article.is_featured && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-none font-semibold text-[10px] rounded-full">
                      Nổi bật
                    </Badge>
                  )}
                  {article.is_pinned && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-none font-semibold text-[10px] rounded-full">
                      Ghim
                    </Badge>
                  )}
                </div>
              </div>

              {displayData?.title ? (
                <>
                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-snug text-left font-sans">
                    {displayData.title}
                  </h1>

                  {/* Metadata Info Bar */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Tác giả: <strong className="font-semibold text-foreground/80">{article.author?.full_name}</strong></span>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Đăng lúc: {dayjs(article.published_at || article.created_at).format('HH:mm - DD/MM/YYYY')}</span>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>{article.view_count.toLocaleString()} lượt xem</span>
                    </div>
                  </div>

                  {/* Excerpt */}
                  {displayData.excerpt && (
                    <div className="bg-muted/40 border border-border/80 rounded-lg p-4 text-left">
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">
                        {displayData.excerpt}
                      </p>
                    </div>
                  )}

                  {/* Cover Banner Image */}
                  <div className="rounded-lg overflow-hidden border bg-muted/20 relative aspect-video shadow-3xs max-h-[360px]">
                    <img
                      src={coverUrl || fallbackCover}
                      alt={displayData.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = fallbackCover
                      }}
                    />
                  </div>

                  {/* Article Content Render */}
                  <div className="article-html-view text-left">
                    {displayData.content ? (
                      <div dangerouslySetInnerHTML={{ __html: displayData.content }} />
                    ) : (
                      <p className="text-muted-foreground italic py-16 text-center border border-dashed rounded-lg">
                        Nội dung bài viết rỗng.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
                  <Info className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm italic">
                    {activeTab === 'vi' ? 'Bài viết chưa có tiêu đề Tiếng Việt.' : 'Bài viết chưa cập nhật bản dịch Tiếng Anh.'}
                  </p>
                </div>
              )}

              {/* Tags (Round outlined badges) */}
              {article.tags && article.tags.length > 0 && (
                <div className="pt-6 border-t border-border/80 flex flex-wrap items-center gap-2 text-left">
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    TỪ KHÓA:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => {
                      const tagName = activeTab === 'vi'
                        ? (tag.translations?.vi?.name || tag.name || '')
                        : (tag.translations?.en?.name || tag.translations?.vi?.name || tag.name || '')
                      
                      return tagName ? (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-[11px] font-normal border-slate-200 text-slate-600 bg-slate-50/50 hover:bg-slate-100 cursor-pointer shadow-none px-2.5 py-0.5 rounded-full"
                        >
                          {tagName}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}

            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - SEO Card Inspector (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/15 p-4 border-b border-border/80 flex flex-row items-center gap-2 space-y-0">
              <Globe className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Phân tích SEO & Meta ({activeTab.toUpperCase()})
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 space-y-5 text-left">
              {/* Title tag */}
              <div className="space-y-1.5 border-b pb-4 border-border/50">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Thẻ Title</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    finalSeoTitle.length > SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH
                      ? 'bg-red-50 text-red-600'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {finalSeoTitle.length}/{SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH}
                  </span>
                </div>
                <div className="text-xs bg-muted/30 p-2.5 rounded border font-mono break-all leading-normal text-slate-700 dark:text-slate-300">
                  {finalSeoTitle || '-'}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal italic">
                  * Hậu tố thương hiệu được tự động ghép và không lưu trong database.
                </p>
              </div>

              {/* Description Tag */}
              <div className="space-y-1.5 border-b pb-4 border-border/50">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Thẻ Description</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    finalSeoDesc.length > SEO_CONFIG.MAX_DESCRIPTION_LENGTH
                      ? 'bg-red-50 text-red-600'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {finalSeoDesc.length}/{SEO_CONFIG.MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <div className="text-xs bg-muted/30 p-2.5 rounded border text-muted-foreground leading-relaxed">
                  {finalSeoDesc || '-'}
                </div>
              </div>

              {/* Robots Tag */}
              <div className="space-y-1.5 border-b pb-4 border-border/50">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chỉ thị Robots (robots)
                </div>
                <div className="text-xs bg-muted/30 p-2 rounded border font-mono text-slate-700 dark:text-slate-300">
                  {displayData?.robots || 'index, follow'}
                </div>
              </div>

              {/* Canonical url */}
              <div className="space-y-1.5 border-b pb-4 border-border/50">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Đường dẫn gốc (canonical_url)
                </div>
                <div className="text-xs bg-muted/30 p-2 rounded border font-mono break-all leading-normal text-slate-700 dark:text-slate-300">
                  {displayData?.canonical_url || (displayData?.slug ? `https://kcnt.vinhuni.edu.vn/articles/${displayData.slug}` : '-')}
                </div>
              </div>

              {/* Open Graph Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Thẻ OpenGraph MXH (Facebook/Zalo)
                </div>
                
                <div className="border border-border/80 rounded-lg overflow-hidden bg-background shadow-3xs text-left">
                  <div className="aspect-video bg-muted/10 relative border-b border-border/40">
                    <img
                      src={coverUrl || fallbackCover}
                      alt={displayData?.og_title || displayData?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = fallbackCover
                      }}
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-[9px] text-muted-foreground uppercase font-semibold font-mono tracking-wider">
                      kcnt.vinhuni.edu.vn
                    </div>
                    <div className="text-xs font-bold text-foreground line-clamp-1">
                      {displayData?.og_title || displayData?.title || '-'}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {displayData?.og_description || displayData?.excerpt || 'Đọc chi tiết bài viết trên website Trường Kỹ thuật và Công nghệ - Đại học Vinh.'}
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
