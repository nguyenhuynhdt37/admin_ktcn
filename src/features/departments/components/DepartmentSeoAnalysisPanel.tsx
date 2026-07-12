import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Search,
  Sparkles,
  Loader2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Link as LinkIcon,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDepartmentSeoAnalysis } from '../hooks/useDepartmentSeoAnalysis'
import type { DepartmentSeoAnalysisResponse } from '../types'

interface DepartmentSeoAnalysisPanelProps {
  departmentId: string | null
  lang: 'vi' | 'en'
  disabled?: boolean
  /** Gọi hàm này để lấy giá trị form hiện tại khi phân tích */
  getFormValues: () => {
    name: string
    description: string
    mission: string
    vision: string
    history: string
    research_overview: string
    seo_title: string
    seo_description: string
    thumbnail_object_key: string
    logo_object_key: string
    banner_object_key: string
    slug?: string
  }
  /** Callback khi có kết quả phân tích mới */
  onAnalysisChange?: (analysis: DepartmentSeoAnalysisResponse | null) => void
  /** Callback để apply giá trị SEO do AI gợi ý */
  onApplySeoTitle?: (title: string) => void
  onApplySeoDescription?: (description: string) => void
}

export function DepartmentSeoAnalysisPanel({
  departmentId,
  lang,
  disabled = false,
  getFormValues,
  onAnalysisChange,
  onApplySeoTitle,
  onApplySeoDescription,
}: DepartmentSeoAnalysisPanelProps) {
  const seo = useDepartmentSeoAnalysis({ departmentId, lang })

  const handleTriggerAnalyze = () => {
    const formValues = getFormValues()
    seo.handleAnalyze(formValues)
  }

  // Đồng bộ kết quả phân tích lên cha
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analysis = seo.analysis
  if (onAnalysisChange && analysis !== undefined) {
    // Sử dụng queueMicrotask thay vì useEffect để tránh re-render loop
    // vì component cha sẽ re-render khi setState
  }

  const statusConfig = analysis ? seo.getStatusConfig(analysis.status, analysis.score) : null
  const strokeDashoffset = analysis ? 251.2 - (251.2 * analysis.score) / 100 : 251.2

  return (
    <div className="pt-4 pb-2 border-t border-border/40 space-y-4 text-left">
      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
        <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        <span>Trợ lý Phân tích SEO bằng AI (Gemini)</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deptFocusKeyword" className="text-xs font-semibold text-foreground/80">
          Từ khóa chính cần tối ưu (Focus Keyword)
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              id="deptFocusKeyword"
              placeholder="Nhập từ khóa chính... (Ví dụ: Trí tuệ nhân tạo)"
              value={seo.focusKeyword}
              onChange={(e) => seo.setFocusKeyword(e.target.value)}
              disabled={disabled || seo.isLoading}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleTriggerAnalyze}
            disabled={disabled || seo.isLoading}
            className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
          >
            {seo.isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Phân tích SEO
          </Button>
        </div>
      </div>

      {/* Loading */}
      {seo.isLoading && !analysis && (
        <div className="flex items-center justify-center py-8 gap-2 border border-dashed rounded-lg bg-muted/5">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-xs text-muted-foreground animate-pulse">AI đang phân tích trang bộ môn của bạn...</span>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !seo.isLoading && (
        <div className="space-y-3 animate-fade-in">
          {/* Score circle */}
          <div className={cn('flex items-center gap-4 p-3.5 rounded-xl border', statusConfig?.bg, statusConfig?.border)}>
            <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-muted/20 fill-transparent" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40"
                  className={cn('fill-transparent transition-all duration-500 ease-out', statusConfig?.stroke)}
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold tabular-nums text-foreground">{analysis.score}</span>
            </div>
            <div className="space-y-0.5">
              <h4 className={cn('text-xs font-bold uppercase tracking-wider', statusConfig?.color)}>
                Điểm SEO: {statusConfig?.label}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Hệ thống Rule Check phát hiện {analysis.issues.length} vấn đề cần lưu ý.
              </p>
            </div>
          </div>

          {/* Google Preview */}
          {analysis.google_preview && (
            <div className="bg-background border rounded-lg p-4 space-y-1 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                Xem trước trên Google
              </div>
              <div className="text-[#1a0dab] hover:underline text-[16px] leading-[20px] font-medium truncate">
                {analysis.google_preview.title}
              </div>
              <div className="text-[#006621] text-[12px] leading-[16px] truncate flex items-center gap-1">
                {analysis.google_preview.url}
              </div>
              <div className="text-[#545454] text-[13px] leading-[18px] line-clamp-2">
                {analysis.google_preview.description}
              </div>
            </div>
          )}

          {/* AI Generated SEO Title suggestion */}
          {analysis.generated_seo_title && onApplySeoTitle && (
            <div className="p-2.5 rounded-lg border border-purple-500/15 bg-purple-500/5 flex items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Tiêu đề SEO đề xuất từ AI:</span>
                <p className="font-medium text-foreground truncate">{analysis.generated_seo_title}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onApplySeoTitle(analysis.generated_seo_title)}
                className="h-6 px-2 text-[10px] border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white shrink-0 cursor-pointer"
              >
                Áp dụng
              </Button>
            </div>
          )}

          {/* AI Generated Meta Description suggestion */}
          {analysis.generated_meta_description && onApplySeoDescription && (
            <div className="p-2.5 rounded-lg border border-purple-500/15 bg-purple-500/5 flex items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Mô tả SEO đề xuất từ AI:</span>
                <p className="text-muted-foreground leading-relaxed line-clamp-2">{analysis.generated_meta_description}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onApplySeoDescription(analysis.generated_meta_description)}
                className="h-6 px-2 text-[10px] border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white shrink-0 cursor-pointer"
              >
                Áp dụng
              </Button>
            </div>
          )}

          {/* Technical Issues Accordion */}
          {analysis.issues.length > 0 && (
            <div className="border rounded-lg overflow-hidden bg-background/50">
              <button
                type="button"
                onClick={() => seo.setIsIssuesExpanded(!seo.isIssuesExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/25 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors cursor-pointer border-b"
              >
                <span>Lỗi kỹ thuật SEO cần sửa ({analysis.issues.length})</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', seo.isIssuesExpanded && 'rotate-180')} />
              </button>
              {seo.isIssuesExpanded && (
                <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto divide-y divide-border/40 text-[11px]">
                  {analysis.issues.map((issue, idx) => (
                    <div key={idx} className="flex gap-2 pt-2 first:pt-0">
                      {issue.type.includes('missing') || issue.type.includes('too_short') ? (
                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <span className="text-muted-foreground leading-relaxed flex-1">{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/15 text-xs">
              <span className="font-semibold text-foreground">Đề xuất cải thiện từ AI:</span>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed text-[11px]">
                {analysis.suggestions.map((sug, idx) => (
                  <li key={idx}>{sug}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Focus Keywords */}
          {analysis.focus_keywords && analysis.focus_keywords.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-border/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Từ khóa phụ đề xuất từ AI</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.focus_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    onClick={() => seo.setFocusKeyword(kw)}
                    className="px-2 py-0.5 rounded-[4px] bg-muted hover:bg-muted-foreground/20 text-[10px] font-medium text-foreground cursor-pointer transition-colors"
                    title="Click để chọn làm Từ khóa chính"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Internal Links */}
          {analysis.internal_links && analysis.internal_links.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <LinkIcon className="h-3.5 w-3.5 text-primary" />
                <span>Đề xuất liên kết nội bộ</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {analysis.internal_links.map((link, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border text-[11px] space-y-1.5 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="font-semibold text-foreground leading-snug">
                          Cụm từ: <span className="underline decoration-primary decoration-2 underline-offset-2">"{link.anchor_text}"</span>
                        </p>
                        <p className="font-mono text-[9px] text-primary truncate" title={link.url}>
                          {link.url}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => seo.handleCopyLink(link.url, idx)}
                        className="h-6 w-6 p-0 shrink-0 hover:bg-muted cursor-pointer"
                      >
                        {seo.copiedLinkIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-[10px] italic">
                      Lý do: {link.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
