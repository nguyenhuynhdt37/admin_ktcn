import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  ImageIcon,
  Trash2,
  Camera,
  Plus,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn } from '@/lib/utils'
import { httpClient } from '@/services/http/client'
import { getMediaUrl } from '@/features/articles/utils/media'
import { departmentService } from '@/features/departments/services/departmentService'
import { galleryService } from '../services/galleryService'
import type { Gallery, CreateGalleryPayload } from '../types'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const galleryTranslationSchema = z.object({
  title: z.string().trim().min(1, { message: 'Tiêu đề Album là bắt buộc' }).max(200, { message: 'Tiêu đề không vượt quá 200 ký tự' }),
  description: z.string().trim().max(1000, { message: 'Mô tả không vượt quá 1000 ký tự' }).optional().or(z.literal('')),
})

const galleryItemFormSchema = z.object({
  media_item_id: z.string(),
  media_url: z.string().optional(),
  caption: z.string().trim().max(255, { message: 'Chú thích không vượt quá 255 ký tự' }).optional().or(z.literal('')),
  alt_text: z.string().trim().max(255, { message: 'Mô tả thay thế không vượt quá 255 ký tự' }).optional().or(z.literal('')),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
})

const galleryFormSchema = z.object({
  department_id: z.string().min(1, { message: 'Đơn vị sở hữu là bắt buộc' }),
  cover_object_key: z.string().min(1, { message: 'Ảnh bìa Album là bắt buộc' }),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
  translations: z.object({
    vi: galleryTranslationSchema,
    en: galleryTranslationSchema,
  }),
  items: z.array(galleryItemFormSchema).min(1, { message: 'Album phải có ít nhất 1 hình ảnh' }),
})

type GalleryFormValues = z.infer<typeof galleryFormSchema>

const galleryFormResolver = zodResolver(galleryFormSchema)

// ─── Mapper Helpers ──────────────────────────────────────────────────────────

function mapBackendToForm(detail: Gallery): GalleryFormValues {
  return {
    department_id: detail.department_id || '',
    cover_object_key: detail.cover_object_key || '',
    sort_order: detail.sort_order ?? 0,
    is_active: detail.is_active ?? true,
    translations: {
      vi: {
        title: detail.translations?.vi?.title || '',
        description: detail.translations?.vi?.description || '',
      },
      en: {
        title: detail.translations?.en?.title || '',
        description: detail.translations?.en?.description || '',
      },
    },
    items: (detail.items || []).map((item) => ({
      media_item_id: item.media_item_id,
      media_url: item.media_url || (item.media_item_id ? getMediaUrl(item.media_item_id) : ''),
      caption: item.caption || '',
      alt_text: item.alt_text || '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    })),
  }
}

function getCreateDefaultValues(): GalleryFormValues {
  return {
    department_id: '',
    cover_object_key: '',
    sort_order: 0,
    is_active: true,
    translations: {
      vi: { title: '', description: '' },
      en: { title: '', description: '' },
    },
    items: [],
  }
}

function mapFormToPayload(values: GalleryFormValues): CreateGalleryPayload {
  return {
    department_id: values.department_id,
    cover_object_key: values.cover_object_key,
    sort_order: values.sort_order,
    is_active: values.is_active,
    translations: {
      vi: {
        title: values.translations.vi.title.trim(),
        description: values.translations.vi.description?.trim() || '',
      },
      en: {
        title: values.translations.en.title.trim(),
        description: values.translations.en.description?.trim() || '',
      },
    },
    items: values.items.map((item) => ({
      media_item_id: item.media_item_id,
      caption: item.caption?.trim() || '',
      alt_text: item.alt_text?.trim() || '',
      sort_order: item.sort_order,
      is_active: item.is_active,
    })),
  }
}

// ─── Container Component ──────────────────────────────────────────────────────

interface GalleryFormProps {
  galleryId: string | null
}

export function GalleryForm({ galleryId }: GalleryFormProps) {
  const isEditMode = !!galleryId

  // Fetch chi tiết Album
  const { data: galleryDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['galleries', galleryId],
    queryFn: () => galleryService.getDetail(galleryId!),
    enabled: isEditMode,
  })

  // Fetch danh sách đơn vị sở hữu
  const { data: departmentData, isLoading: isLoadingDeps } = useQuery({
    queryKey: ['departments-for-gallery-select'],
    queryFn: () => departmentService.list({ page_size: 200 }),
  })

  const isLoadingData = (isEditMode && isLoadingDetail) || isLoadingDeps

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu Album ảnh...</p>
      </div>
    )
  }

  const initialValues = isEditMode && galleryDetail
    ? mapBackendToForm(galleryDetail)
    : getCreateDefaultValues()

  return (
    <GalleryFormInner
      initialValues={initialValues}
      galleryId={galleryId}
      departments={departmentData?.items || []}
    />
  )
}

