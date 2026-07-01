import { useEffect, useState, useRef } from 'react'
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
import { Label } from '@/shared/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/shared/components/ui/card'
import { Sparkles, Globe, Languages, Camera, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { httpClient } from '@/services/http/client'
import { toast } from 'sonner'
import { getMediaUrl } from '@/features/articles/utils/media'
import type { Department } from '../types'

const translationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên bộ môn là bắt buộc' })
    .max(150, { message: 'Tên bộ môn không vượt quá 150 ký tự' }),
  description: z.string()
    .trim()
    .max(1000, { message: 'Mô tả không vượt quá 1000 ký tự' })
    .optional()
    .or(z.literal('')),
})

const departmentFormSchema = z.object({
  thumbnail_object_key: z.string()
    .min(1, { message: 'Ảnh đại diện bộ môn là bắt buộc' }),
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
  translations: z.object({
    vi: translationSchema,
    en: translationSchema,
  })
})

type DepartmentFormValues = z.infer<typeof departmentFormSchema>

const departmentFormResolver = zodResolver(departmentFormSchema)

interface DepartmentFormProps {
  initialData: Department | null
  onSubmit: (values: any) => void
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
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [lastTranslatedVi, setLastTranslatedVi] = useState('')
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<DepartmentFormValues>({
    resolver: departmentFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: {
      thumbnail_object_key: '',
      phone: '',
      email: '',
      website: '',
      office: '',
      sort_order: 0,
      is_active: true,
      translations: {
        vi: { name: '', description: '' },
        en: { name: '', description: '' }
      }
    },
  })

  // Sync form values when active edit target shifts
  useEffect(() => {
    if (initialData) {
      form.reset({
        thumbnail_object_key: initialData.thumbnail_object_key || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        website: initialData.website || '',
        office: initialData.office || '',
        sort_order: initialData.sort_order,
        is_active: initialData.is_active,
        translations: {
          vi: {
            name: initialData.translations?.vi?.name || initialData.name || '',
            description: initialData.translations?.vi?.description || initialData.description || '',
          },
          en: {
            name: initialData.translations?.en?.name || '',
            description: initialData.translations?.en?.description || '',
          }
        }
      })
      if (initialData.translations?.vi?.name) {
        setLastTranslatedVi(initialData.translations.vi.name)
      }
      if (initialData.thumbnail_object_key) {
        setThumbnailPreviewUrl(getMediaUrl(initialData.thumbnail_object_key))
      } else {
        setThumbnailPreviewUrl(null)
      }
    } else {
      form.reset({
        thumbnail_object_key: '',
        phone: '',
        email: '',
        website: '',
        office: '',
        sort_order: 0,
        is_active: true,
        translations: {
          vi: { name: '', description: '' },
          en: { name: '', description: '' }
        }
      })
      setLastTranslatedVi('')
      setThumbnailPreviewUrl(null)
    }
    setActiveTab('vi')
  }, [initialData, form])

  // Debounced auto-translate tiếng Việt sang tiếng Anh cho phần Tên bộ môn
  const viName = form.watch('translations.vi.name')
  const debouncedViName = useDebounce(viName, 1000)

  useEffect(() => {
    const autoTranslate = async () => {
      const trimmedVi = debouncedViName?.trim()
      if (!trimmedVi || trimmedVi === lastTranslatedVi) return

      const currentEnName = form.getValues('translations.en.name')?.trim()
      if (currentEnName) return // Đã có tên tiếng Anh rồi thì không dịch đè

      setIsTranslating(true)
      try {
        const res = await httpClient.post<Record<string, string>>('/translation', {
          text: trimmedVi,
          target_languages: ['en']
        })
        if (res.data?.en) {
          form.setValue('translations.en.name', res.data.en)
          setLastTranslatedVi(trimmedVi)
        }
      } catch (err) {
        console.error('Lỗi dịch tự động Bộ môn:', err)
      } finally {
        setIsTranslating(false)
      }
    }

    autoTranslate()
  }, [debouncedViName, lastTranslatedVi, form])

