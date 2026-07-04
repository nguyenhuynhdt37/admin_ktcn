import * as React from 'react'
import { Search, SlidersHorizontal, RotateCcw, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { AutocompleteSelect, type AutocompleteOption } from './AutocompleteSelect'
import { articleService } from '../services/articleService'
import type { ArticleListParams } from '../types/articles.types'

interface ArticleFiltersProps {
  filters: ArticleListParams
  onChange: (filters: ArticleListParams) => void
  onReset: () => void
}

export function ArticleFilters({ filters, onChange, onReset }: ArticleFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [searchVal, setSearchVal] = React.useState(filters.search || '')

  const filtersRef = React.useRef(filters)
  const onChangeRef = React.useRef(onChange)

  React.useEffect(() => {
    filtersRef.current = filters
    onChangeRef.current = onChange
  })

  // Debounce search value changes
  React.useEffect(() => {
    const trimmedSearchVal = searchVal.trim()
    const currentSearchVal = filters.search || ''

    if (currentSearchVal === trimmedSearchVal) {
      return
    }

    const timer = setTimeout(() => {
      onChangeRef.current({
        ...filtersRef.current,
        search: trimmedSearchVal || null,
        page: 1,
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [searchVal, filters.search])

  // Sync state if filters reset externally
  React.useEffect(() => {
    setSearchVal(filters.search || '')
  }, [filters.search])

  const handleFilterChange = (key: keyof ArticleListParams, value: any) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1, // Reset về trang 1 khi lọc thay đổi
    })
  }

  // Wrappers for Autocomplete Search functions
  const searchCategories = React.useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const list = await articleService.searchCategories(query)
    return list.map((item) => ({
      id: item.id,
      label: item.name,
      slug: item.slug,
    }))
  }, [])

  const searchAuthors = React.useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const list = await articleService.searchAuthors(query)
    return list.map((item) => ({
      id: item.id,
      label: item.full_name,
      username: item.username,
      avatar_url: item.avatar_url,
    }))
  }, [])

  const searchTags = React.useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const list = await articleService.searchTags(query)
    return list.map((item) => ({
      id: item.id,
      label: item.name,
      color: item.color,
      slug: item.slug,
    }))
  }, [])

  const hasActiveFilters = React.useMemo(() => {
    const { page, page_size, sort_by, sort_dir, deleted, ...rest } = filters
    return Object.values(rest).some((val) => val !== undefined && val !== null && val !== '')
  }, [filters])

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs space-y-4">
      {/* Hàng lọc cơ bản */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Tìm kiếm */}
        <div className="md:col-span-4 space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Tìm kiếm bài viết</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-60" />
            <Input
              placeholder="Nhập tiêu đề hoặc slug cần tìm..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Lọc danh mục */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Danh mục</Label>
          <AutocompleteSelect
            placeholder="Tất cả danh mục"
            searchPlaceholder="Tìm danh mục..."
            onSearch={searchCategories}
            value={filters.category_id}
            onChange={(val) => handleFilterChange('category_id', val)}
          />
        </div>

        {/* Lọc tác giả */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Tác giả</Label>
          <AutocompleteSelect
            placeholder="Tất cả tác giả"
            searchPlaceholder="Tìm tác giả..."
            onSearch={searchAuthors}
            value={filters.author_id}
            onChange={(val) => handleFilterChange('author_id', val)}
            renderOption={(opt) => (
              <div className="flex items-center gap-2">
                {opt.avatar_url ? (
                  <img
                    src={opt.avatar_url}
                    alt={opt.label}
                    className="h-5 w-5 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {opt.label?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{opt.username}</span>
                </div>
              </div>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 text-xs h-9 border-dashed"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Lọc thêm
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Hàng lọc nâng cao (Advanced Filters) */}
      {showAdvanced && (
        <div className="pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Lọc Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Thẻ tag (Chọn nhiều)</Label>
            <AutocompleteSelect
              isMulti
              placeholder="Chọn các thẻ tag"
              searchPlaceholder="Tìm thẻ tag..."
              onSearch={searchTags}
              value={filters.tag_ids}
              onChange={(val) => handleFilterChange('tag_ids', val)}
              renderOption={(opt) => (
                <div className="flex items-center gap-2">
                  {opt.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  <span className="text-sm truncate">{opt.label}</span>
                </div>
              )}
            />
          </div>

          {/* Lọc Trạng thái (Không chứa DRAFT) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Trạng thái bài viết</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(val) => handleFilterChange('status', val === 'all' ? null : val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PUBLISHED">Đã xuất bản (PUBLISHED)</SelectItem>
                <SelectItem value="SCHEDULED">Lên lịch (SCHEDULED)</SelectItem>
                <SelectItem value="ARCHIVED">Lưu trữ (ARCHIVED)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc ghim */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Ghim</Label>
            <Select
              value={filters.is_pinned === null || filters.is_pinned === undefined ? 'all' : String(filters.is_pinned)}
              onValueChange={(val) => handleFilterChange('is_pinned', val === 'all' ? null : val === 'true')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Được ghim</SelectItem>
                <SelectItem value="false">Thường</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc thời gian tạo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Ngày tạo (Khoảng thời gian)
            </Label>
            <div className="grid grid-cols-2 gap-1 items-center">
              <Input
                type="date"
                value={filters.created_from ? filters.created_from.substring(0, 10) : ''}
                onChange={(e) =>
                  handleFilterChange(
                    'created_from',
                    e.target.value ? new Date(e.target.value).toISOString() : null
                  )
                }
                className="h-9 text-xs px-2"
                title="Từ ngày"
              />
              <Input
                type="date"
                value={filters.created_to ? filters.created_to.substring(0, 10) : ''}
                onChange={(e) =>
                  handleFilterChange(
                    'created_to',
                    e.target.value ? new Date(e.target.value + 'T23:59:59Z').toISOString() : null
                  )
                }
                className="h-9 text-xs px-2"
                title="Đến ngày"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
