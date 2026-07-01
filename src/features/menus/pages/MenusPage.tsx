import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Menu as MenuIcon, Sliders, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { menusService } from '../services/menusService'
import { MenuDragDropEditor } from '../components/MenuDragDropEditor'
import { MenuItemConfigPanel } from '../components/MenuItemConfigPanel'
import { MenuItemCreatePanel } from '../components/MenuItemCreatePanel'

export function MenusPage() {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [panelState, setPanelState] = useState<{
    mode: 'create' | 'edit' | null
    id: string | null
    parentId: string | null
  }>({
    mode: null,
    id: null,
    parentId: null,
  })

  // 1. Query lấy danh sách Menu (Header, Footer,...)
  const {
    data: menusList,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['menus-list'],
    queryFn: menusService.list,
  })

  // Tự động chọn menu đầu tiên khi load xong danh sách
  useEffect(() => {
    if (menusList && menusList.length > 0 && !selectedMenuId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMenuId(menusList[0].id)
    }
  }, [menusList, selectedMenuId])

  // 2. Query lấy cây Menu được chọn
  const {
    data: menuTree,
    isLoading: isTreeLoading,
    isError: isTreeError,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ['menu-tree', selectedMenuId],
    queryFn: () => menusService.getTree(selectedMenuId!),
    enabled: !!selectedMenuId,
  })

  // Đóng panel cấu hình chi tiết khi đổi menu
  const handleMenuChange = (menuId: string) => {
    setSelectedMenuId(menuId)
    setPanelState({ mode: null, id: null, parentId: null })
  }

  // Khối giao diện chính
  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MenuIcon className="h-6 w-6 text-primary" />
            Quản lý Menu điều hướng
          </h2>
          <p className="text-muted-foreground text-sm">
            Thiết lập cấu trúc liên kết hiển thị trên giao diện Trang chủ, Sidebar và Footer của Cổng thông tin.
          </p>
        </div>
      </div>

      {isListLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải danh sách menu...</p>
        </div>
      ) : isListError || !menusList ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải dữ liệu</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Không thể kết nối đến máy chủ để lấy danh sách menu. Vui lòng kiểm tra lại kết nối mạng.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchList()} className="mt-4 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Cột chọn Menu và Trực quan kéo thả (Cột bên trái) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Chọn Menu để chỉnh sửa</CardTitle>
                    <CardDescription className="text-xs">
                      Chọn vị trí hiển thị menu cần thiết lập cấu trúc.
                    </CardDescription>
                  </div>
                  {/* Dropdown chọn Menu */}
                  <div className="w-full sm:w-64">
                    <Select
                      value={selectedMenuId || ''}
                      onValueChange={handleMenuChange}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Chọn vị trí menu" />
                      </SelectTrigger>
                      <SelectContent>
                        {menusList.map((menu) => (
                          <SelectItem key={menu.id} value={menu.id}>
                            {menu.name} ({menu.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="border-t pt-4">
                {isTreeLoading ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-muted-foreground">Đang tải cấu trúc cây...</span>
                  </div>
                ) : isTreeError || !menuTree ? (
                  <div className="text-center py-8 text-sm text-destructive flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <span>Lỗi tải cấu trúc cây menu. Vui lòng thử lại.</span>
                    <Button variant="outline" size="sm" onClick={() => refetchTree()} className="mt-2">
                      Tải lại
                    </Button>
                  </div>
                ) : (
                  <MenuDragDropEditor
                    menuId={menuTree.id}
                    items={menuTree.items}
                    selectedItemId={panelState.mode === 'edit' ? panelState.id : null}
                    onSelectItem={(id) => setPanelState({ mode: id ? 'edit' : null, id, parentId: null })}
                    onCreateItem={(parentId) => setPanelState({ mode: 'create', id: null, parentId })}
                    refetchTree={refetchTree}
                    isCreating={panelState.mode === 'create'}
                    createParentId={panelState.parentId}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cột cấu hình chi tiết (Cột bên phải) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4">
            {panelState.mode === 'edit' && panelState.id && selectedMenuId ? (
              <ErrorBoundary>
                <MenuItemConfigPanel
                  key={panelState.id}
                  menuId={selectedMenuId}
                  itemId={panelState.id}
                  onClose={() => setPanelState({ mode: null, id: null, parentId: null })}
                  refetchTree={refetchTree}
                />
              </ErrorBoundary>
            ) : panelState.mode === 'create' && selectedMenuId ? (
              <ErrorBoundary>
                <MenuItemCreatePanel
                  key="create-panel"
                  menuId={selectedMenuId}
                  parentId={panelState.parentId}
                  onClose={() => setPanelState({ mode: null, id: null, parentId: null })}
                  refetchTree={refetchTree}
                  onSelectCreatedItem={(id) => setPanelState({ mode: 'edit', id, parentId: null })}
                />
              </ErrorBoundary>
            ) : (
              <Card className="border-border border-dashed bg-muted/10 shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Sliders className="h-10 w-10 opacity-30 mb-3 text-muted-foreground" />
                  <h4 className="font-medium text-sm text-foreground/80">Cấu hình Menu Item</h4>
                  <p className="text-xs max-w-[220px] mt-1 leading-normal">
                    Click vào nút cấu hình (icon bánh răng ⚙️) của một mục menu bên trái để chỉnh sửa tên hiển thị, icon và đường dẫn liên kết.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-destructive bg-destructive/5 rounded-xl text-left space-y-2">
          <h4 className="font-bold text-sm text-destructive">Lỗi Khởi Chạy Cấu Hình</h4>
          <p className="text-xs text-muted-foreground leading-normal">
            Không thể hiển thị Panel cấu hình mục menu do lỗi ứng dụng:
          </p>
          <pre className="text-[10px] bg-slate-900 text-rose-400 p-3 rounded font-mono overflow-auto max-h-40 leading-normal">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

