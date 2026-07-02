import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/shared/components/ui/card'
import { Globe, Languages, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tag } from '../types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ColorPickerField } from './ColorPickerField'
import { useTagForm, slugify } from '../hooks/useTagForm'

interface TagFormProps {
  initialData: Tag | null
  onSubmit: (values: any) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function TagForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: TagFormProps) {
  const isEditMode = !!initialData

  const {
    form,
    activeTab,
    setActiveTab,
    isTranslating,
    showConfirm,
    setShowConfirm,
    isCheckingSlug,
    handleTranslateClick,
    handleFormSubmit,
    handleAutoTranslate
  } = useTagForm({ initialData, onSubmit })

  return (
    <Card className="border shadow-xs text-left max-h-[90vh] flex flex-col overflow-hidden">
      <CardHeader className="pb-4 shrink-0">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {isEditMode ? 'Cập nhật thẻ' : 'Thêm thẻ mới'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isEditMode
            ? 'Thay đổi thông tin chi tiết của thẻ đang chọn.'
            : 'Tạo mới thẻ phân loại bài viết trên hệ thống.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4 overflow-y-auto flex-1 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">

            {/* Color Picker Component */}
            <ColorPickerField
              value={form.watch('color') || ''}
              onChange={(color) => form.setValue('color', color)}
            />

            {/* Nội dung Đa Ngôn Ngữ */}
            <div className="space-y-3 border border-border/80 p-3.5 rounded-xl bg-muted/5 relative">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Nội dung Đa Ngôn Ngữ <span className="text-destructive">*</span></span>
                </div>
                <div className="flex items-center gap-2">
                  {isTranslating && (
                    <span className="text-[10px] text-emerald-600 font-medium animate-pulse flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Đang dịch tự động...
                    </span>
                  )}
                  {activeTab === 'vi' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 border-primary/30 text-[10px] px-2 text-primary hover:bg-primary/5 cursor-pointer flex items-center gap-1"
                      onClick={handleTranslateClick}
                      disabled={isTranslating || !form.watch('translations.vi.name')?.trim()}
                    >
                      <Languages className="h-3.5 w-3.5" /> Dịch tự động
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabs Selector */}
              <div className="flex border bg-muted/20 rounded-lg p-1 gap-1">
                {[
                  { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
                  { code: 'en' as const, label: 'Tiếng Anh', flag: '🇬🇧' },
                ].map((tab) => {
                  const nameVal = form.watch(`translations.${tab.code}.name`)
                  const isTabDone = !!nameVal?.trim()
                  return (
                    <button
                      key={tab.code}
                      type="button"
                      onClick={() => setActiveTab(tab.code)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer relative",
                        activeTab === tab.code
                          ? "bg-card text-foreground shadow-xs border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <span>{tab.flag}</span>
                      <span>{tab.label}</span>
                      {!isTabDone && (
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse absolute -top-0.5 -right-0.5" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Input fields theo tab đang active */}
              <div className="space-y-3 pt-2">
                {/* Tên thẻ */}
                <FormField
                  control={form.control}
                  name={`translations.${activeTab}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Tên thẻ ({activeTab.toUpperCase()}) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={activeTab === 'vi' ? "Ví dụ: Tin tức, Tuyển sinh..." : "Example: News, Admissions..."}
                          className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            form.setValue(`translations.${activeTab}.slug`, slugify(e.target.value))
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name={`translations.${activeTab}.slug`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold flex items-center justify-between">
                        <span>Slug ({activeTab.toUpperCase()})</span>
                        {isCheckingSlug && (
                          <span className="text-[10px] text-primary animate-pulse font-normal flex items-center gap-1">
                            <span className="h-2 w-2 animate-spin rounded-full border border-primary border-t-transparent" />
                            Đang kiểm tra...
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={activeTab === 'vi' ? "tin-tuc" : "news"}
                          className="text-xs focus-visible:ring-primary/20 h-9 bg-background font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                        Để trống hệ thống sẽ tự tạo từ tên thẻ.
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Mô tả */}
                <FormField
                  control={form.control}
                  name={`translations.${activeTab}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Mô tả ({activeTab.toUpperCase()})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={activeTab === 'vi' ? "Nhập mô tả ngắn cho thẻ..." : "Enter short description..."}
                          className="text-xs focus-visible:ring-primary/20 min-h-[70px] bg-background resize-none leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Thứ tự sắp xếp */}
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Thứ tự sắp xếp</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0, 1, 2..."
                      className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                    Độ ưu tiên hiển thị trên danh sách (số nhỏ hơn xếp trên).
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Trạng thái hoạt động */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 bg-muted/10">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-semibold">Đang hoạt động</FormLabel>
                    <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                      Cho phép hiển thị thẻ này khi gán vào bài viết.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="scale-75 cursor-pointer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/80">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="cursor-pointer text-xs h-9 font-medium"
                >
                  Hủy chỉnh sửa
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="cursor-pointer text-xs h-9 font-semibold gap-1.5"
              >
                {isSubmitting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isEditMode ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>

          </form>
        </Form>
      </CardContent>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Xác nhận ghi đè bản dịch"
        description="Thông tin Tiếng Anh (Tên/Mô tả) hiện tại đã có dữ liệu. Bạn có chắc chắn muốn dịch lại và ghi đè bản dịch cũ không?"
        onConfirm={() => {
          handleAutoTranslate()
          setShowConfirm(false)
        }}
      />
    </Card>
  )
}
