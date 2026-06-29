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
import type { Department } from '../types'

// Zod validation schema matching Backend validation and custom regex for loose URL checks
const departmentFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên bộ môn là bắt buộc' })
    .max(150, { message: 'Tên bộ môn không vượt quá 150 ký tự' }),
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
  phone: z.string()
    .trim()
    .max(50, { message: 'Số điện thoại không vượt quá 50 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  email: z.string()
    .trim()
    .max(100, { message: 'Email liên hệ không vượt quá 100 ký tự' })
    .email({ message: 'Địa chỉ email liên hệ không hợp lệ' })
    .nullable()
    .optional()
    .or(z.literal('')),
  website: z.string()
    .trim()
    .max(255, { message: 'Đường dẫn website không vượt quá 255 ký tự' })
    .refine(
      (val) => !val || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val),
      { message: 'Đường dẫn website không đúng định dạng' }
    )
    .nullable()
    .optional()
    .or(z.literal('')),
  office: z.string()
    .trim()
    .max(150, { message: 'Địa chỉ văn phòng không vượt quá 150 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
})

type DepartmentFormValues = z.infer<typeof departmentFormSchema>

// Hoist resolver static reference to optimize memory and react-hook-form re-renders
const departmentFormResolver = zodResolver(departmentFormSchema)

interface DepartmentFormProps {
  initialData: Department | null
  onSubmit: (values: DepartmentFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function DepartmentForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: DepartmentFormProps) {
  const isEditMode = !!initialData

  const form = useForm<DepartmentFormValues>({
    resolver: departmentFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      english_name: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      office: '',
      sort_order: 0,
      is_active: true,
    },
  })

  // Sync form values when active edit target shifts
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        english_name: initialData.english_name || '',
        description: initialData.description || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        website: initialData.website || '',
        office: initialData.office || '',
        sort_order: initialData.sort_order,
        is_active: initialData.is_active,
      })
    } else {
      form.reset({
        name: '',
        english_name: '',
        description: '',
        phone: '',
        email: '',
        website: '',
        office: '',
        sort_order: 0,
        is_active: true,
      })
    }
  }, [initialData, form])

  const handleFormSubmit = (data: DepartmentFormValues) => {
    // Clean strings and normalize empty fields to null
    const normalizedData = {
      ...data,
      english_name: data.english_name ? data.english_name.trim() : null,
      description: data.description ? data.description.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      email: data.email ? data.email.trim() : null,
      website: data.website ? data.website.trim() : null,
      office: data.office ? data.office.trim() : null,
    }
    onSubmit(normalizedData)
  }

  return (
    <Card className="border shadow-xs text-left">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {isEditMode ? 'Cập nhật bộ môn' : 'Thêm bộ môn mới'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isEditMode
            ? 'Thay đổi thông tin chi tiết của bộ môn đang chọn.'
            : 'Tạo mới bộ môn giảng dạy, đào tạo khoa học trong trường.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            
            {/* Tên bộ môn */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Tên bộ môn <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Bộ môn Khoa học máy tính..."
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
                      placeholder="Ví dụ: Department of Computer Science..."
                      className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Điện thoại */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Điện thoại</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0238-xxxxxx"
                        className="text-xs focus-visible:ring-primary/20 h-9 bg-background font-mono"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Văn phòng */}
              <FormField
                control={form.control}
                name="office"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Văn phòng</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="P. 302, Nhà A5..."
                        className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Email liên hệ */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Email liên hệ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username@vinhuni.edu.vn"
                      className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Địa chỉ Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://fit.vinhuni.edu.vn"
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

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Mô tả bộ môn</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả giới thiệu lịch sử, định hướng nghiên cứu..."
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
                      Cho phép hiển thị và gán giảng viên vào bộ môn này.
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
    </Card>
  )
}
