import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, FolderOpen, Check, Search, Loader2, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { cn } from '@/lib/utils'
import { categoryService } from '@/features/categories/services/categoryService'
import type { CategoryTreeNode } from '@/features/categories/types'

interface CategoryTreeSelectProps {
  value: string | null
  onChange: (id: string) => void
  disabled?: boolean
}

/** Lọc tree theo search keyword (giữ parent nếu child match) */
function filterTree(nodes: CategoryTreeNode[], keyword: string): CategoryTreeNode[] {
  if (!keyword.trim()) return nodes
  const lower = keyword.toLowerCase()

  return nodes
    .map((node) => {
      const filteredChildren = filterTree(node.children || [], keyword)
      const selfMatch = node.name.toLowerCase().includes(lower)

      if (selfMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
      return null
    })
    .filter(Boolean) as CategoryTreeNode[]
}

// Đệ quy tìm tên danh mục đang chọn để hiển thị ra Button trigger
function findNodeName(nodes: CategoryTreeNode[], id: string | null): string | null {
  if (!id) return null
  for (const node of nodes) {
    if (node.id === id) return node.name
    if (node.children && node.children.length > 0) {
      const found = findNodeName(node.children, id)
      if (found) return found
    }
  }
  return null
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  level,
  defaultExpanded,
  disabled,
}: {
  node: CategoryTreeNode
  selectedId: string | null
  onSelect: (id: string) => void
  level: number
  defaultExpanded: boolean
  disabled?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isSelected = node.id === selectedId
  const isActive = node.status === 'ACTIVE'
  const hasChildren = node.children?.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer text-xs transition-colors',
          isSelected && 'bg-primary/10 text-primary font-medium',
          (!isActive || disabled) && 'opacity-50 cursor-not-allowed',
          isActive && !isSelected && !disabled && 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (disabled || !isActive) return
          onSelect(node.id)
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            disabled={disabled}
            className="shrink-0 p-0.5 rounded hover:bg-accent"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        <FolderOpen className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{node.name}</span>

        {!isActive && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 text-destructive border-destructive/30">
            {node.status}
          </Badge>
        )}
        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
      </div>

      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
            level={level + 1}
            defaultExpanded={defaultExpanded}
            disabled={disabled}
          />
        ))}
    </div>
  )
}

export function CategoryTreeSelect({ value, onChange, disabled }: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  const {
    data: tree = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['category-tree'],
    queryFn: categoryService.getCategoryTree,
  })

  const selectedName = useMemo(() => {
    return findNodeName(tree, value)
  }, [tree, value])

  const filteredTree = useMemo(() => {
    return filterTree(tree, searchKeyword)
  }, [tree, searchKeyword])

  const isSearching = searchKeyword.trim().length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-xs h-10 font-normal bg-background px-3 hover:bg-background/80 focus:ring-1 focus:ring-primary/20 cursor-pointer"
        >
          <span className="truncate flex-1 text-left font-medium text-slate-700 dark:text-slate-300">
            {selectedName ? selectedName : 'Chọn danh mục liên kết...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50" align="start">
        <div className="flex flex-col max-h-[340px] overflow-hidden bg-popover text-popover-foreground rounded-lg border shadow-lg">
          {/* Hộp Tìm kiếm hợp nhất */}
          <div className="flex items-center border-b px-3 py-2.5 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              placeholder="Tìm kiếm danh mục..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-xs outline-none border-none py-0.5 placeholder:text-muted-foreground/70"
              autoFocus
            />
          </div>

          {/* Cây danh mục */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Đang tải danh mục...</span>
              </div>
            ) : isError ? (
              <p className="py-6 text-center text-xs text-destructive">Không thể tải danh mục.</p>
            ) : filteredTree.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {isSearching ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục nào.'}
              </p>
            ) : (
              filteredTree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  selectedId={value}
                  onSelect={(id) => {
                    onChange(id)
                    setOpen(false)
                    setSearchKeyword('')
                  }}
                  level={0}
                  defaultExpanded={isSearching}
                  disabled={disabled}
                />
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