// ─── Inner Form Component ─────────────────────────────────────────────────────

interface GalleryFormInnerProps {
  initialValues: GalleryFormValues
  galleryId: string | null
  departments: any[]
}

function GalleryFormInner({
  initialValues,
  galleryId,
  departments,
}: GalleryFormInnerProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isEditMode = !!galleryId

  // Upload refs
  const coverInputRef = useRef<HTMLInputElement>(null)
  const multiInputRef = useRef<HTMLInputElement>(null)

  // Upload states
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingMulti, setIsUploadingMulti] = useState(false)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
    initialValues.cover_object_key ? getMediaUrl(initialValues.cover_object_key) : null
  )

  // Translation Tab State
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')

  const form = useForm<GalleryFormValues>({
    resolver: galleryFormResolver,
    defaultValues: initialValues,
  })

  const { fields: items, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // ─── Mutation ─────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (values: GalleryFormValues) => {
      const payload = mapFormToPayload(values)
      if (isEditMode) {
        return galleryService.update(galleryId!, payload)
      } else {
        return galleryService.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Cập nhật Album thành công!' : 'Tạo Album mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['galleries'] })
      navigate('/galleries')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Lưu Album thất bại. Vui lòng thử lại.')
    },
  })

  const onSubmit = (values: GalleryFormValues) => {
    saveMutation.mutate(values)
  }

  // Toast detailed validation errors
  const onInvalid = (errors: any) => {
    const errorMessages: string[] = []
    const extractErrors = (obj: any, prefix = '') => {
      if (!obj || typeof obj !== 'object') return
      Object.keys(obj).forEach((key) => {
        const val = obj[key]
        if (val && val.message) {
          const fieldLabel = key === 'title' ? 'Tiêu đề Album'
            : key === 'department_id' ? 'Đơn vị sở hữu'
            : key === 'cover_object_key' ? 'Ảnh bìa'
            : key === 'items' ? 'Hình ảnh album'
            : key
          errorMessages.push(prefix ? `${prefix} - ${fieldLabel}` : fieldLabel)
        } else {
          const sectionPrefix = key === 'vi' ? 'Bản dịch Tiếng Việt'
            : key === 'en' ? 'Bản dịch Tiếng Anh'
            : key
          extractErrors(val, prefix ? `${prefix} - ${sectionPrefix}` : sectionPrefix)
        }
      })
    }

    extractErrors(errors)
    if (errorMessages.length > 0) {
      toast.error(`Vui lòng kiểm tra lại thông tin: ${errorMessages.slice(0, 3).join('; ')}${errorMessages.length > 3 ? '...' : ''}`)
    }
  }

  // ─── Single Cover Upload ──────────────────────────────────────────────

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCover(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await httpClient.post<{ object_key: string }>('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      form.setValue('cover_object_key', data.object_key, { shouldValidate: true })
      setCoverPreviewUrl(getMediaUrl(data.object_key))
      toast.success('Tải ảnh bìa thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Tải ảnh bìa thất bại')
    } finally {
      setIsUploadingCover(false)
      e.target.value = ''
    }
  }

  const handleCoverRemove = () => {
    form.setValue('cover_object_key', '', { shouldValidate: true })
    setCoverPreviewUrl(null)
    toast.success('Đã gỡ ảnh bìa.')
  }

  // ─── Multi Images Upload ──────────────────────────────────────────────

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMulti(true)
    const fileList = Array.from(files)
    const currentLength = items.length

    try {
      const uploadPromises = fileList.map(async (file, index) => {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await httpClient.post<{ id: string; object_key: string }>('/admin/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return {
          media_item_id: data.id,
          media_url: getMediaUrl(data.object_key),
          caption: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
          alt_text: file.name,
          sort_order: currentLength + index,
          is_active: true,
        }
      })

      const uploadedResults = await Promise.all(uploadPromises)
      uploadedResults.forEach((item) => append(item))
      toast.success(`Đã tải lên thành công ${uploadedResults.length} hình ảnh!`)
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi tải lên một số hình ảnh. Vui lòng thử lại.')
      console.error(err)
    } finally {
      setIsUploadingMulti(false)
      e.target.value = ''
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 text-left">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {isEditMode ? 'Chỉnh sửa Album ảnh' : 'Tạo Album ảnh mới'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? 'Cập nhật thông tin chi tiết và danh sách hình ảnh của Album.' : 'Nhập thông tin cơ bản và tải hình ảnh lên để tạo Album mới.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/galleries')}
              className="gap-1.5 h-9 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="gap-1.5 h-9 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu Album
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form Body Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form (8/12 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ── Thông tin chung ── */}
            <Card className="border shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary" />
                    Thông tin Album
                  </CardTitle>
                  <CardDescription className="text-[11px]">Tiêu đề, mô tả album cho các bản dịch ngôn ngữ.</CardDescription>
                </div>

                {/* Switch Multi-language tabs */}
                <div className="flex items-center p-0.5 rounded-lg bg-muted border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('vi')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      activeTab === 'vi' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      activeTab === 'en' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    English
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tiếng Việt Tab Content */}
                <div className={cn("space-y-4", activeTab !== 'vi' && "hidden")}>
                  <FormField
                    control={form.control}
                    name="translations.vi.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tiêu đề Album (VI) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: Hoạt động học thuật nổi bật..."
                            className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="translations.vi.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Mô tả Album (VI)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả tóm tắt nội dung hình ảnh của Album..."
                            className="text-xs focus-visible:ring-primary/20 min-h-[90px] bg-background resize-none leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tiếng Anh Tab Content */}
                <div className={cn("space-y-4", activeTab !== 'en' && "hidden")}>
                  <FormField
                    control={form.control}
                    name="translations.en.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tiêu đề Album (EN) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Example: Outstanding Academic Activities..."
                            className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="translations.en.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Mô tả Album (EN)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Short description of the gallery photos..."
                            className="text-xs focus-visible:ring-primary/20 min-h-[90px] bg-background resize-none leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Tải lên danh sách ảnh ── */}
            <Card className="border shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Danh sách hình ảnh ({items.length})</CardTitle>
                  <CardDescription className="text-[11px]">Tải lên danh sách hình ảnh cho album, kéo thả hoặc dùng nút sắp xếp và ghi chú thích.</CardDescription>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={multiInputRef}
                    onChange={handleMultiUpload}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingMulti}
                    onClick={() => multiInputRef.current?.click()}
                    className="gap-1 text-xs cursor-pointer h-8 font-semibold border-dashed"
                  >
                    {isUploadingMulti ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Tải ảnh lên
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border border-dashed rounded-lg py-12 px-4 text-center text-muted-foreground/80 bg-muted/5">
                    <ImageIcon className="h-10 w-10 mb-3 opacity-40 text-slate-500" />
                    <span className="text-xs font-semibold text-foreground/80">Chưa có hình ảnh nào trong Album</span>
                    <span className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      Hãy click nút "Tải ảnh lên" ở trên để chọn nhiều ảnh từ thiết bị của bạn.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative border rounded-xl overflow-hidden bg-card shadow-2xs hover:shadow-xs transition-all flex flex-col"
                      >
                        {/* Image Preview Area */}
                        <div className="aspect-video w-full bg-muted overflow-hidden relative border-b">
                          <img
                            src={field.media_url}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {/* Sort Actions */}
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              disabled={index === 0}
                              onClick={() => move(index, index - 1)}
                              className="h-7 w-7 rounded-md cursor-pointer shadow-xs border"
                              title="Di chuyển lên"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              disabled={index === items.length - 1}
                              onClick={() => move(index, index + 1)}
                              className="h-7 w-7 rounded-md cursor-pointer shadow-xs border"
                              title="Di chuyển xuống"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            {/* Remove Action */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => remove(index)}
                              className="h-7 w-7 rounded-md cursor-pointer shadow-xs border"
                              title="Xóa khỏi album"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono select-none">
                            Vị trí: #{index + 1}
                          </div>
                        </div>

                        {/* Form Inputs Area */}
                        <div className="p-3.5 space-y-2.5 flex-1">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chú thích ảnh (Caption)</Label>
                            <Input
                              placeholder="Nhập chú thích hiển thị bên dưới ảnh..."
                              className="text-xs h-8 bg-background focus-visible:ring-primary/20"
                              {...form.register(`items.${index}.caption` as const)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Alt Text (SEO)</Label>
                            <Input
                              placeholder="Nhập mô tả hình ảnh cho bộ đọc màn hình..."
                              className="text-xs h-8 bg-background focus-visible:ring-primary/20"
                              {...form.register(`items.${index}.alt_text` as const)}
                            />
                          </div>

                          <div className="flex items-center justify-between border-t pt-2 mt-1">
                            <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kích hoạt hiển thị</Label>
                            <FormField
                              control={form.control}
                              name={`items.${index}.is_active` as const}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="scale-75 cursor-pointer"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.items && (
                  <p className="text-[10px] font-semibold text-destructive mt-2 bg-destructive/5 border border-destructive/10 rounded-md p-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-destructive" />
                    <span>{form.formState.errors.items.message}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings (4/12 columns) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* ── Metadata & Đơn vị sở hữu ── */}
            <Card className="border shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Cấu hình chung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Đơn vị sở hữu <span className="text-destructive">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                            <SelectValue placeholder="Chọn Khoa/Bộ môn sở hữu..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id} className="text-xs">
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Thứ tự sắp xếp Album</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="text-xs focus-visible:ring-primary/20 h-9 bg-background font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-lg p-3 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold">Bật hoạt động</FormLabel>
                        <div className="text-[10px] text-muted-foreground">Hiển thị album ra ngoài portal</div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ── Ảnh bìa (Cover Image) ── */}
            <Card className="border shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Ảnh bìa Album <span className="text-destructive">*</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                />

                {coverPreviewUrl ? (
                  <div className="relative w-full overflow-hidden rounded-lg border bg-muted/30 group aspect-video">
                    <img src={coverPreviewUrl} alt="Cover" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-medium cursor-pointer"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        Thay đổi
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs font-medium cursor-pointer gap-1"
                        onClick={handleCoverRemove}
                      >
                        <Trash2 className="h-3 w-3" /> Gỡ bỏ
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                    className={cn(
                      "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-all text-muted-foreground aspect-video",
                      form.formState.errors.cover_object_key
                        ? "border-destructive bg-destructive/5 hover:bg-destructive/10"
                        : "border-muted-foreground/30 bg-muted/5 hover:bg-muted/15"
                    )}
                  >
                    {isUploadingCover ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-[10px] font-medium text-muted-foreground">Đang tải lên...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-7 w-7 mb-1.5 opacity-60" />
                        <span className="text-[10px] font-semibold text-foreground/80">Chọn ảnh bìa</span>
                        <span className="text-[9px] text-muted-foreground/80 mt-0.5">Tỷ lệ 16:9, tối đa 5MB</span>
                      </>
                    )}
                  </div>
                )}
                {form.formState.errors.cover_object_key && (
                  <p className="text-[10px] font-semibold text-destructive mt-1">
                    {form.formState.errors.cover_object_key.message}
                  </p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </form>
    </Form>
  )
}
