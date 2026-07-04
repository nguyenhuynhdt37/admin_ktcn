import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { AutocompleteSelect } from '../AutocompleteSelect'
import { Input } from '@/shared/components/ui/input'
import type { CategorySearchItem, TagSearchItem } from '../../types/articles.types'
import { Calendar } from 'lucide-react'

interface ArticlePublishSectionProps {
  // Category
  categories: CategorySearchItem[]
  categoryId: string
  setCategoryId: (value: string) => void
  isCategoriesLoading?: boolean

  // Tags
  tags: TagSearchItem[]
  tagIds: string[]
  setTagIds: (value: string[]) => void
  isTagsLoading?: boolean

  // Status & Date
  status: 'PUBLISHED' | 'SCHEDULED'
  setStatus: (value: 'PUBLISHED' | 'SCHEDULED') => void
  publishAt: string
  setPublishAt: (value: string) => void
  expireAt: string
  setExpireAt: (value: string) => void

  // Attributes
  isPinned: boolean
  setIsPinned: (value: boolean) => void

  disabled?: boolean
  onCreateTag?: (name: string) => Promise<{ id: string; label: string; color?: string }>
  errors?: { categoryId?: string; publishAt?: string; expireAt?: string }
}

export function ArticlePublishSection({
  categories,
  categoryId,
  setCategoryId,
  isCategoriesLoading = false,

  tags,
  tagIds,
  setTagIds,
  isTagsLoading = false,

  status,
  setStatus,
  publishAt,
  setPublishAt,
  expireAt,
  setExpireAt,
  isPinned,
  setIsPinned,
  disabled = false,
  onCreateTag,
  errors,
}: ArticlePublishSectionProps) {
  // Map categories to autocomplete options (include article_count)
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    label: c.name,
    article_count: c.article_count || 0,
  }))

  // Map tags to autocomplete options (include color and article_count)
  const tagOptions = tags.map((t) => ({
    id: t.id,
    label: t.name || '',
    color: t.color,
    article_count: t.article_count || 0,
  }))

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Cấu hình xuất bản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Category selection */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
            Danh mục bài viết <span className="text-destructive">*</span>
          </Label>
          <AutocompleteSelect
            options={categoryOptions}
            value={categoryId || null}
            onChange={(val) => setCategoryId(val || '')}
            placeholder={isCategoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục chính...'}
            searchPlaceholder="Tìm danh mục..."
            emptyMessage="Không tìm thấy danh mục."
            disabled={disabled || isCategoriesLoading}
            renderOption={(option) => (
              <div className="flex items-center justify-between w-full py-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm font-mono shrink-0">
                  {option.article_count} bài viết
                </span>
              </div>
            )}
          />
          {errors?.categoryId && (
            <p className="text-xs text-destructive font-medium mt-1 animate-fade-in">{errors.categoryId}</p>
          )}
        </div>

        {/* Tags selection */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Thẻ Tag liên quan
          </Label>
          <AutocompleteSelect
            options={tagOptions}
            value={tagIds}
            onChange={(val) => setTagIds(val || [])}
            multiple
            placeholder={isTagsLoading ? 'Đang tải thẻ tag...' : 'Chọn thẻ tags...'}
            searchPlaceholder="Tìm thẻ tag..."
            emptyMessage="Không tìm thấy thẻ tag."
            disabled={disabled || isTagsLoading}
            renderOption={(option) => (
              <div className="flex items-center justify-between w-full py-0.5">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 shrink-0" 
                    style={{ backgroundColor: option.color || '#94a3b8' }}
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm font-mono shrink-0">
                  {option.article_count} bài viết
                </span>
              </div>
            )}
          />
        </div>

        {/* Status selection */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-xs font-semibold text-foreground">
            Trạng thái bài viết <span className="text-destructive">*</span>
          </Label>
          <Select
            value={status}
            onValueChange={(val: any) => setStatus(val)}
            disabled={disabled}
          >
            <SelectTrigger id="status" className="h-10 text-sm cursor-pointer">
              <SelectValue placeholder="Chọn trạng thái..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLISHED" className="cursor-pointer">Công khai (PUBLISHED)</SelectItem>
              <SelectItem value="SCHEDULED" className="cursor-pointer">Lên lịch (SCHEDULED)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schedule Publish Date - Only visible on SCHEDULED */}
        {status === 'SCHEDULED' && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="publish_at" className="text-xs font-semibold text-foreground flex items-center gap-1">
              Thời gian xuất bản dự kiến <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="publish_at"
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                disabled={disabled}
                required
                className="h-10 text-sm pr-10 cursor-pointer"
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors?.publishAt && (
              <p className="text-[11px] font-medium text-destructive mt-1.5 animate-fade-in">
                {errors.publishAt}
              </p>
            )}
          </div>
        )}

        {/* Expire Date */}
        <div className="space-y-2">
          <Label htmlFor="expire_at" className="text-xs font-semibold text-foreground">
            Ngày hết hạn hiển thị (Tự ẩn)
          </Label>
          <div className="relative">
            <Input
              id="expire_at"
              type="datetime-local"
              value={expireAt}
              onChange={(e) => setExpireAt(e.target.value)}
              disabled={disabled}
              className="h-10 text-sm pr-10 cursor-pointer"
            />
            <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          {errors?.expireAt && (
            <p className="text-[11px] font-medium text-destructive mt-1.5 animate-fade-in">
              {errors.expireAt}
            </p>
          )}
        </div>

        {/* Attributes Switches */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground">Ghim lên đầu trang</Label>
              <p className="text-[10px] text-muted-foreground">Luôn hiển thị ở đầu danh sách</p>
            </div>
            <Switch
              checked={isPinned}
              onCheckedChange={setIsPinned}
              disabled={disabled}
              className="cursor-pointer"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
