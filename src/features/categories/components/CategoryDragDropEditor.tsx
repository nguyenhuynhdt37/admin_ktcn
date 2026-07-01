/* eslint-disable */
import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Loader2, ChevronsUpDown, ChevronsDownUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { categoryService } from '../services/categoryService'
import { SortableCategoryNode } from './SortableCategoryNode'
import type { CategoryTreeNode, FlatCategoryNode } from '../types'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthProvider'

interface CategoryDragDropEditorProps {
  items: CategoryTreeNode[]
  selectedItemId: string | null
  onSelectItem: (itemId: string | null) => void
  onCreateItem?: (parentId: string | null) => void
  refetchTree: () => void
  isCreating?: boolean
  createParentId?: string | null
}

// 1. Helper: Làm phẳng cấu trúc cây danh mục thành danh sách phẳng (Flat List)
function flattenTree(nodes: CategoryTreeNode[], parentId: string | null = null, depth: number = 1): FlatCategoryNode[] {
  let result: FlatCategoryNode[] = []
  nodes.forEach((node) => {
    // Lấy thông tin hiển thị từ bản dịch Tiếng Việt (vi) tương tự như useCategoryTree
    const viTrans = node.translations?.vi || {}
    const name = viTrans.name || node.name || 'Chưa đặt tên'
    const slug = viTrans.slug || node.slug || ''
    const description = viTrans.description || node.description || null

    result.push({
      id: node.id,
      parent_id: parentId,
      name,
      slug,
      description,
      sort_order: node.sort_order,
      status: node.status,
      is_visible: node.is_visible,
      depth,
      children_count: node.children ? node.children.length : 0,
      is_weekly_schedule: node.is_weekly_schedule === true,
      is_locked: node.is_locked === true,
      article_count: node.article_count ?? 0,
      is_translated: node.is_translated,
      translations: node.translations,
    })
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, node.id, depth + 1))
    }
  })
  return result
}

// 2. Helper: Tự động tính toán lại parent_id và điều chỉnh depth của toàn bộ danh sách phẳng
function recalculateParentsAndDepths(flatItems: FlatCategoryNode[]): FlatCategoryNode[] {
  const result = flatItems.map((item) => ({ ...item }))
  for (let i = 0; i < result.length; i++) {
    const current = result[i]
    if (i === 0) {
      current.depth = 1
      current.parent_id = null
      continue
    }

    const prev = result[i - 1]

    // Giới hạn: depth của item hiện tại không được lớn hơn depth của item liền trước + 1
    if (current.depth > prev.depth + 1) {
      current.depth = prev.depth + 1
    }

    // Giới hạn cứng trong khoảng 1 đến 3 cấp
    if (current.depth > 3) {
      current.depth = 3
    }
    if (current.depth < 1) {
      current.depth = 1
    }

    // Xác định parent_id dựa trên depth mới
    if (current.depth === 1) {
      current.parent_id = null
    } else {
      let foundParentId: string | null = null
      for (let j = i - 1; j >= 0; j--) {
        if (result[j].depth === current.depth - 1) {
          foundParentId = result[j].id
          break
        }
      }
      current.parent_id = foundParentId

      if (!foundParentId) {
        current.depth = 1
        current.parent_id = null
      }
    }
  }
  return result
}

