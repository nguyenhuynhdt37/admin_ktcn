import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  Search,
  Loader2,
  ChevronsUpDown,
  X,
  Folder,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { cn } from '@/lib/utils'
import { categoryService } from '@/features/categories/services/categoryService'
import type { CategoryTreeNode, CategoryStatus } from '@/features/categories/types'

interface CategoryTreeSelectProps {
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
  placeholder?: string
}

interface FlatCategoryItem {
  id: string
  name: string
  fullName: string // Ví dụ: "Cơ cấu tổ chức › Các bộ môn › Kỹ thuật điện - điện tử"
  level: number
  status: CategoryStatus
  article_count: number
}

/** Đệ quy chuyển đổi cấu trúc cây thành mảng phẳng */
function flattenTree(
  nodes: CategoryTreeNode[],
  parentPath: string[] = [],
  level: number = 0
): FlatCategoryItem[] {
  const result: FlatCategoryItem[] = []
  for (const node of nodes) {
    const currentPath = [...parentPath, node.name]
    result.push({
      id: node.id,
      name: node.name,
      fullName: currentPath.join(' › '),
      level,
      status: node.status,
      article_count: node.article_count ?? 0,
    })
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, currentPath, level + 1))
    }
  }
  return result
}

/** Tìm node trong cấu trúc cây gốc để hiển thị chính xác breadcrumb và thông tin */
function findNode(nodes: CategoryTreeNode[], id: string | null): CategoryTreeNode | null {
  if (!id) return null
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Tìm đường dẫn breadcrumb của một node */
function findBreadcrumb(nodes: CategoryTreeNode[], id: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.name]
    if (node.id === id) return currentPath
    if (node.children?.length) {
      const found = findBreadcrumb(node.children, id, currentPath)
      if (found) return found
    }
  }
  return null
}

export function CategoryTreeSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Chọn danh mục liên kết...',
}: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  const { data: tree = [], isLoading, isError } = useQuery({
    queryKey: ['category-tree'],
    queryFn: categoryService.getCategoryTree,
  })

  // Lấy node đang được chọn
  const selectedNode = useMemo(() => findNode(tree, value), [tree, value])
  
  // Breadcrumb hiển thị ở Trigger Button
  const breadcrumb = useMemo(
    () => (value ? findBreadcrumb(tree, value) : null),
    [tree, value],
  )

  // Làm phẳng cây danh mục
  const flatCategories = useMemo(() => {
    return flattenTree(tree)
  }, [tree])

  // Lọc danh mục theo từ khóa tìm kiếm (tìm kiếm theo toàn bộ đường dẫn)
  const filteredCategories = useMemo(() => {
    if (!searchKeyword.trim()) return flatCategories
    const term = searchKeyword.toLowerCase()
    return flatCategories.filter((cat) => cat.fullName.toLowerCase().includes(term))
  }, [flatCategories, searchKeyword])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearchKeyword('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full h-auto min-h-10 justify-between font-normal bg-background px-3 py-2 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/30"
        >
          {selectedNode ? (
            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-left">
              <span className="text-[13px] font-medium text-foreground truncate w-full">
                {selectedNode.name}
              </span>
              {breadcrumb && breadcrumb.length > 1 && (
                <span className="text-[11px] text-muted-foreground truncate w-full">
                  {breadcrumb.slice(0, -1).join(' › ')}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-muted-foreground flex-1 text-left">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedNode && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 z-50 shadow-xl"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col max-h-[360px] overflow-hidden rounded-lg border bg-popover">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <input
              placeholder="Tìm theo tên hoặc đường dẫn danh mục..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-[13px] outline-none border-none py-0.5 placeholder:text-muted-foreground/50"
              autoFocus
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Flat List content */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-[13px] text-muted-foreground">Đang tải danh mục...</span>
              </div>
            ) : isError ? (
              <p className="py-8 text-center text-[13px] text-destructive">
                Không thể tải danh mục.
              </p>
            ) : filteredCategories.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">
                Không tìm thấy danh mục phù hợp.
              </p>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = cat.id === value
                const isActive = cat.status === 'ACTIVE'
                const isDisabled = disabled || !isActive

                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(cat.id)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-md transition-colors cursor-pointer border border-transparent flex flex-col gap-1',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isDisabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {/* Hàng Tiêu đề & Checkbox/Badge */}
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Folder className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-primary-foreground' : 'text-amber-500')} />
                        <span className={cn('text-[13px] font-semibold truncate', isSelected ? 'text-primary-foreground' : 'text-foreground')}>
                          {cat.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Số lượng bài viết */}
                        {cat.article_count > 0 && (
                          <span className={cn(
                            'text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-semibold',
                            isSelected
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          )}>
                            {cat.article_count} bài viết
                          </span>
                        )}
                        
                        {/* Trạng thái không hoạt động */}
                        {!isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                            Tạm ẩn
                          </span>
                        )}

                        {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                    </div>

                    {/* Hàng Breadcrumb (hiển thị đường dẫn cha nếu có) */}
                    {cat.level > 0 && (
                      <div className={cn(
                        'text-[11px] truncate pl-5',
                        isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground/70'
                      )}>
                        {cat.fullName.split(' › ').slice(0, -1).join(' › ')}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer info */}
          {!isLoading && !isError && flatCategories.length > 0 && (
            <div className="border-t px-3 py-2 bg-muted/20">
              <p className="text-[11px] text-muted-foreground/60">
                Tổng cộng {flatCategories.length} danh mục · Click để chọn
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
