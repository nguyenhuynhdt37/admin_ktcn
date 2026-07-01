import { useEffect, useState } from 'react'
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
import { Sparkles, Globe, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { httpClient } from '@/services/http/client'
import { toast } from 'sonner'
import type { Position } from '../types'

const translationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên chức vụ là bắt buộc' })
    .max(150, { message: 'Tên chức vụ không vượt quá 150 ký tự' }),
  description: z.string()
    .trim()
    .max(1000, { message: 'Mô tả không vượt quá 1000 ký tự' })
    .optional()
    .or(z.literal('')),
})

const positionFormSchema = z.object({
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

type PositionFormValues = z.infer<typeof positionFormSchema>

const positionFormResolver = zodResolver(positionFormSchema)

interface PositionFormProps {
  initialData: Position | null
  onSubmit: (values: any) => void
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
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [lastTranslatedVi, setLastTranslatedVi] = useState('')

  const form = useForm<PositionFormValues>({
    resolver: positionFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: {
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
    } else {
      form.reset({
        sort_order: 0,
        is_active: true,
        translations: {
          vi: { name: '', description: '' },
          en: { name: '', description: '' }
        }
      })
      setLastTranslatedVi('')
    }
    setActiveTab('vi')
  }, [initialData, form])

  // Debounced auto-translate tiếng Việt sang tiếng Anh cho phần Tên chức vụ
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
        console.error('Lỗi dịch tự động Chức vụ:', err)
      } finally {
        setIsTranslating(false)
      }
    }

    autoTranslate()
  }, [debouncedViName, lastTranslatedVi, form])

  // Hàm click dịch tự động thủ công (dịch cả tên và mô tả)
  const handleAutoTranslate = async () => {
    const nameToTranslate = form.getValues('translations.vi.name')?.trim()
    const descToTranslate = form.getValues('translations.vi.description')?.trim()
    if (!nameToTranslate) {
      toast.error('Vui lòng điền tên chức vụ Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslating(true)
    try {
      // Dịch tên chức vụ
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

  const handleFormSubmit = (data: PositionFormValues) => {
    const payload = {
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
          {isEditMode ? 'Cập nhật chức vụ' : 'Thêm chức vụ mới'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isEditMode
            ? 'Thay đổi thông tin chi tiết của chức vụ đang chọn.'
            : 'Tạo mới chức vụ công tác của giảng viên/cán bộ trong trường.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4 overflow-y-auto flex-1 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            
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
                {/* Tên chức vụ */}
                <FormField
                  control={form.control}
                  name={`translations.${activeTab}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Tên chức vụ ({activeTab.toUpperCase()}) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={activeTab === 'vi' ? "Ví dụ: Trưởng bộ môn, Giảng viên..." : "Example: Head of Department, Lecturer..."}
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
                      <FormLabel className="text-xs font-semibold">Mô tả chức vụ ({activeTab.toUpperCase()})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={activeTab === 'vi' ? "Nhập mô tả nhiệm vụ, quyền hạn..." : "Enter responsibilities description..."}
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
                      Cho phép hiển thị và chọn chức vụ này khi gán giảng viên.
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
