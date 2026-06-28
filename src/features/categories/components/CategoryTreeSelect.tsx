import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, FolderOpen, Check, Search, Loader2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'
import { categoryService } from '@/features/categories/services/categoryService'
import type { CategoryTreeNode } from '@/features/categories/types'

interface CategoryTreeSelectProps {
  value: string | null
  onChange: (id: string | null) => void
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

function TreeNode({
  node,
  selectedId,
  onSelect,
  level,
  defaultExpanded,
}: {
  node: CategoryTreeNode
  selectedId: string | null
  onSelect: (id: string | null) => void
  level: number
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isSelected = node.id === selectedId
  const isActive = node.status === 'ACTIVE'
  const hasChildren = node.children?.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer text-sm transition-colors',
          isSelected && 'bg-primary/10 text-primary font-medium',
          !isActive && 'opacity-50 cursor-not-allowed',
          isActive && !isSelected && 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => {
          if (isActive) {
            // Click vào mục đang chọn thì bỏ chọn (chuyển về null)
            onSelect(isSelected ? null : node.id)
          }
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
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

        <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{node.name}</span>

        {!isActive && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 text-destructive border-destructive/30">
            {node.status}
          </Badge>
        )}
        {isSelected && <Check className="w-4 h-4 shrink-0 text-primary" />}
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
          />
        ))}
    </div>
  )
}

export function CategoryTreeSelect({ value, onChange }: CategoryTreeSelectProps) {
  const [searchKeyword, setSearchKeyword] = useState('')

  const {
    data: tree = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['category-tree'],
    queryFn: categoryService.getCategoryTree,
  })

  const filteredTree = filterTree(tree, searchKeyword)
  const isSearching = searchKeyword.trim().length > 0

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm kiếm danh mục..."
          className="h-8 pl-8 text-sm"
        />
      </div>

      {/* Tree */}
      <div className="max-h-[260px] overflow-y-auto rounded-lg border border-border/60 bg-background p-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Đang tải danh mục...</span>
          </div>
        ) : isError ? (
          <p className="py-4 text-center text-xs text-destructive">Không thể tải danh mục.</p>
        ) : filteredTree.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {isSearching ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục nào.'}
          </p>
        ) : (
          filteredTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              selectedId={value}
              onSelect={onChange}
              level={0}
              defaultExpanded={isSearching}
            />
          ))
        )}
      </div>
    </div>
  )
}
