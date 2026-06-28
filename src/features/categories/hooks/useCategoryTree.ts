import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoryService } from '../services/categoryService'
import type { CategoryTreeNode, FlatCategoryNode, CategoryReorderItem } from '../types'

// ── Helpers ──

/** Làm phẳng cây thành flat list có depth */
export function flattenTree(
  nodes: CategoryTreeNode[],
  parentId: string | null = null,
  depth: number = 0
): FlatCategoryNode[] {
  let result: FlatCategoryNode[] = []
  nodes.forEach((node) => {
    result.push({
      id: node.id,
      parent_id: parentId,
      name: node.name,
      slug: node.slug,
      description: node.description,
      sort_order: node.sort_order,
      status: node.status,
      is_visible: node.is_visible,
      depth,
      children_count: node.children?.length ?? 0,
    })
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, node.id, depth + 1))
    }
  })
  return result
}

/** Tìm tất cả descendant IDs của một node (để chặn kéo vào chính con/cháu) */
function getDescendantIds(flatItems: FlatCategoryNode[], nodeId: string): Set<string> {
  const descendants = new Set<string>()
  const queue = [nodeId]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    flatItems.forEach((item) => {
      if (item.parent_id === currentId && !descendants.has(item.id)) {
        descendants.add(item.id)
        queue.push(item.id)
      }
    })
  }
  return descendants
}

// ── Hook ──

export function useCategoryTree() {
  const queryClient = useQueryClient()

  // Local state
  const [flatItems, setFlatItems] = useState<FlatCategoryNode[]>([])
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Fetch tree
  const {
    data: treeData,
    isLoading,
    isError,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ['category-tree'],
    queryFn: categoryService.getCategoryTree,
  })

  // Sync flat items khi treeData thay đổi
  const syncFlatItems = useCallback((tree: CategoryTreeNode[]) => {
    setFlatItems(flattenTree(tree))
    setHasUnsavedChanges(false)
  }, [])

  // Tính visible items (ẩn children của collapsed nodes)
  const visibleItems = useMemo(() => {
    const hidden = new Set<string>()
    collapsedIds.forEach((collapsedId) => {
      const descendants = getDescendantIds(flatItems, collapsedId)
      descendants.forEach((id) => hidden.add(id))
    })
    return flatItems.filter((item) => !hidden.has(item.id))
  }, [flatItems, collapsedIds])

  // Toggle expand/collapse
  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // Xử lý drag end — tính lại parent_id + sort_order
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return

      const oldIndex = flatItems.findIndex((i) => i.id === activeId)
      const newIndex = flatItems.findIndex((i) => i.id === overId)
      if (oldIndex === -1 || newIndex === -1) return

      // Chặn kéo node vào chính con/cháu
      const descendants = getDescendantIds(flatItems, activeId)
      if (descendants.has(overId)) {
        toast.error('Không thể đặt danh mục cha làm con của danh mục con.')
        return
      }

      // Di chuyển item
      const updated = [...flatItems]
      const [moved] = updated.splice(oldIndex, 1)
      updated.splice(newIndex, 0, moved)

      // Tính lại parent_id: item nhận cùng parent_id với item mà nó đang nằm kề phía trên
      const overItem = flatItems[newIndex]
      moved.parent_id = overItem.parent_id
      moved.depth = overItem.depth

      // Tính lại sort_order cho tất cả siblings cùng parent
      let sortCounter = 0
      updated.forEach((item) => {
        if (item.parent_id === moved.parent_id) {
          item.sort_order = sortCounter * 10
          sortCounter++
        }
      })

      setFlatItems(updated)
      setHasUnsavedChanges(true)
    },
    [flatItems]
  )

  // Mutation lưu thứ tự
  const reorderMutation = useMutation({
    mutationFn: () => {
      const items: CategoryReorderItem[] = flatItems.map((item) => ({
        id: item.id,
        parent_id: item.parent_id,
        sort_order: item.sort_order,
      }))
      return categoryService.reorderCategories({ items })
    },
    onSuccess: () => {
      toast.success('Đã lưu thứ tự danh mục thành công!')
      setHasUnsavedChanges(false)
      queryClient.invalidateQueries({ queryKey: ['category-tree'] })
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error_code
      if (errorCode === 'CIRCULAR_REFERENCE') {
        toast.error('Thao tác kéo thả không hợp lệ: Phát hiện vòng lặp trong cấu trúc cây.')
      } else {
        toast.error('Lưu thứ tự thất bại. Vui lòng thử lại.')
      }
      // Reset về dữ liệu gốc
      refetchTree()
    },
  })

  // Invalidate queries (dùng sau khi create/update/delete)
  const invalidateTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['category-tree'] })
    queryClient.invalidateQueries({ queryKey: ['categories-list'] })
  }, [queryClient])

  return {
    treeData,
    flatItems,
    visibleItems,
    collapsedIds,
    isLoading,
    isError,
    hasUnsavedChanges,
    syncFlatItems,
    toggleCollapse,
    handleDragEnd,
    reorderMutation,
    refetchTree,
    invalidateTree,
  }
}
