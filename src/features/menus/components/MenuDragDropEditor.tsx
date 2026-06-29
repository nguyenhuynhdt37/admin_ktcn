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
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { menusService } from '../services/menusService'
import { SortableMenuItem } from './SortableMenuItem'
import type { MenuItemNode, FlatMenuItem } from '../types'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthProvider'

interface MenuDragDropEditorProps {
  menuId: string
  items: MenuItemNode[]
  selectedItemId: string | null
  onSelectItem: (itemId: string | null) => void
  refetchTree: () => void
}

// 1. Helper: Làm phẳng cấu trúc cây menu thành danh sách phẳng (Flat List)
function flattenTree(nodes: MenuItemNode[], parentId: string | null = null): FlatMenuItem[] {
  let result: FlatMenuItem[] = []
  nodes.forEach((node) => {
    const { children, ...rest } = node
    result.push({ ...rest, parent_id: parentId })
    if (children && children.length > 0) {
      result = result.concat(flattenTree(children, node.id))
    }
  })
  return result
}

// 2. Helper: Tự động tính toán lại parent_id và điều chỉnh depth của toàn bộ danh sách phẳng
function recalculateParentsAndDepths(flatItems: FlatMenuItem[]): FlatMenuItem[] {
  const result = flatItems.map((item) => ({ ...item }))
  for (let i = 0; i < result.length; i++) {
    const current = result[i]
    if (i === 0) {
      // Item đầu tiên luôn luôn ở cấp ngoài cùng (Cấp 1)
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
      // Tìm phần tử gần nhất phía trước có depth = current.depth - 1
      let foundParentId: string | null = null
      for (let j = i - 1; j >= 0; j--) {
        if (result[j].depth === current.depth - 1) {
          foundParentId = result[j].id
          break
        }
      }
      current.parent_id = foundParentId

      // Nếu không tìm thấy cha thích hợp, hạ cấp xuống cấp 1
      if (!foundParentId) {
        current.depth = 1
        current.parent_id = null
      }
    }
  }
  return result
}