export function CategoryDragDropEditor({
  items,
  selectedItemId,
  onSelectItem,
  onCreateItem,
  refetchTree,
  isCreating = false,
  createParentId = null,
}: CategoryDragDropEditorProps) {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('category.create')
  const canUpdate = hasPermission('category.update')

  const queryClient = useQueryClient()
  const [flatItems, setFlatItems] = useState<FlatCategoryNode[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null)

  // State lưu trữ danh sách ID các node bị thu gọn
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  // Mở rộng tất cả
  const handleExpandAll = () => {
    setCollapsedIds(new Set())
  }

  // Thu nhỏ tất cả các node có danh mục con
  const handleCollapseAll = () => {
    const hasChildrenIds = flatItems
      .filter((item) => item.children_count > 0)
      .map((item) => item.id)
    setCollapsedIds(new Set(hasChildrenIds))
  }

  // Thu nhỏ hoặc mở rộng một node cụ thể
  const handleToggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // State quản lý Placeholder động khi đang kéo
  const [placeholderInfo, setPlaceholderInfo] = useState<{
    index: number
    depth: number
    isValid: boolean
    parentTitle: string
    offendingTitle: string
    isDraggedItemOffending: boolean
    isAdoptError: boolean
  } | null>(null)

  // Đồng bộ flat items khi tree từ API thay đổi
  useEffect(() => {
    setFlatItems(flattenTree(items))
    setActiveId(null)
    setPlaceholderInfo(null)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // Độ nhạy kéo thả tốt
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Mutation auto-save cấu trúc cây lên backend
  const reorderMutation = useMutation({
    mutationFn: (payload: { id: string; parent_id: string | null; sort_order: number }[]) =>
      categoryService.reorderCategories({ items: payload }),
    onSuccess: () => {
      toast.success('Đã tự động lưu cấu trúc danh mục!')
      refetchTree()
      queryClient.invalidateQueries({ queryKey: ['category-tree'] })
      queryClient.invalidateQueries({ queryKey: ['categories-list'] })
    },
    onError: (error: any) => {
      const errCode = error.response?.data?.error_code || error.response?.data?.error?.code
      if (errCode === 'CIRCULAR_REFERENCE') {
        toast.error('Không thể di chuyển. Phát hiện liên kết vòng lặp cấu trúc cây danh mục.')
      } else {
        toast.error('Có lỗi xảy ra khi tự động lưu cấu trúc danh mục.')
      }
      refetchTree()
    },
  })

  // Mutation tạo item mới (Cấp 1 hoặc làm con của mục khác)
  const createMutation = useMutation({
    mutationFn: (parentId: string | null = null) =>
      categoryService.createCategory({
        name: parentId ? 'Danh mục con mới' : 'Danh mục mới',
        parent_id: parentId,
        status: 'DRAFT',
        is_visible: true,
      }),
    onSuccess: (newCat) => {
      toast.success(newCat.parent_id ? 'Đã thêm danh mục con mới!' : 'Đã thêm danh mục mới!')
      refetchTree()
      onSelectItem(newCat.id) // Tự động mở form cấu hình bên phải
    },
    onError: () => {
      toast.error('Không thể thêm danh mục mới.')
    },
  })

  // Mutation xóa item
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      toast.success('Đã xóa danh mục thành công!')
      if (selectedItemId) onSelectItem(null)
      refetchTree()
    },
    onError: (error: any) => {
      const errResponse = error?.response?.data
      const errorCode = errResponse?.error_code || errResponse?.error?.code
      const errMessage = errResponse?.message || errResponse?.error?.message
      
      if (errorCode === 'CATEGORY_HAS_CHILDREN') {
        toast.error('Không thể xóa danh mục này vì đang chứa danh mục con. Vui lòng di chuyển hoặc xóa các danh mục con trước.')
      } else if (errorCode === 'CATEGORY_HAS_ACTIVE_ARTICLES') {
        toast.error(errMessage || 'Không thể xóa danh mục đang có bài viết hoạt động.')
      } else {
        toast.error(errMessage || 'Không thể xóa danh mục.')
      }
    },
  })

  // Bắt đầu kéo
  const handleDragStart = (event: DragStartEvent) => {
    if (!canUpdate) return
    setActiveId(event.active.id as string)
    setPlaceholderInfo(null)
  }

  // Khi đang di chuyển chuột (Tính toán vị trí thả dự kiến)
  const handleDragMove = (event: DragOverEvent) => {
    if (!canUpdate) return
    const { active, over, delta } = event
    if (!over) {
      setPlaceholderInfo(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Bỏ qua nếu rê chuột qua placeholder ảo
    if (overId === 'placeholder') return

    const oldIndex = flatItems.findIndex((item) => item.id === activeId)
    const overIndex = flatItems.findIndex((item) => item.id === overId)

    if (oldIndex === -1 || overIndex === -1) return

    // Tìm con cháu của item đang kéo
    const descendants: FlatCategoryNode[] = []
    const draggedItem = flatItems[oldIndex]
    if (!draggedItem) return

    let nextIdx = oldIndex + 1
    while (nextIdx < flatItems.length && flatItems[nextIdx] && flatItems[nextIdx].depth > draggedItem.depth) {
      descendants.push(flatItems[nextIdx])
      nextIdx++
    }

    const isActiveOrDescendant = overId === activeId || descendants.some((d) => d.id === overId)

    const itemsWithoutCluster = flatItems.filter(
      (item) => item.id !== activeId && !descendants.some((d) => d.id === item.id)
    )

    let insertIndex: number
    if (isActiveOrDescendant) {
      insertIndex = oldIndex
    } else {
      let targetIndex = itemsWithoutCluster.findIndex((item) => item.id === overId)
      if (targetIndex === -1) targetIndex = itemsWithoutCluster.length

      const isBelow = overIndex > oldIndex
      insertIndex = Math.min(
        itemsWithoutCluster.length,
        isBelow ? targetIndex + 1 : targetIndex
      )
    }

    const horizontalOffset = Math.round(delta.x / 28)
    let projectedDepth = draggedItem.depth + horizontalOffset
    projectedDepth = Math.max(1, Math.min(3, projectedDepth))

    const prevItem = insertIndex > 0 ? itemsWithoutCluster[insertIndex - 1] : null
    if (prevItem && projectedDepth > prevItem.depth + 1) {
      projectedDepth = prevItem.depth + 1
    }
    if (insertIndex === 0) {
      projectedDepth = 1
    }

    const depthDiff = projectedDepth - draggedItem.depth
    let offendingItem: FlatCategoryNode | null = null

    if (projectedDepth > 3) {
      offendingItem = draggedItem
    } else if (draggedItem.depth + depthDiff > 3) {
      offendingItem = draggedItem
    } else {
      for (const d of descendants) {
        if (d.depth + depthDiff > 3) {
          offendingItem = d
          break
        }
      }
    }

    let isValid = offendingItem === null
    let isAdoptError = false

    if (isValid) {
      const nextItem = insertIndex < itemsWithoutCluster.length ? itemsWithoutCluster[insertIndex] : null
      if (nextItem && nextItem.depth > projectedDepth) {
        isValid = false
        isAdoptError = true
      }
    }

    let parentTitle = ''
    if (projectedDepth > 1) {
      for (let j = insertIndex - 1; j >= 0; j--) {
        if (itemsWithoutCluster[j].depth === projectedDepth - 1) {
          parentTitle = itemsWithoutCluster[j].name
          break
        }
      }
    }

    setPlaceholderInfo({
      index: insertIndex,
      depth: projectedDepth,
      isValid,
      parentTitle,
      offendingTitle: offendingItem ? offendingItem.name : '',
      isDraggedItemOffending: offendingItem?.id === draggedItem.id,
      isAdoptError,
    })
  }

  // Kết thúc kéo thả
  const handleDragEnd = (event: DragEndEvent) => {
    if (!canUpdate) return
    const cachedPlaceholder = placeholderInfo
    
    if (!cachedPlaceholder) {
      setActiveId(null)
      setPlaceholderInfo(null)
      return
    }

    if (!cachedPlaceholder.isValid) {
      if (cachedPlaceholder.isAdoptError) {
        toast.error('Không thể di chuyển. Không được phép bọc các danh mục đứng sau.')
      } else {
        toast.error('Không thể di chuyển. Độ sâu tối đa của Danh mục là 3 cấp.')
      }
      setActiveId(null)
      setPlaceholderInfo(null)
      return
    }

    const { active, over } = event
    if (!over) {
      setActiveId(null)
      setPlaceholderInfo(null)
      return
    }

    const activeId = active.id as string

    setFlatItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId)
      if (oldIndex === -1) {
        setActiveId(null)
        setPlaceholderInfo(null)
        return prev
      }

      const draggedItem = prev[oldIndex]

      // Nếu thả chuột tại chính vị trí cũ và độ sâu cũ thì không cần làm gì
      if (cachedPlaceholder.index === oldIndex && cachedPlaceholder.depth === draggedItem.depth) {
        setActiveId(null)
        setPlaceholderInfo(null)
        return prev
      }

      const descendants: FlatCategoryNode[] = []

      let nextIdx = oldIndex + 1
      while (nextIdx < prev.length && prev[nextIdx].depth > draggedItem.depth) {
        descendants.push(prev[nextIdx])
        nextIdx++
      }

      const itemsWithoutCluster = prev.filter(
        (item) => item.id !== activeId && !descendants.some((d) => d.id === item.id)
      )

      const depthDiff = cachedPlaceholder.depth - draggedItem.depth
      const updatedDraggedItem = {
        ...draggedItem,
        depth: cachedPlaceholder.depth,
      }

      const updatedDescendants = descendants.map((d) => ({
        ...d,
        depth: Math.max(1, Math.min(3, d.depth + depthDiff)),
      }))

      const result = [...itemsWithoutCluster]
      result.splice(cachedPlaceholder.index, 0, updatedDraggedItem, ...updatedDescendants)

      const finalized = recalculateParentsAndDepths(result)

      setJustDroppedId(activeId)
      setTimeout(() => {
        setJustDroppedId(null)
      }, 1500)

      // AUTO-SAVE: Tự động lưu
      const payload = finalized.map((item, index) => ({
        id: item.id,
        parent_id: item.parent_id,
        sort_order: index * 10,
      }))
      
      reorderMutation.mutate(payload)

      setActiveId(null)
      setPlaceholderInfo(null)

      return finalized
    })
  }

  let displayItems = flatItems.map((item) => ({ ...item }))

  // Chèn node ảo xem trước vị trí đang tạo
  if (isCreating) {
    const virtualId = 'virtual-new-node'
    const virtualNode = {
      id: virtualId,
      name: createParentId ? 'Danh mục con mới (Xem trước...)' : 'Danh mục mới (Xem trước...)',
      slug: 'danh-muc-moi',
      description: null,
      depth: 1,
      sort_order: 9999,
      status: 'DRAFT' as const,
      is_visible: true,
      parent_id: createParentId,
      is_locked: false,
      article_count: 0,
      is_translated: { vi: true, en: false },
      translations: {
        vi: { name: createParentId ? 'Danh mục con mới (Xem trước...)' : 'Danh mục mới (Xem trước...)', slug: 'danh-muc-moi', description: '', seo_title: '', seo_description: '' },
        en: { name: '', slug: '', description: '', seo_title: '', seo_description: '' }
      },
      children_count: 0,
      isVirtual: true,
    }

    if (!createParentId) {
      virtualNode.depth = 1
      displayItems.push(virtualNode)
    } else {
      const parentIdx = displayItems.findIndex(item => item.id === createParentId)
      if (parentIdx !== -1) {
        const parentNode = displayItems[parentIdx]
        virtualNode.depth = Math.min(3, parentNode.depth + 1)
        
        let insertIdx = parentIdx + 1
        while (insertIdx < displayItems.length && displayItems[insertIdx].depth > parentNode.depth) {
          insertIdx++
        }
        displayItems.splice(insertIdx, 0, virtualNode)
      } else {
        virtualNode.depth = 1
        displayItems.push(virtualNode)
      }
    }
  }
  
  if (activeId && placeholderInfo) {
    const oldIndex = flatItems.findIndex((item) => item.id === activeId)
    const draggedItem = flatItems[oldIndex]

    if (draggedItem) {
      // Tìm con cháu của item đang kéo
      const descendants: FlatCategoryNode[] = []
      let nextIdx = oldIndex + 1
      while (nextIdx < flatItems.length && flatItems[nextIdx] && flatItems[nextIdx].depth > draggedItem.depth) {
        descendants.push(flatItems[nextIdx])
        nextIdx++
      }

      // Đánh dấu ghost cho item đang kéo và con cháu của nó TẠI VỊ TRÍ CŨ
      displayItems = displayItems.map((item) => {
        if (item.id === activeId || descendants.some((d) => d.id === item.id)) {
          return { ...item, isGhost: true }
        }
        return item
      })

      // Xác định vị trí chèn placeholder trong mảng chứa cả ghost item ở vị trí cũ
      let unfilteredInsertIndex = displayItems.length
      let nonGhostCount = 0
      for (let i = 0; i < displayItems.length; i++) {
        if (!displayItems[i].isGhost) {
          if (nonGhostCount === placeholderInfo.index) {
            unfilteredInsertIndex = i
            break
          }
          nonGhostCount++
        }
      }

      let placeholderTitle = ''
      if (placeholderInfo.isValid) {
        if (placeholderInfo.depth === 1) {
          placeholderTitle = '↳ Thả làm danh mục gốc (Cấp 1)'
        } else {
          placeholderTitle = `↳ Thả làm con của "${placeholderInfo.parentTitle || 'Danh mục phía trước'}" (Cấp ${placeholderInfo.depth})`
        }
      } else {
        if (placeholderInfo.isAdoptError) {
          placeholderTitle = '🚫 Không thể thả: Không được bọc các danh mục đứng sau'
        } else if (placeholderInfo.isDraggedItemOffending) {
          placeholderTitle = '🚫 Không thể thả: Vị trí này vượt quá giới hạn 3 cấp'
        } else {
          placeholderTitle = `🚫 Không thể thả: Làm con "${placeholderInfo.offendingTitle}" vượt quá 3 cấp`
        }
      }

      displayItems.splice(unfilteredInsertIndex, 0, {
        id: 'placeholder',
        name: placeholderTitle,
        slug: '',
        description: null,
        children_count: 0,
        depth: placeholderInfo.depth,
        sort_order: 0,
        status: 'DRAFT',
        is_visible: true,
        parent_id: null,
        isPlaceholder: true,
        isValid: placeholderInfo.isValid,
      })
    }
  }

  const activeItem = flatItems.find((item) => item.id === activeId)

  // Lọc ra các items thực sự hiển thị dựa trên collapsedIds
  const visibleItems: typeof displayItems = []
  let skipDepth = 999
  for (const item of displayItems) {
    if (item.depth > skipDepth) {
      continue
    }
    skipDepth = 999
    visibleItems.push(item)
    if (collapsedIds.has(item.id)) {
      skipDepth = item.depth
    }
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            Cây Danh Mục Kéo Thả Phân Cấp
          </h3>
          <p className="text-muted-foreground text-xs">
            Kéo thả dọc để sắp xếp, kéo dịch ngang để đổi cấp. Hệ thống tự động lưu khi thả chuột.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reorderMutation.isPending && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse mr-2 bg-muted/50 px-2.5 py-1 rounded-md border">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Đang tự động lưu...</span>
            </div>
          )}
          
          {/* Nút Thu gọn / Mở rộng tất cả */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={collapsedIds.size > 0 ? handleExpandAll : handleCollapseAll}
            className="text-xs h-8 px-2.5 cursor-pointer font-medium hover:bg-muted text-muted-foreground flex items-center gap-1.5"
            title={collapsedIds.size > 0 ? "Mở rộng toàn bộ danh mục con" : "Thu nhỏ toàn bộ danh mục con"}
          >
            {collapsedIds.size > 0 ? (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5" />
                <span>Mở rộng tất cả</span>
              </>
            ) : (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5" />
                <span>Thu nhỏ tất cả</span>
              </>
            )}
          </Button>
          <div className="h-4 w-px bg-border mx-1" />

          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateItem?.(null)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Thêm danh mục
            </Button>
          )}
        </div>
      </div>

      {flatItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">Chưa có danh mục nào trong danh sách.</p>
          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateItem?.(null)}
              className="mt-3 cursor-pointer"
            >
              Tạo mục đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="relative border rounded-lg bg-card/50 p-4 min-h-[150px]">
          {/* Đường căn lề */}
          <div className="absolute inset-y-0 left-0 pointer-events-none select-none flex">
            <div className="w-[1px] h-full border-l border-dashed border-muted-foreground/15 ml-[36px]" title="Vạch Căn lề Cấp 1" />
            <div className="w-[1px] h-full border-l border-dashed border-muted-foreground/15 ml-[27px]" title="Vạch Căn lề Cấp 2" />
            <div className="w-[1px] h-full border-l border-dashed border-muted-foreground/15 ml-[27px]" title="Vạch Căn lề Cấp 3" />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="relative space-y-1 pr-1 z-10">
                {visibleItems.map((item) => {
                  if (item.isPlaceholder) {
                    return (
                      <div
                        key={item.id}
                        style={{ paddingLeft: `${(item.depth - 1) * 28}px` }}
                        className={cn(
                          'relative my-1 rounded-lg border border-dashed p-3 text-[11px] transition-all flex items-center justify-start gap-1.5 h-[50px] select-none font-medium',
                          item.isValid
                            ? 'border-primary/50 bg-primary/5 text-primary'
                            : 'border-destructive/50 bg-destructive/5 text-destructive font-semibold'
                        )}
                      >
                        {item.depth > 1 && (
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 border-l border-b border-primary/30 border-dashed rounded-bl-sm"
                            style={{
                              left: `${(item.depth - 2) * 28 + 14}px`,
                              width: '14px',
                              height: '24px'
                            }}
                          />
                        )}
                        <div className="shrink-0 ml-3">
                          {item.isValid ? (
                            <Plus className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <span className="truncate">
                          {item.name}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <SortableCategoryNode
                      key={item.id}
                      id={item.id}
                      title={item.name}
                      depth={item.depth}
                      status={item.status}
                      isVisible={item.is_visible}
                      isSelected={item.id === selectedItemId || item.id === justDroppedId}
                      isGhost={item.isGhost}
                      isValid={item.isValid}
                      onEdit={() => onSelectItem(item.id)}
                      onDelete={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${item.name}" cùng toàn bộ danh mục con?`)) {
                          deleteMutation.mutate(item.id)
                        }
                      }}
                      onAddChild={() => onCreateItem?.(item.id)}
                      articleCount={item.article_count}
                      isTranslated={item.is_translated}
                      isVirtual={(item as any).isVirtual}
                      hasChildren={item.children_count > 0}
                      isCollapsed={collapsedIds.has(item.id)}
                      onToggleCollapse={() => handleToggleCollapse(item.id)}
                    />
                  )
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeItem ? (
                <div className="opacity-90 scale-[1.02] shadow-2xl pointer-events-none">
                  <SortableCategoryNode
                    id={activeItem.id}
                    title={activeItem.name}
                    depth={1}
                    status={activeItem.status}
                    isVisible={activeItem.is_visible}
                    isSelected={true}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    articleCount={activeItem.article_count}
                    isTranslated={activeItem.is_translated}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  )
}
