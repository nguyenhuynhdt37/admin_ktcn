import React, { useState, useRef, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { toast } from 'sonner'
import { Camera, Loader2, Trash2, Sparkles, BookOpen, Globe, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BannerPosition, type Banner } from '../types'
import { bannerService } from '../services/bannerService'
import { articleService } from '@/features/articles/services/articleService'

const bannerFormSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: 'Tiêu đề là bắt buộc' })
    .max(150, { message: 'Tiêu đề không vượt quá 150 ký tự' }),
  description: z.string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal('')),
  desktop_image_object_key: z.string()
    .min(1, { message: 'Ảnh Desktop là bắt buộc' }),
  mobile_image_object_key: z.string()
    .nullable()
    .optional()
    .or(z.literal('')),
  target_type: z.enum(['ARTICLE', 'EXTERNAL']).default('EXTERNAL'),
  article_id: z.string().nullable().optional().or(z.literal('')),
  link_url: z.string()
    .trim()
    .max(255, { message: 'Đường dẫn liên kết không vượt quá 255 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  open_in_new_tab: z.boolean().default(false),
  position: z.nativeEnum(BannerPosition),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  start_at: z.string()
    .nullable()
    .optional()
    .or(z.literal('')),
  end_at: z.string()
    .nullable()
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.target_type === 'ARTICLE') {
    if (!data.article_id || data.article_id.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bài viết liên kết không được để trống khi chọn loại ARTICLE',
        path: ['article_id'],
      })
    }
  } else if (data.target_type === 'EXTERNAL' && data.link_url) {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    if (!urlPattern.test(data.link_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Đường dẫn liên kết không đúng định dạng',
        path: ['link_url'],
      })
    }
  }
})

type BannerFormValues = z.infer<typeof bannerFormSchema>

const bannerFormResolver = zodResolver(bannerFormSchema)

// Map position key to localized Vietnamese label
const positionOptions = [
  { value: BannerPosition.HOME_HERO, label: 'Carousel trượt lớn đầu trang chủ' },
  { value: BannerPosition.HOME_POPUP, label: 'Popup thông báo trang chủ' },
  { value: BannerPosition.HOME_TOP, label: 'Banner ngang phía trên trang chủ' },
  { value: BannerPosition.NEWS_TOP, label: 'Banner đầu trang tin tức' },
  { value: BannerPosition.CATEGORY_TOP, label: 'Banner đầu trang danh mục' },
  { value: BannerPosition.PAGE_TOP, label: 'Banner đầu trang tĩnh/trang con' },
]

interface BannerFormProps {
  initialData: Banner | null
  onSubmit: (values: BannerFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function BannerForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: BannerFormProps) {
  const isEditMode = !!initialData
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const [desktopUploading, setDesktopUploading] = useState(false)
  const [localDesktopUrl, setLocalDesktopUrl] = useState<string | null>(null)

  const [mobileUploading, setMobileUploading] = useState(false)
  const [localMobileUrl, setLocalMobileUrl] = useState<string | null>(null)

  // Articles list state for select box
  const [articles, setArticles] = useState<{ id: string; title: string; categoryName: string }[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  // Fetch articles on mount or when debouncedQuery changes
  useEffect(() => {
    let isMounted = true

    const fetchArticles = async () => {
      setLoadingArticles(true)
      try {
        const res = await articleService.list({ 
          page: 1, 
          page_size: 30, // Giới hạn 30 bài viết
          status: 'PUBLISHED',
          search: debouncedQuery || undefined
        })
        
        const items = res.items.map(item => ({
          id: item.id,
          title: item.translations.vi?.title || item.translations.en?.title || 'Chưa dịch (Tiêu đề)',
          categoryName: item.category?.name || 'Không có danh mục'
        }))

        if (isMounted) {
          setArticles(items)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Không thể lấy danh sách bài viết:', err)
        }
      } finally {
        if (isMounted) {
          setLoadingArticles(false)
        }
      }
    }
    fetchArticles()

    return () => {
      isMounted = false
    }
  }, [debouncedQuery])

  // Fetch selected article details if not present in the current articles list (e.g. older articles on edit)
  useEffect(() => {
    const selectedId = initialData?.article_id
    if (!selectedId || articles.some(art => art.id === selectedId)) return

    const fetchSelectedArticle = async () => {
      try {
        const art = await articleService.getDetail(selectedId)
        const mappedArt = {
          id: art.id,
          title: art.translations.vi?.title || art.translations.en?.title || 'Chưa dịch (Tiêu đề)',
          categoryName: art.category?.name || 'Không có danh mục'
        }
        setArticles(prev => {
          if (prev.some(p => p.id === mappedArt.id)) return prev
          return [...prev, mappedArt]
        })
      } catch (err) {
        console.error('Không thể lấy chi tiết bài viết đã chọn:', err)
      }
    }
    fetchSelectedArticle()
  }, [initialData?.article_id, articles.length])

  // Helper to format ISO date string to datetime-local input format (YYYY-MM-DDThh:mm)
  const formatIsoToLocal = (isoStr?: string) => {
    if (!isoStr) return ''
    try {
      const date = new Date(isoStr)
      const tzOffset = date.getTimezoneOffset() * 60000 // offset in milliseconds
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16)
      return localISOTime
    } catch {
      return ''
    }
  }

  const form = useForm<BannerFormValues>({
    resolver: bannerFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: isEditMode && initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      desktop_image_object_key: initialData.desktop_image_object_key,
      mobile_image_object_key: initialData.mobile_image_object_key || '',
      target_type: initialData.target_type || 'EXTERNAL',
      article_id: initialData.article_id || '',
      link_url: initialData.link_url || '',
      open_in_new_tab: initialData.open_in_new_tab,
      position: initialData.position,
      sort_order: initialData.sort_order,
      start_at: formatIsoToLocal(initialData.start_at),
      end_at: formatIsoToLocal(initialData.end_at),
      is_active: initialData.is_active,
    } : {
      title: '',
      description: '',
      desktop_image_object_key: '',
      mobile_image_object_key: '',
      target_type: 'EXTERNAL',
      article_id: '',
      link_url: '',
      open_in_new_tab: false,
      position: BannerPosition.HOME_HERO,
      sort_order: 0,
      start_at: '',
      end_at: '',
      is_active: true,
    }
  })