export function MenuDragDropEditor({
  menuId,
  items,
  selectedItemId,
  onSelectItem,
  refetchTree,
}: MenuDragDropEditorProps) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('menu.update')
  const canCreate = hasPermission('menu.create')

  const queryClient = useQueryClient()
  const [flatItems, setFlatItems] = useState<FlatMenuItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // State lưu ID của item vừa được thả để kích hoạt hiệu ứng sáng active (flash)
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null)

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

  // Đồng bộ flat items khi tree items từ API thay đổi
  useEffect(() => {
    setFlatItems(flattenTree(items))
    setActiveId(null)
    setPlaceholderInfo(null)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // Độ nhạy kéo thả cực tốt
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Mutation auto-save cấu trúc cây lên backend
  const reorderMutation = useMutation({
    mutationFn: (payload: { id: string; parent_id: string | null; sort_order: number; depth: number }[]) =>
      menusService.reorder(menuId, payload as any),
    onSuccess: () => {
      toast.success('Đã tự động lưu cấu trúc menu!')
      refetchTree()
      queryClient.invalidateQueries({ queryKey: ['menu-tree', menuId] })
    },
    onError: (error: any) => {
      const errCode = error.response?.data?.error?.code
      if (errCode === 'MAX_DEPTH_EXCEEDED') {
        toast.error('Không thể di chuyển. Độ sâu tối đa của Menu là 3 cấp.')
      } else {
        toast.error('Có lỗi xảy ra khi tự động lưu cấu trúc menu.')
      }
      refetchTree() // Phục hồi dữ liệu từ database để reset UI nếu có lỗi
    },
  })

  // Mutation tạo item mới (Cấp 1 hoặc làm con của mục khác)
  const createMutation = useMutation({
    mutationFn: (parentId: string | null = null) =>
      menusService.createItem(menuId, {
        title: parentId ? 'Mục menu con mới' : 'Mục menu mới',
        target_type: null,
        target_id: null,
        external_url: null,
        open_in_new_tab: false,
        is_visible: true,
        parent_id: parentId,
      } as any),
    onSuccess: (newItm) => {
      toast.success((newItm as any).parent_id ? 'Đã thêm mục menu con mới!' : 'Đã thêm mục menu mới!')
      refetchTree()
      onSelectItem(newItm.id) // Tự động mở form cấu hình
    },
    onError: () => {
      toast.error('Không thể thêm mục menu.')
    },
  })

  // Mutation xóa item
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => menusService.deleteItem(menuId, itemId),
    onSuccess: () => {
      toast.success('Đã xóa mục menu thành công!')
      if (selectedItemId) onSelectItem(null)
      refetchTree()
    },
    onError: () => {
      toast.error('Không thể xóa mục menu.')
    },
  })

  // Bắt đầu kéo
  const handleDragStart = (event: DragStartEvent) => {
    if (!canUpdate) return
    setActiveId(event.active.id as string)
    setPlaceholderInfo(null)
  }

  // Khi đang di chuyển chuột (Tính toán vị trí thả dự kiến và render placeholder line/box)
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

    // 1. Tìm cụm con cháu của item đang kéo
    const descendants: FlatMenuItem[] = []
    const draggedItem = flatItems[oldIndex]
    if (!draggedItem) return

    let nextIdx = oldIndex + 1
    while (nextIdx < flatItems.length && flatItems[nextIdx] && flatItems[nextIdx].depth > draggedItem.depth) {
      descendants.push(flatItems[nextIdx])
      nextIdx++
    }

    // Đo chiều sâu con cháu lớn nhất hiện tại của cụm đang kéo (trước khi di chuyển)
    let maxChildDepthInCluster = draggedItem.depth
    descendants.forEach((d) => {
      if (d.depth > maxChildDepthInCluster) {
        maxChildDepthInCluster = d.depth
      }
    })

    // Danh sách phẳng đã lọc cụm đang kéo
    const itemsWithoutCluster = flatItems.filter(
      (item) => item.id !== activeId && !descendants.some((d) => d.id === item.id)
    )

    // Xác định vị trí chèn mới
    let targetIndex = itemsWithoutCluster.findIndex((item) => item.id === overId)
    if (targetIndex === -1) targetIndex = itemsWithoutCluster.length

    const isBelow = overIndex > oldIndex
    const insertIndex = Math.min(
      itemsWithoutCluster.length,
      isBelow ? targetIndex + 1 : targetIndex
    )

    // 2. Tính toán depth dự kiến của placeholder (lệch ngang delta.x)
    const horizontalOffset = Math.round(delta.x / 28)
    let projectedDepth = draggedItem.depth + horizontalOffset
    projectedDepth = Math.max(1, Math.min(3, projectedDepth))

    // Hạn chế thụt lề sâu hơn node đứng ngay trước nó + 1 cấp
    const prevItem = insertIndex > 0 ? itemsWithoutCluster[insertIndex - 1] : null
    if (prevItem && projectedDepth > prevItem.depth + 1) {
      projectedDepth = prevItem.depth + 1
    }
    // Node đầu tiên của cây luôn có depth = 1
    if (insertIndex === 0) {
      projectedDepth = 1
    }

    // 3. Tính toán chiều sâu thực tế của cụm và xác định phần tử gây ra lỗi vượt cấp
    const depthDiff = projectedDepth - draggedItem.depth
    let offendingItem: FlatMenuItem | null = null

    // Check xem dragged item hoặc con cháu có vượt quá 3 cấp không
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

    // Check quy tắc bọc vô lý: Một item nhỏ (cấp dưới) được chèn đứng trước item to hơn
    // không được phép tự dưng biến item to hơn đứng sau thành con của nó.
    if (isValid) {
      const nextItem = insertIndex < itemsWithoutCluster.length ? itemsWithoutCluster[insertIndex] : null
      // Nếu phần tử kế sau có depth lớn hơn projectedDepth, nó sẽ bị thụt lề làm con của placeholder.
      if (nextItem && nextItem.depth > projectedDepth) {
        isValid = false
        isAdoptError = true
      }
    }

    // 4. Tìm tên mục cha dự kiến của placeholder để hiển thị nhãn hướng dẫn trực quan
    let parentTitle = ''
    if (projectedDepth > 1) {
      for (let j = insertIndex - 1; j >= 0; j--) {
        if (itemsWithoutCluster[j].depth === projectedDepth - 1) {
          parentTitle = itemsWithoutCluster[j].title
          break
        }
      }
    }

    setPlaceholderInfo({
      index: insertIndex,
      depth: projectedDepth,
      isValid,
      parentTitle,
      offendingTitle: offendingItem ? offendingItem.title : '',
      isDraggedItemOffending: offendingItem?.id === draggedItem.id,
      isAdoptError,
    })
  }

  // Kết thúc kéo thả (Thả chuột)
  const handleDragEnd = (event: DragEndEvent) => {
    if (!canUpdate) return
    const cachedPlaceholder = placeholderInfo
    
    // Gộp việc reset activeId và placeholderInfo vào cùng chu trình với state flatItems
    // để tránh hiện tượng flicker nháy giật về vị trí cũ/depth cũ trước khi render
    if (!cachedPlaceholder) {
      setActiveId(null)
      setPlaceholderInfo(null)
      return
    }

    // 1. Kiểm tra tính hợp lệ trước khi drop
    if (!cachedPlaceholder.isValid) {
      if (cachedPlaceholder.isAdoptError) {
        toast.error('Không thể di chuyển. Không được phép bọc các mục độc lập đứng sau.')
      } else {
        toast.error('Không thể di chuyển. Độ sâu tối đa của Menu là 3 cấp.')
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

    // 2. Cập nhật danh sách flatItems chính thức
    setFlatItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId)
      if (oldIndex === -1) {
        setActiveId(null)
        setPlaceholderInfo(null)
        return prev
      }

      const descendants: FlatMenuItem[] = []
      const draggedItem = prev[oldIndex]

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

      // Kích hoạt hiệu ứng sáng active (flash) khi thả thành công
      setJustDroppedId(activeId)
      setTimeout(() => {
        setJustDroppedId(null)
      }, 1500)

      // 3. AUTO-SAVE: Tự động lưu ngay lập tức
      const payload = finalized.map((item, index) => ({
        id: item.id,
        parent_id: item.parent_id,
        sort_order: index,
        depth: item.depth,
      }))
      
      reorderMutation.mutate(payload)

      // Set null đồng thời trong callback setState để batch render hoàn tất cùng lúc
      setActiveId(null)
      setPlaceholderInfo(null)

      return finalized
    })
  }

  let displayItems = flatItems.map((item) => ({ ...item }))

  if (activeId && placeholderInfo) {
    const oldIndex = flatItems.findIndex((item) => item.id === activeId)
    const draggedItem = flatItems[oldIndex]

    if (draggedItem) {
      const descendants: FlatMenuItem[] = []
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

      // Tạo nhãn mô tả vị trí thả cực kỳ chi tiết, nói rõ nguyên nhân lỗi nếu có
      let placeholderTitle = ''
      if (placeholderInfo.isValid) {
        if (placeholderInfo.depth === 1) {
          placeholderTitle = '↳ Thả làm mục ngoài cùng (Cấp 1)'
        } else {
          placeholderTitle = `↳ Thả làm con của "${placeholderInfo.parentTitle || 'Mục phía trước'}" (Cấp ${placeholderInfo.depth})`
        }
      } else {
        if (placeholderInfo.isAdoptError) {
          placeholderTitle = '🚫 Không thể thả: Không được bọc các mục độc lập đứng sau'
        } else if (placeholderInfo.isDraggedItemOffending) {
          placeholderTitle = '🚫 Không thể thả: Vị trí này vượt quá giới hạn 3 cấp'
        } else {
          placeholderTitle = `🚫 Không thể thả: Làm mục con "${placeholderInfo.offendingTitle}" vượt quá 3 cấp`
        }
      }

      displayItems.splice(unfilteredInsertIndex, 0, {
        id: 'placeholder',
        title: placeholderTitle,
        depth: placeholderInfo.depth,
        target_type: null,
        target_id: null,
        target_info: null,
        external_url: null,
        open_in_new_tab: false,
        icon: null,
        sort_order: 0,
        is_visible: true,
        parent_id: null,
        has_link: false,
        isPlaceholder: true, // Đánh dấu item là placeholder
        isValid: placeholderInfo.isValid,
      })
    }
  }

  const activeItem = flatItems.find((item) => item.id === activeId)

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            Cây Menu Kéo Thả Phân Cấp
          </h3>
          <p className="text-muted-foreground text-xs">
            Kéo thả dọc để sắp xếp, kéo dịch ngang để đổi cấp. Hệ thống tự động lưu khi thả chuột.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reorderMutation.isPending && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse mr-2 bg-muted/50 px-2.5 py-1 rounded-md border">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Đang tự động lưu...</span>
            </div>
          )}
          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => createMutation.mutate(null)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Thêm mục menu
            </Button>
          )}
        </div>
      </div>

      {flatItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">Chưa có mục menu nào trong danh sách.</p>
          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => createMutation.mutate(null)}
              className="mt-3 cursor-pointer"
            >
              Tạo mục đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="relative border rounded-lg bg-card/50 p-4 min-h-[150px]">
          {/* 3 đường kẻ dọc hướng dẫn căn lề phân cấp (Guidelines) */}
          <div className="absolute inset-y-0 left-0 pointer-events-none select-none flex">
            {/* Trục Cấp 1: x = 20px (giữa drag handle) + p-4(16px) = 36px */}
            <div className="w-[1px] h-full border-l border-dashed border-muted-foreground/15 ml-[36px]" title="Vạch Căn lề Cấp 1" />
            {/* Trục Cấp 2: x = 36px + 28px = 64px (ml = 27px) */}
            <div className="w-[1px] h-full border-l border-dashed border-muted-foreground/15 ml-[27px]" title="Vạch Căn lề Cấp 2" />
            {/* Trục Cấp 3: x = 64px + 28px = 92px (ml = 27px) */}
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
              items={displayItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="relative space-y-1 pr-1 z-10">
                {displayItems.map((item) => {
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
                        {/* Nét vẽ nhánh đứt kết nối trực tiếp với cha của placeholder */}
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
                        <span className="shrink-0 ml-4">
                          {item.isValid ? '➕' : '🚫'}
                        </span>
                        <span className="truncate">
                          {item.title}
                        </span>
                      </div>
                    )
                  }

                  // Render Normal Menu Item Card
                  return (
                    <SortableMenuItem
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      depth={item.depth}
                      targetType={item.target_type}
                      targetInfo={item.target_info}
                      externalUrl={item.external_url}
                      isVisible={item.is_visible}
                      isSelected={item.id === selectedItemId || item.id === justDroppedId}
                      isGhost={item.isGhost}
                      isValid={item.isValid}
                      icon={item.icon}
                      onEdit={() => onSelectItem(item.id)}
                      onDelete={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa mục "${item.title}" cùng toàn bộ mục con?`)) {
                          deleteMutation.mutate(item.id)
                        }
                      }}
                      onAddChild={() => createMutation.mutate(item.id)}
                    />
                  )
                })}
              </div>
            </SortableContext>

            {/* Overlay kéo thả mượt mà */}
            <DragOverlay>
              {activeItem ? (
                <div className="opacity-90 scale-[1.02] shadow-2xl pointer-events-none">
                  <SortableMenuItem
                    id={activeItem.id}
                    title={activeItem.title}
                    depth={1}
                    targetType={activeItem.target_type}
                    targetInfo={activeItem.target_info}
                    externalUrl={activeItem.external_url}
                    isVisible={activeItem.is_visible}
                    isSelected={true}
                    icon={activeItem.icon}
                    onEdit={() => {}}
                    onDelete={() => {}}
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
