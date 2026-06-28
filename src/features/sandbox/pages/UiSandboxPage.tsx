import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { Loading } from '@/shared/components/Loading'
import { AlertCircle, CheckCircle, Info, Trash2, Edit } from 'lucide-react'
import { CmsEditor } from '@/shared/components/CmsEditor'

export function UiSandboxPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loadingOverlay, setLoadingOverlay] = useState(false)
  const [editorContent, setEditorContent] = useState(
    '<h2>Chào mừng đến với hệ thống CMS!</h2><p>Đây là trình soạn thảo nội dung hiện đại tích hợp <strong>CKEditor 5</strong> kết hợp thiết kế <strong>Shadcn UI</strong> và <strong>Tailwind CSS v4</strong>.</p><blockquote>Trải nghiệm biên tập nội dung chưa bao giờ mượt mà và trực quan đến thế.</blockquote>'
  )

  const triggerLoading = () => {
    setLoadingOverlay(true)
    setTimeout(() => setLoadingOverlay(false), 2000)
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thư viện UI Components</h2>
        <p className="text-muted-foreground">
          Trang thử nghiệm toàn bộ các thành phần UI dùng chung trong dự án.
        </p>
      </div>

      {loadingOverlay && <Loading fullPage />}

      <Tabs defaultValue="buttons" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="buttons">Nút bấm & Nhãn</TabsTrigger>
          <TabsTrigger value="inputs">Nhập liệu & Popup</TabsTrigger>
          <TabsTrigger value="dialogs">Hộp thoại & Ngăn kéo</TabsTrigger>
          <TabsTrigger value="feedback">Phản hồi & Tải</TabsTrigger>
          <TabsTrigger value="navigation">Điều hướng & Card</TabsTrigger>
          <TabsTrigger value="editor">Trình soạn thảo CMS</TabsTrigger>
        </TabsList>

        {/* TAB 1: Buttons & Badges */}
        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nút bấm (Buttons)</CardTitle>
              <CardDescription>Các biến thể nút bấm dùng chung trong hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button className="cursor-pointer">Chính (Mặc định)</Button>
              <Button variant="secondary" className="cursor-pointer">Phụ</Button>
              <Button variant="outline" className="cursor-pointer">Viền</Button>
              <Button variant="destructive" className="cursor-pointer">Xóa / Nguy hiểm</Button>
              <Button variant="ghost" className="cursor-pointer">Mờ</Button>
              <Button variant="link" className="cursor-pointer">Liên kết</Button>
              <Button disabled>Vô hiệu hóa</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nhãn trạng thái (Badges)</CardTitle>
              <CardDescription>Các loại nhãn hiển thị trạng thái.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Badge>Mặc định</Badge>
              <Badge variant="secondary">Phụ</Badge>
              <Badge variant="outline">Viền</Badge>
              <Badge variant="destructive">Nguy hiểm</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Inputs & Popups */}
        <TabsContent value="inputs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nhập liệu (Input)</CardTitle>
              <CardDescription>Thành phần Input cơ bản.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 max-w-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input mặc định</label>
                <Input placeholder="Nhập văn bản..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Input mật khẩu</label>
                <Input type="password" placeholder="Nhập mật khẩu..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Input bị vô hiệu hóa</label>
                <Input disabled placeholder="Không thể nhập liệu" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popups & Tooltips</CardTitle>
              <CardDescription>Popover và Tooltip của shadcn.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">Mở Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Cấu hình nhanh</h4>
                      <p className="text-sm text-muted-foreground">
                        Tùy chỉnh thông số hiển thị của trang dashboard.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">Rê chuột xem Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Đây là nội dung hướng dẫn nhanh của Tooltip!</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Dialogs & Drawers */}
        <TabsContent value="dialogs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modals & Ngăn kéo (Drawers)</CardTitle>
              <CardDescription>Hộp thoại tương tác chính của người dùng.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {/* Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer">Mở Dialog Modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm thành viên mới</DialogTitle>
                    <DialogDescription>
                      Nhập thông tin người dùng mới vào form bên dưới. Nhấn Lưu để hoàn tất.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Họ và tên..." />
                    <Input placeholder="Email..." />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Lưu lại</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">Mở Drawer (Mobile-friendly)</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      <DrawerTitle>Hành động nhanh</DrawerTitle>
                      <DrawerDescription>Danh sách tùy chọn hệ thống vuốt từ cạnh dưới.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">Bạn có thể nhúng danh sách tác vụ tại đây.</p>
                    </div>
                    <DrawerFooter>
                      <Button>Đồng ý</Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Hủy bỏ</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Custom Confirm Dialog */}
              <Button variant="destructive" onClick={() => setConfirmOpen(true)} className="cursor-pointer">
                Thử ConfirmDialog
              </Button>
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Xác nhận xóa dữ liệu?"
                description="Hành động này không thể hoàn tác. Dữ liệu thành viên sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu."
                confirmText="Xóa vĩnh viễn"
                variant="destructive"
                onConfirm={() => {
                  toast.success('Đã xóa dữ liệu thành công!')
                  setConfirmOpen(false)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Feedback & Loading */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông báo nhanh (Sonner Toasts)</CardTitle>
              <CardDescription>Thông báo Toast phản hồi thao tác.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => toast.success('Thao tác thành công!', { icon: <CheckCircle className="h-4 w-4 text-green-500" /> })}
              >
                Toast Thành công
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => toast.error('Đã xảy ra lỗi!', { icon: <AlertCircle className="h-4 w-4 text-destructive" /> })}
              >
                Toast Lỗi
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => toast.info('Thông báo: Phiên bản mới đã sẵn sàng.', { icon: <Info className="h-4 w-4 text-blue-500" /> })}
              >
                Toast Thông tin
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trạng thái tải dữ liệu (Loading / Skeleton)</CardTitle>
              <CardDescription>Spinner loading và Skeleton placeholder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button onClick={triggerLoading} className="cursor-pointer">Mở Loading toàn trang (2 giây)</Button>
                <div className="flex items-center gap-2 border px-4 py-2 rounded-md">
                  <span className="text-sm">Đang tải:</span>
                  <Loading size="sm" className="p-0 h-4 w-4" />
                </div>
              </div>

              {/* Skeletons */}
              <div className="flex items-center space-x-4 border p-4 rounded-md bg-muted/10 max-w-sm">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Navigation & Cards */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thanh định vị (Breadcrumbs)</CardTitle>
              <CardDescription>Hiển thị vị trí người dùng trong cấu trúc cây mục.</CardDescription>
            </CardHeader>
            <CardContent>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Hệ thống</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Thư viện UI</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </CardContent>
          </Card>

          {/* Empty State Component */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái danh sách trống (Empty State)</CardTitle>
              <CardDescription>Giao diện hiển thị khi một danh sách không có dữ liệu.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Trash2}
                title="Thư mục rỗng"
                description="Bạn chưa tạo tài liệu nào tại thư mục này. Bấm nút dưới để tạo mới ngay."
                actionLabel="Tạo tài liệu mới"
                onAction={() => toast.success('Tạo tài liệu mới thành công!')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: Rich Editor */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trình soạn thảo văn bản phong phú (CKEditor 5)</CardTitle>
              <CardDescription>
                Hỗ trợ định dạng bài viết chuyên nghiệp, chèn bảng, mã nguồn, trích dẫn và nhúng đa phương tiện.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CmsEditor value={editorContent} onChange={setEditorContent} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* HTML Source Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                    <Edit className="size-4" />
                    Mã HTML nguồn (Dữ liệu lưu trữ)
                  </h4>
                  <pre className="p-4 rounded-lg bg-muted text-xs font-mono select-all overflow-x-auto max-h-[300px] border border-border/80">
                    {editorContent}
                  </pre>
                </div>

                {/* Rendered HTML View */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                    <Info className="size-4" />
                    Xem trước kết quả (Render Preview)
                  </h4>
                  <div 
                    className="p-4 rounded-lg border bg-card min-h-[150px] max-h-[300px] overflow-y-auto ck-content prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: editorContent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default UiSandboxPage
