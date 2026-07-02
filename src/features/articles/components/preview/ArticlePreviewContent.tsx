import { Badge } from '@/shared/components/ui/badge'
import { Calendar, User, Eye, Tag, Clock, BookOpen } from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import type { Article } from '../types/articles.types'
import type { DisplayData, PreviewLang } from '../hooks/useArticlePreview'

interface ArticlePreviewContentProps {
  article: Article
  displayData: DisplayData
  activeTab: PreviewLang
  coverUrl: string
  fallbackCover: string
}

/** Badge trạng thái bài viết */
function StatusBadge({ status }: { status: Article['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    PUBLISHED: {
      label: 'Đã xuất bản',
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    },
    SCHEDULED: {
      label: 'Lên lịch',
      className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
    },
    ARCHIVED: {
      label: 'Lưu trữ',
      className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25',
    },
  }
  const cfg = config[status]
  if (!cfg) return null
  return (
    <Badge
      className={cn(
        'py-0.5 px-2.5 rounded-full hover:bg-transparent shadow-none font-semibold text-[10px] border',
        cfg.className
      )}
    >
      {cfg.label}
    </Badge>
  )
}

export default function ArticlePreviewContent({
  article,
  displayData,
  activeTab,
  coverUrl,
  fallbackCover,
}: ArticlePreviewContentProps) {
  if (!displayData.title) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
          <BookOpen className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium">
          {activeTab === 'vi'
            ? 'Bài viết chưa có tiêu đề Tiếng Việt.'
            : 'Bài viết chưa cập nhật bản dịch Tiếng Anh.'}
        </p>
      </div>
    )
  }

  const publishedDate = article.published_at || article.created_at

  return (
    <article className="space-y-0">
      {/* Cover Image - chiếm full width phía trên */}
      <div className="relative overflow-hidden rounded-t-lg aspect-[21/9] max-h-[340px] bg-muted/20">
        <img
          src={coverUrl}
          alt={displayData.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = fallbackCover
          }}
        />
        {/* Gradient overlay nhẹ phía dưới */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Article Body */}
      <div className="px-7 py-6 md:px-10 md:py-8 space-y-5">
        {/* Category + Status Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary bg-primary/5 rounded-md px-2.5 py-0.5 shadow-none"
          >
            {article.category?.name || 'Chưa phân loại'}
          </Badge>
          <StatusBadge status={article.status} />
          {article.is_featured && (
            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 shadow-none font-semibold text-[10px] rounded-full px-2.5 py-0.5 hover:bg-transparent">
              ★ Nổi bật
            </Badge>
          )}
          {article.is_pinned && (
            <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 shadow-none font-semibold text-[10px] rounded-full px-2.5 py-0.5 hover:bg-transparent">
              📌 Ghim
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[1.75rem] md:text-[2rem] font-extrabold text-foreground tracking-tight leading-[1.2] text-left">
          {displayData.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted-foreground pb-5 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              <span className="font-semibold text-foreground/80">{article.author?.full_name}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dayjs(publishedDate).format('DD/MM/YYYY, HH:mm')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span>{article.view_count.toLocaleString()} lượt xem</span>
          </div>
          {article.reading_time > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{article.reading_time} phút đọc</span>
            </div>
          )}
        </div>

        {/* Excerpt */}
        {displayData.excerpt && (
          <div className="relative pl-4 border-l-[3px] border-primary/40 py-1">
            <p className="text-sm text-foreground/75 leading-relaxed italic">
              {displayData.excerpt}
            </p>
          </div>
        )}

        {/* Article Content */}
        <div className="article-html-view text-left">
          {displayData.content ? (
            <div dangerouslySetInnerHTML={{ __html: displayData.content }} />
          ) : (
            <div className="py-16 text-center text-muted-foreground border border-dashed rounded-lg">
              <p className="italic text-sm">Nội dung bài viết rỗng.</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-5 border-t border-border/60 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 mr-1">
              <Tag className="h-3.5 w-3.5" />
              TỪ KHÓA:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => {
                const tagName =
                  activeTab === 'vi'
                    ? tag.translations?.vi?.name || tag.name || ''
                    : tag.translations?.en?.name || tag.translations?.vi?.name || tag.name || ''
                return tagName ? (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[11px] font-normal border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 cursor-pointer shadow-none px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    {tagName}
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
