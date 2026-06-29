import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Sparkles } from 'lucide-react'
import type { Position } from '../types'

// Zod validation schema matching FastAPI Backend expectations
const positionFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên chức vụ là bắt buộc' })
    .max(150, { message: 'Tên chức vụ không vượt quá 150 ký tự' }),
  english_name: z.string()
    .trim()
    .max(150, { message: 'Tên tiếng Anh không vượt quá 150 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  description: z.string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal('')),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
})

type PositionFormValues = z.infer<typeof positionFormSchema>

const positionFormResolver = zodResolver(positionFormSchema)

interface PositionFormProps {
  initialData: Position | null
  onSubmit: (values: PositionFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function PositionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: PositionFormProps) {
  const isEditMode = !!initialData

  const form = useForm<PositionFormValues>({
    resolver: positionFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      english_name: '',
      description: '',
      sort_order: 0,
      is_active: true,
    },
  })

  // Sync form values when editing item changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        english_name: initialData.english_name || '',
        description: initialData.description || '',
        sort_order: initialData.sort_order,
        is_active: initialData.is_active,
      })
    } else {
      form.reset({
        name: '',
        english_name: '',
        description: '',
        sort_order: 0,
        is_active: true,
      })
    }
  }, [initialData, form])

  const handleFormSubmit = (data: PositionFormValues) => {
    // Chuẩn hóa dữ liệu đầu ra: convert empty string to null/undefined
    const normalizedData = {
      ...data,
      english_name: data.english_name ? data.english_name.trim() : null,
      description: data.description ? data.description.trim() : null,
    }
    onSubmit(normalizedData)
  }

  return (
    <Card className="border shadow-xs text-left">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {isEditMode ? 'Cập nhật chức vụ' : 'Thêm chức vụ mới'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isEditMode
            ? 'Thay đổi thông tin chi tiết của chức vụ đang chọn.'
            : 'Tạo mới chức vụ giảng dạy hoặc quản lý trong trường.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            
            {/* Tên chức vụ */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Tên chức vụ <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Giảng viên, Trưởng bộ môn..."
                      className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Tên tiếng Anh */}
            <FormField
              control={form.control}
              name="english_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Tên tiếng Anh</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Lecturer, Head of Department..."
                      className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

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
                      placeholder="Ví dụ: 10, 20..."
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

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Mô tả chức vụ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả tóm tắt nhiệm vụ của chức vụ này..."
                      className="text-xs focus-visible:ring-primary/20 min-h-[90px] bg-background resize-none leading-relaxed"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
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
                      Cho phép gán chức vụ này cho giảng viên.
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

            {/* Form actions inside Card Footer */}
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
    </Card>
  )
}
