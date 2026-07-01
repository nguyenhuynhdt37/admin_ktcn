/* eslint-disable */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, Sliders, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { categoryService } from '../services/categoryService'
import { CategoryDragDropEditor } from '../components/CategoryDragDropEditor'
import { CategoryFormPanel } from '../components/CategoryFormPanel'

export function CategoriesPage() {
  const [panelState, setPanelState] = useState<{
    mode: 'edit' | 'create' | null
    id: string | null
    parentId: string | null
  }>({
    mode: null,
    id: null,
    parentId: null,
  })

  // Query lấy cấu trúc cây danh mục đầy đủ từ Backend
  const {
    data: treeData = [],
    isLoading,
    isError,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ['category-tree'],
    queryFn: categoryService.getCategoryTree,
  })

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          Quản lý danh mục
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Thiết lập cấu trúc cây danh mục bài viết. Hỗ trợ kéo thả thay đổi vị trí, thụt lề cấp độ và sinh SEO bằng AI.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải cấu trúc danh mục...</p>
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải dữ liệu</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Không thể kết nối đến máy chủ để lấy cấu trúc danh mục. Vui lòng kiểm tra lại kết nối mạng.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchTree()} className="mt-4 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Cột trái (Kéo thả trực quan) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Card className="border-border shadow-xs">
              <CardContent className="pt-6">
                <CategoryDragDropEditor
                  items={treeData}
                  selectedItemId={panelState.mode === 'edit' ? panelState.id : null}
                  onSelectItem={(id) => setPanelState({ mode: id ? 'edit' : null, id, parentId: null })}
                  onCreateItem={(parentId) => setPanelState({ mode: 'create', id: null, parentId })}
                  refetchTree={refetchTree}
                  isCreating={panelState.mode === 'create'}
                  createParentId={panelState.parentId}
                />
              </CardContent>
            </Card>
          </div>

          {/* Cột phải (Form cấu hình chi tiết) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4">
            {panelState.mode ? (
              <CategoryFormPanel
                mode={panelState.mode}
                selectedCategoryId={panelState.id || ''}
                createParentId={panelState.parentId}
                onClose={() => setPanelState({ mode: null, id: null, parentId: null })}
                refetchTree={refetchTree}
                onSelectCreatedItem={(id) => setPanelState({ mode: 'edit', id, parentId: null })}
              />
            ) : (
              <Card className="border-border border-dashed bg-muted/10 shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Sliders className="h-10 w-10 opacity-30 mb-3 text-muted-foreground" />
                  <h4 className="font-medium text-sm text-foreground/80">Cấu hình danh mục</h4>
                  <p className="text-xs max-w-[220px] mt-1 leading-normal">
                    Click vào nút cấu hình (icon bánh răng ⚙️) hoặc tên của một danh mục bên trái để chỉnh sửa thông tin chi tiết, đường dẫn và cấu hình Meta SEO.
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
