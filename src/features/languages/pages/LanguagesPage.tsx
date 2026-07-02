import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Star,
  Globe,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

import { languageService } from '../services/languageService'
import { SortableTableRow } from '../components/SortableTableRow'
import type { Language } from '../types'

export function LanguagesPage() {
  const queryClient = useQueryClient()

  // Danh sách hiển thị local phục vụ kéo thả mượt mà
  const [localLanguages, setLocalLanguages] = useState<Language[]>([])

  // State cho AlertDialog xác nhận thay đổi mặc định
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null)



  // Cấu hình các cảm biến kéo thả dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // Bắt đầu kéo sau khi di chuyển chuột 4px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Query lấy danh sách ngôn ngữ
  const {
    data: languages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languageService.getLanguages(false), // Chỉ hiển thị các ngôn ngữ không bị xóa mềm
  })



  // Đồng bộ danh sách local khi dữ liệu từ query thay đổi
  useEffect(() => {
    if (languages) {
      setLocalLanguages(languages)
    }
  }, [languages])



  // Mutation: Thay đổi trạng thái hoạt động (Enable/Disable)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (is_active) {
        return languageService.enableLanguage(id)
      } else {
        return languageService.disableLanguage(id)
      }
    },
    onSuccess: (res) => {
      toast.success(
        `Đã ${res.is_active ? 'kích hoạt' : 'vô hiệu hóa'} ngôn ngữ "${res.name}" thành công!`
      )
      queryClient.invalidateQueries({ queryKey: ['languages'] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Không thể cập nhật trạng thái ngôn ngữ.'
      toast.error(msg)
    },
  })

  // Mutation: Đặt làm mặc định
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => languageService.setDefaultLanguage(id),
    onSuccess: (res) => {
      toast.success(`Đã đặt ngôn ngữ "${res.name}" làm mặc định hệ thống thành công!`)
      queryClient.invalidateQueries({ queryKey: ['languages'] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Không thể đặt ngôn ngữ mặc định.'
      toast.error(msg)
    },
  })

  // Mutation: Sắp xếp lại thứ tự (Reorder)
  const reorderMutation = useMutation({
    mutationFn: (payload: { id: string; sort_order: number }[]) =>
      languageService.reorderLanguages(payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thứ tự sắp xếp ngôn ngữ!')
      queryClient.invalidateQueries({ queryKey: ['languages'] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Không thể lưu thứ tự sắp xếp.'
      toast.error(msg)
      refetch() // Quay lại danh sách từ server nếu có lỗi
    },
  })



  // Xử lý sự kiện kéo thả kết thúc
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalLanguages((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)

      const newList = arrayMove(prev, oldIndex, newIndex)

      // Tạo payload reorder chứa ID và sort_order mới
      const payload = newList.map((item, index) => ({
        id: item.id,
        sort_order: index * 10,
      }))

      // Gửi yêu cầu reorder xuống DB
      reorderMutation.mutate(payload)

      return newList
    })
  }

  // Hàm mở Dialog xác nhận đổi mặc định
  const triggerSetDefault = (lang: Language) => {
    setPendingLanguage(lang)
    setConfirmOpen(true)
  }

  // Xử lý xác nhận đổi ngôn ngữ mặc định
  const handleConfirmDefault = () => {
    if (!pendingLanguage) return
    setDefaultMutation.mutate(pendingLanguage.id)
    setConfirmOpen(false)
    setPendingLanguage(null)
  }

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Cấu hình ngôn ngữ
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sắp xếp thứ tự hiển thị bằng cách kéo thả và cấu hình ngôn ngữ mặc định hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {reorderMutation.isPending && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse bg-muted/50 px-2.5 py-1.5 rounded-md border">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Đang lưu thứ tự...</span>
            </div>
          )}
        </div>
      </div>



      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Đang tải danh sách ngôn ngữ...
          </p>
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải dữ liệu</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Không thể kết nối đến máy chủ để lấy danh sách ngôn ngữ. Vui lòng kiểm tra lại kết nối mạng.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-xs overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[80px]">Quốc kỳ</TableHead>
                  <TableHead>Tên ngôn ngữ</TableHead>
                  <TableHead className="w-[120px]">Mã code</TableHead>
                  <TableHead className="w-[120px]">Thứ tự</TableHead>
                  <TableHead className="w-[150px] text-center">Mặc định</TableHead>
                  <TableHead className="w-[150px] text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localLanguages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy ngôn ngữ nào trong hệ thống.
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext
                    items={localLanguages.map((lang) => lang.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localLanguages.map((lang) => {
                      const isDeleted = lang.deleted_at !== null
                      return (
                        <SortableTableRow
                          key={lang.id}
                          id={lang.id}
                          isDeleted={isDeleted}
                          isDragDisabled={false}
                        >
                          {/* Quốc kỳ */}
                          <TableCell className="align-middle">
                            <div className="h-6 w-10 rounded border overflow-hidden bg-muted flex items-center justify-center shadow-2xs">
                              {lang.flag_url ? (
                                <img
                                  src={lang.flag_url}
                                  alt={`${lang.name} Flag`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Globe className="h-3.5 w-3.5 text-muted-foreground/30" />
                              )}
                            </div>
                          </TableCell>

                          {/* Tên ngôn ngữ */}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>
                                {lang.name} ({lang.native_name})
                              </span>
                              {lang.is_system && (
                                <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-normal">
                                  Hệ thống
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Mã ngôn ngữ */}
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs select-all bg-muted/20 border-border/80">
                              {lang.code}
                            </Badge>
                          </TableCell>

                          {/* Thứ tự */}
                          <TableCell className="tabular-nums font-mono text-xs text-muted-foreground">
                            {lang.sort_order}
                          </TableCell>

                          {/* Mặc định */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {lang.is_default ? (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 flex items-center shadow-2xs">
                                  <Star className="h-3.5 w-3.5 fill-white" />
                                  Mặc định
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                  title="Đặt làm mặc định"
                                  onClick={() => triggerSetDefault(lang)}
                                  disabled={setDefaultMutation.isPending}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>

                          {/* Trạng thái */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={lang.is_active}
                                disabled={
                                  lang.is_default ||
                                  toggleStatusMutation.isPending
                                }
                                onCheckedChange={(checked) =>
                                  toggleStatusMutation.mutate({ id: lang.id, is_active: checked })
                                }
                                className="cursor-pointer"
                              />
                            </div>
                          </TableCell>
                        </SortableTableRow>
                      )
                    })}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </Card>
      )}

      {/* AlertDialog xác nhận đổi mặc định */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi mặc định?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn thay đổi ngôn ngữ mặc định của hệ thống sang{' '}
              <strong className="text-foreground">
                {pendingLanguage?.name} ({pendingLanguage?.native_name})
              </strong>{' '}
              không? Ngôn ngữ này sẽ được tự động kích hoạt nếu đang tắt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDefault}
              className="cursor-pointer"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LanguagesPage
