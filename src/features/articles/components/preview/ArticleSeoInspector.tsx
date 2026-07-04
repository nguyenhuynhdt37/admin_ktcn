import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Globe,
  Search,
  Shield,
  Link2,
  Share2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeoAnalysis, PreviewLang } from '../hooks/useArticlePreview'

interface ArticleSeoInspectorProps {
  seoAnalysis: SeoAnalysis
  activeTab: PreviewLang
  coverUrl: string
  fallbackCover: string
}

/** Hiển thị thanh progress cho char count */
function CharCounter({
  current,
  max,
  isOver,
}: {
  current: number
  max: number
  isOver: boolean
}) {
  const percentage = Math.min((current / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isOver ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          'text-[10px] font-mono font-semibold tabular-nums',
          isOver ? 'text-red-600' : 'text-muted-foreground'
        )}
      >
        {current}/{max}
      </span>
    </div>
  )
}

/** Row hiển thị meta field */
function MetaField({
  icon: Icon,
  label,
  value,
  children,
  isLast = false,
}: {
  icon: React.ElementType
  label: string
  value?: string
  children?: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className={cn('space-y-2', !isLast && 'pb-4 border-b border-border/40')}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{label}</span>
      </div>
      {children || (
        <div className="text-[12px] bg-muted/30 px-3 py-2 rounded-md border font-mono break-all leading-relaxed text-foreground/70">
          {value || <span className="text-muted-foreground italic">—</span>}
        </div>
      )}
    </div>
  )
}

export default function ArticleSeoInspector({
  seoAnalysis,
  activeTab,
  coverUrl,
  fallbackCover,
}: ArticleSeoInspectorProps) {
  return (
    <div className="space-y-4">
      {/* SEO Score Card */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center gap-2 space-y-0 bg-muted/20">
          <Globe className="h-4 w-4 text-primary" />
          <CardTitle className="font-bold text-xs uppercase tracking-wider text-foreground/80">
            Phân tích SEO ({activeTab.toUpperCase()})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4 text-left">
          {/* Title Tag */}
          <MetaField icon={Search} label="Thẻ Title">
            <div className="space-y-1.5">
              <div className="text-[12px] bg-muted/30 px-3 py-2 rounded-md border break-all leading-relaxed text-foreground/70">
                {seoAnalysis.finalTitle}
              </div>
              <CharCounter
                current={seoAnalysis.titleLength}
                max={seoAnalysis.maxTitleLength}
                isOver={seoAnalysis.isTitleOverLimit}
              />
              <p className="text-[10px] text-muted-foreground italic leading-normal">
                * Hậu tố thương hiệu được ghép tự động, không lưu vào DB.
              </p>
            </div>
          </MetaField>

          {/* Description Tag */}
          <MetaField icon={Search} label="Thẻ Description">
            <div className="space-y-1.5">
              <div className="text-[12px] bg-muted/30 px-3 py-2 rounded-md border leading-relaxed text-muted-foreground">
                {seoAnalysis.finalDescription}
              </div>
              <CharCounter
                current={seoAnalysis.descriptionLength}
                max={seoAnalysis.maxDescriptionLength}
                isOver={seoAnalysis.isDescOverLimit}
              />
            </div>
          </MetaField>

          {/* Robots */}
          <MetaField icon={Shield} label="Chỉ thị Robots" value={seoAnalysis.robots} />

          {/* Canonical URL */}
          <MetaField icon={Link2} label="Đường dẫn gốc (canonical)" value={seoAnalysis.canonicalUrl} />

          {/* SEO Quick Check */}
          <div className="space-y-2 pb-4 border-b border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Kiểm tra nhanh</span>
            </div>
            <div className="space-y-1">
              {[
                {
                  ok: !!seoAnalysis.finalTitle && !seoAnalysis.isTitleOverLimit,
                  label: 'Title tag hợp lệ',
                },
                {
                  ok: !!seoAnalysis.finalDescription && !seoAnalysis.isDescOverLimit,
                  label: 'Description hợp lệ',
                },
                {
                  ok: !!seoAnalysis.canonicalUrl,
                  label: 'Có canonical URL',
                },
                {
                  ok: !!seoAnalysis.ogTitle,
                  label: 'Có OG Title',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {item.ok ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                  <span className={item.ok ? 'text-foreground/70' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* OpenGraph Preview */}
          <MetaField icon={Share2} label="OpenGraph MXH (Facebook/Zalo)" isLast>
            <div className="border border-border/60 rounded-lg overflow-hidden bg-background shadow-xs">
              <div className="aspect-video bg-muted/10 relative border-b border-border/40">
                <img
                  src={coverUrl}
                  alt={seoAnalysis.ogTitle}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = fallbackCover
                  }}
                />
              </div>
              <div className="p-3 space-y-0.5">
                <div className="text-[9px] text-muted-foreground uppercase font-semibold font-mono tracking-wider">
                  kcnt.vinhuni.edu.vn
                </div>
                <div className="text-xs font-bold text-foreground line-clamp-1">
                  {seoAnalysis.ogTitle || '—'}
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {seoAnalysis.ogDescription}
                </div>
              </div>
            </div>
          </MetaField>
        </CardContent>
      </Card>
    </div>
  )
}