  // Tải ảnh thumbnail lên hệ thống
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingThumbnail(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await httpClient.post<{ object_key: string }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      form.setValue('thumbnail_object_key', data.object_key, { shouldValidate: true })
      setThumbnailPreviewUrl(getMediaUrl(data.object_key))
      toast.success('Tải ảnh đại diện bộ môn thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Tải ảnh lên thất bại')
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  // Gỡ bỏ ảnh đại diện
  const handleThumbnailRemove = () => {
    form.setValue('thumbnail_object_key', '', { shouldValidate: true })
    setThumbnailPreviewUrl(null)
    toast.success('Đã gỡ bỏ ảnh đại diện bộ môn.')
  }

  // Hàm click dịch tự động thủ công (dịch cả tên và mô tả)
  const handleAutoTranslate = async () => {
    const nameToTranslate = form.getValues('translations.vi.name')?.trim()
    const descToTranslate = form.getValues('translations.vi.description')?.trim()
    if (!nameToTranslate) {
      toast.error('Vui lòng điền tên bộ môn Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslating(true)
    try {
      // Dịch tên bộ môn
      const nameRes = await httpClient.post<Record<string, string>>('/translation', {
        text: nameToTranslate,
        target_languages: ['en']
      })
      if (nameRes.data?.en) {
        form.setValue('translations.en.name', nameRes.data.en)
      }

      // Dịch mô tả (nếu có)
      if (descToTranslate) {
        const descRes = await httpClient.post<Record<string, string>>('/translation', {
          text: descToTranslate,
          target_languages: ['en']
        })
        if (descRes.data?.en) {
          form.setValue('translations.en.description', descRes.data.en)
        }
      }
      
      setLastTranslatedVi(nameToTranslate)
      toast.success('Dịch tự động thành công!')
    } catch (err) {
      console.error('Lỗi dịch tự động:', err)
      toast.error('Có lỗi xảy ra khi dịch tự động.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleFormSubmit = (data: DepartmentFormValues) => {
    // Tiếng Anh hiện tại cũng bắt buộc theo yêu cầu người dùng
    const payload = {
      thumbnail_object_key: data.thumbnail_object_key,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      website: data.website?.trim() || null,
      office: data.office?.trim() || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
      translations: {
        vi: {
          name: data.translations.vi.name.trim(),
          description: data.translations.vi.description?.trim() || null
        },
        en: {
          name: data.translations.en.name.trim(),
          description: data.translations.en.description?.trim() || null
        }
      }
    }
    onSubmit(payload)
  }

  return (
    <Card className="border shadow-xs text-left max-h-[90vh] flex flex-col overflow-hidden">
      <CardHeader className="pb-4 shrink-0">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {isEditMode ? 'Cập nhật bộ môn' : 'Thêm bộ môn mới'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isEditMode
            ? 'Thay đổi thông tin chi tiết của bộ môn đang chọn.'
            : 'Tạo mới bộ môn giảng dạy, đào tạo khoa học trong trường.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4 overflow-y-auto flex-1 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            
            {/* Tải lên ảnh đại diện (Bắt buộc) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Ảnh đại diện Bộ môn <span className="text-destructive">*</span>
              </Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={thumbnailInputRef}
                onChange={handleThumbnailUpload}
              />
              {thumbnailPreviewUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted/30 group">
                  <img src={thumbnailPreviewUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs font-medium cursor-pointer"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      Thay đổi
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs font-medium cursor-pointer gap-1"
                      onClick={handleThumbnailRemove}
                    >
                      <Trash2 className="h-3 w-3" /> Gỡ bỏ
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingThumbnail && thumbnailInputRef.current?.click()}
                  className={cn(
                    "flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-all text-muted-foreground",
                    form.formState.errors.thumbnail_object_key
                      ? "border-destructive bg-destructive/5 hover:bg-destructive/10"
                      : "border-muted-foreground/30 bg-muted/5 hover:bg-muted/15"
                  )}
                >
                  {isUploadingThumbnail ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-[10px] font-medium text-muted-foreground">Đang tải lên...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mb-1.5 opacity-60" />
                      <span className="text-[10px] font-semibold text-foreground/80">Chọn ảnh đại diện bộ môn</span>
                      <span className="text-[9px] text-muted-foreground/80 mt-0.5">Hỗ trợ JPG, PNG (tối đa 5MB)</span>
                    </>
                  )}
                </div>
              )}
              {form.formState.errors.thumbnail_object_key && (
                <p className="text-[10px] font-medium text-destructive mt-1">
                  {form.formState.errors.thumbnail_object_key.message}
                </p>
              )}
            </div>

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
                      onClick={handleAutoTranslate}
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
                {/* Tên bộ môn */}
                <FormField
                  control={form.control}
                  name={`translations.${activeTab}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Tên bộ môn ({activeTab.toUpperCase()}) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={activeTab === 'vi' ? "Ví dụ: Bộ môn Khoa học máy tính..." : "Example: Department of Computer Science..."}
                          className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                          {...field}
                        />
                      </FormControl>
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
                      <FormLabel className="text-xs font-semibold">Mô tả bộ môn ({activeTab.toUpperCase()})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={activeTab === 'vi' ? "Nhập mô tả giới thiệu lịch sử, định hướng nghiên cứu..." : "Introduce history, research directions..."}
                          className="text-xs focus-visible:ring-primary/20 min-h-[90px] bg-background resize-none leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