  // Watch image values reactively using useWatch
  const desktopKey = useWatch({ control: form.control, name: 'desktop_image_object_key' })
  const mobileKey = useWatch({ control: form.control, name: 'mobile_image_object_key' })
  const targetType = useWatch({ control: form.control, name: 'target_type' })

  const desktopPreview = localDesktopUrl || desktopKey
  const mobilePreview = localMobileUrl || mobileKey

  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDesktopUploading(true)
    const localUrl = URL.createObjectURL(file)
    setLocalDesktopUrl(localUrl)

    try {
      const res = await bannerService.uploadBannerImage(file)
      form.setValue('desktop_image_object_key', res.object_key)
      toast.success('Tải ảnh desktop lên thành công!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh desktop lên.')
      setLocalDesktopUrl(null)
    } finally {
      setDesktopUploading(false)
    }
  }

  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMobileUploading(true)
    const localUrl = URL.createObjectURL(file)
    setLocalMobileUrl(localUrl)

    try {
      const res = await bannerService.uploadBannerImage(file)
      form.setValue('mobile_image_object_key', res.object_key)
      toast.success('Tải ảnh mobile lên thành công!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh mobile lên.')
      setLocalMobileUrl(null)
    } finally {
      setMobileUploading(false)
    }
  }

  const handleRemoveDesktop = () => {
    form.setValue('desktop_image_object_key', '')
    setLocalDesktopUrl(null)
    if (desktopInputRef.current) desktopInputRef.current.value = ''
  }

  const handleRemoveMobile = () => {
    form.setValue('mobile_image_object_key', '')
    setLocalMobileUrl(null)
    if (mobileInputRef.current) mobileInputRef.current.value = ''
  }

  const handleFormSubmit = (data: BannerFormValues) => {
    const formatToIsoOrNull = (val?: string | null) => {
      if (!val) return null
      try {
        return new Date(val).toISOString()
      } catch {
        return null
      }
    }

    const normalizedData = {
      ...data,
      description: data.description ? data.description.trim() : null,
      mobile_image_object_key: data.mobile_image_object_key ? data.mobile_image_object_key : null,
      start_at: formatToIsoOrNull(data.start_at),
      end_at: formatToIsoOrNull(data.end_at),
      target_type: data.target_type,
      link_url: data.target_type === 'EXTERNAL' ? (data.link_url ? data.link_url.trim() : null) : null,
      article_id: data.target_type === 'ARTICLE' ? (data.article_id ? data.article_id : null) : null,
    }
    onSubmit(normalizedData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full overflow-hidden text-left bg-card text-card-foreground">
        
        {/* Modal Header */}
        <div className="border-b px-6 py-4 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            {isEditMode ? 'Cập nhật Banner' : 'Thêm Banner mới'}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isEditMode
              ? 'Thay đổi thông tin hiển thị của Banner đang chọn.'
              : 'Tạo mới một banner quảng cáo, thông báo hiển thị trên website.'}
          </p>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Cột trái: Upload ảnh Desktop và Mobile */}
            <div className="lg:col-span-5 space-y-5">
              {/* Desktop Image Upload Box */}
              <div className="flex flex-col gap-2 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Ảnh Desktop <span className="text-destructive">*</span></label>
                  {desktopPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDesktop}
                      className="h-7 text-[10px] text-destructive hover:bg-destructive/10 px-2 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Xóa ảnh
                    </Button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={desktopInputRef}
                  onChange={handleDesktopUpload}
                  disabled={desktopUploading || isSubmitting}
                  className="hidden"
                />
                
                <div
                  onClick={() => !desktopUploading && !isSubmitting && desktopInputRef.current?.click()}
                  className={`relative h-44 w-full overflow-hidden rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                    desktopPreview 
                      ? 'border-solid border-border' 
                      : 'border-slate-300 hover:border-primary/50 bg-background hover:bg-slate-50/30'
                  } ${desktopUploading || isSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  {desktopPreview ? (
                    <img
                      src={desktopPreview}
                      alt="Desktop Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                      <div className="p-2.5 rounded-full bg-primary/5 text-primary">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tải ảnh lên</span>
                        <p className="text-[10px] text-muted-foreground">Kích thước: 1920x600 hoặc tỷ lệ 16:5</p>
                      </div>
                    </div>
                  )}

                  {desktopUploading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-primary gap-1.5 text-[11px] font-semibold backdrop-blur-xs">
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Đang tải lên...</span>
                    </div>
                  )}
                </div>
                {form.formState.errors.desktop_image_object_key && (
                  <span className="text-[10px] text-destructive mt-1 font-medium">
                    {form.formState.errors.desktop_image_object_key.message}
                  </span>
                )}
              </div>

              {/* Mobile Image Upload Box */}
              <div className="flex flex-col gap-2 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Ảnh Mobile (Tùy chọn)</label>
                  {mobilePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveMobile}
                      className="h-7 text-[10px] text-destructive hover:bg-destructive/10 px-2 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Xóa ảnh
                    </Button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={mobileInputRef}
                  onChange={handleMobileUpload}
                  disabled={mobileUploading || isSubmitting}
                  className="hidden"
                />

                <div
                  onClick={() => !mobileUploading && !isSubmitting && mobileInputRef.current?.click()}
                  className={`relative h-44 w-full overflow-hidden rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                    mobilePreview 
                      ? 'border-solid border-border' 
                      : 'border-slate-300 hover:border-primary/50 bg-background hover:bg-slate-50/30'
                  } ${mobileUploading || isSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  {mobilePreview ? (
                    <img
                      src={mobilePreview}
                      alt="Mobile Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                      <div className="p-2.5 rounded-full bg-primary/5 text-primary">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tải ảnh lên</span>
                        <p className="text-[10px] text-muted-foreground">Kích thước: 640x960 hoặc tỷ lệ 2:3</p>
                      </div>
                    </div>
                  )}

                  {mobileUploading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-primary gap-1.5 text-[11px] font-semibold backdrop-blur-xs">
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Đang tải lên...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Các thông tin chi tiết */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Tiêu đề Banner */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Tiêu đề Banner <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tiêu đề hoặc mục đích của banner..."
                        className="text-xs focus-visible:ring-primary/20 h-10 bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Mô tả Banner */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Mô tả chi tiết</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả nội dung chương trình, thông báo..."
                        className="text-xs focus-visible:ring-primary/20 min-h-[80px] bg-background resize-none"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vị trí hiển thị */}
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Vị trí hiển thị <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-xs h-10 bg-background focus:ring-primary/20">
                            <SelectValue placeholder="Chọn vị trí hiển thị" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Thứ tự hiển thị */}
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between">
                      <div>
                        <FormLabel className="text-xs font-semibold">Thứ tự hiển thị</FormLabel>
                        <FormControl className="mt-1">
                          <Input
                            type="number"
                            placeholder="Ví dụ: 0, 1, 2..."
                            className="text-xs focus-visible:ring-primary/20 h-10 bg-background font-mono"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormDescription className="text-[9px] text-slate-400 mt-1 leading-normal">
                        Mục này tự động sắp xếp lại thứ tự các banner khác cùng vị trí.
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Loại liên kết hiển thị */}
              <FormField
                control={form.control}
                name="target_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Loại liên kết</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-xs h-10 bg-background focus:ring-primary/20">
                          <SelectValue placeholder="Chọn loại liên kết" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EXTERNAL" className="text-xs">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-slate-500" />
                            <span>Liên kết ngoài / URL tự do</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ARTICLE" className="text-xs">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                            <span>Bài viết CMS có sẵn</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Điều kiện hiển thị Input dựa vào target_type */}
              {targetType === 'ARTICLE' ? (
                <FormField
                  control={form.control}
                  name="article_id"
                  render={({ field }) => {
                    const selectedArticle = articles.find(art => art.id === field.value)
                    
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-semibold">Bài viết liên kết <span className="text-destructive">*</span></FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className={cn(
                                  "w-full justify-between text-xs h-10 px-3 bg-background border font-normal cursor-pointer",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  selectedArticle ? (
                                    <span className="truncate text-left font-semibold text-slate-800">
                                      [{selectedArticle.categoryName}] {selectedArticle.title}
                                    </span>
                                  ) : (
                                    <span className="truncate text-left font-semibold text-slate-500">
                                      Bài viết liên kết hiện tại ({field.value})
                                    </span>
                                  )
                                ) : (
                                  "Chọn bài viết..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-[var(--radix-popover-trigger-width)] p-0 z-50" 
                            align="start"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <Command shouldFilter={false} className="w-full">
                              <CommandInput 
                                placeholder="Tìm kiếm bài viết..." 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="h-9 text-xs"
                              />
                              <CommandList className="max-h-[220px] overflow-y-auto overscroll-contain">
                                {loadingArticles && articles.length === 0 ? (
                                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                                    <span>Đang tải...</span>
                                  </div>
                                ) : articles.length === 0 ? (
                                  <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                                    {loadingArticles ? "Đang tải dữ liệu..." : "Không tìm thấy bài viết nào."}
                                  </CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {articles.map((art) => (
                                      <CommandItem
                                        key={art.id}
                                        value={art.id}
                                        onSelect={() => {
                                          form.setValue('article_id', art.id)
                                          form.trigger('article_id')
                                          setOpen(false)
                                        }}
                                        className="text-xs cursor-pointer flex items-center justify-between py-2 px-2.5"
                                      >
                                        <div className="flex flex-col gap-0.5 max-w-[90%] text-left">
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/40 rounded px-1.5 py-0.5 w-fit leading-normal">
                                            {art.categoryName}
                                          </span>
                                          <span className="font-semibold text-slate-800 line-clamp-1 leading-normal">
                                            {art.title}
                                          </span>
                                        </div>
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 text-emerald-600 shrink-0",
                                            field.value === art.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )
                  }}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="link_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Đường dẫn liên kết (Link URL)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ví dụ: https://example.com/tin-tuc"
                          className="text-xs focus-visible:ring-primary/20 h-10 bg-background font-mono"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription className="text-[9px] text-slate-400 leading-normal">
                        Bỏ trống nếu banner này không cần liên kết (chỉ hiển thị ảnh tĩnh).
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ngày bắt đầu hiển thị */}
                <FormField
                  control={form.control}
                  name="start_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Ngày bắt đầu hiển thị</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="text-xs focus-visible:ring-primary/20 h-10 bg-background font-mono"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Ngày kết thúc hiển thị */}
                <FormField
                  control={form.control}
                  name="end_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Ngày kết thúc hiển thị</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="text-xs focus-visible:ring-primary/20 h-10 bg-background font-mono"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Boolean Options */}
              <div className="flex gap-6 items-center border-t pt-4 mt-2">
                <FormField
                  control={form.control}
                  name="open_in_new_tab"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="scale-75 cursor-pointer"
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">Mở tab mới khi click</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="scale-75 cursor-pointer"
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">Kích hoạt hiển thị</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t px-6 py-3.5 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/20 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || desktopUploading || mobileUploading}
            className="h-10 text-xs font-semibold cursor-pointer px-4"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || desktopUploading || mobileUploading}
            className="h-10 text-xs font-semibold shadow-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 px-5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Lưu Banner</span>
              </>
            )}
          </Button>
        </div>

      </form>
    </Form>
  )
}
