import { useState, useRef, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/shared/components/ui/card'
import {
  Building2,
  Globe,
  Languages,
  Camera,
  Trash2,
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  Search,
  FileText,
  Settings,
  Eye,
  Target,
  BookOpen,
  FlaskConical,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { httpClient } from '@/services/http/client'
import { toast } from 'sonner'
import { getMediaUrl } from '@/features/articles/utils/media'
import { CmsEditor } from '@/shared/components/CmsEditor'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DepartmentSeoAnalysisPanel } from './DepartmentSeoAnalysisPanel'
import { departmentService } from '../services/departmentService'
import type { Department, DepartmentUnitType, DepartmentContentStatus } from '../types'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const translationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên là bắt buộc' })
    .max(150, { message: 'Tên không vượt quá 150 ký tự' }),
  slug: z.string().trim().max(200, { message: 'Slug không vượt quá 200 ký tự' }).optional().or(z.literal('')),
  description: z.string().trim().max(1000, { message: 'Mô tả không vượt quá 1000 ký tự' }).optional().or(z.literal('')),
  mission: z.string().optional().or(z.literal('')),
  vision: z.string().optional().or(z.literal('')),
  history: z.string().optional().or(z.literal('')),
  research_overview: z.string().optional().or(z.literal('')),
  seo_title: z.string().trim().optional().or(z.literal('')),
  seo_description: z.string().trim().optional().or(z.literal('')),
})

const departmentFormSchema = z.object({
  code: z.string().trim().max(50, { message: 'Mã đơn vị không vượt quá 50 ký tự' }).optional().or(z.literal('')),
  unit_type: z.enum(['school', 'faculty', 'department', 'office', 'center', 'lab']).default('department'),
  parent_id: z.string().optional().or(z.literal('')),
  thumbnail_object_key: z.string().optional().or(z.literal('')),
  logo_object_key: z.string().optional().or(z.literal('')),
  banner_object_key: z.string().optional().or(z.literal('')),
  phone: z.string().trim().max(50, { message: 'Số điện thoại không vượt quá 50 ký tự' }).optional().or(z.literal('')),
  email: z.string()
    .trim()
    .max(100, { message: 'Email liên hệ không vượt quá 100 ký tự' })
    .email({ message: 'Địa chỉ email liên hệ không hợp lệ' })
    .optional()
    .or(z.literal('')),
  website: z.string()
    .trim()
    .max(255, { message: 'Đường dẫn website không vượt quá 255 ký tự' })
    .refine(
      (val) => !val || /^(https?:\/\/)?([a-z0-9.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(val),
      { message: 'Đường dẫn website không đúng định dạng (Ví dụ: test.univ.edu.vn)' }
    )
    .optional()
    .or(z.literal('')),
  office: z.string().trim().max(150, { message: 'Địa chỉ văn phòng không vượt quá 150 ký tự' }).optional().or(z.literal('')),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  display_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
  head_staff_id: z.string().optional().or(z.literal('')),
  translations: z.object({
    vi: translationSchema,
    en: translationSchema,
  })
}).superRefine((val, ctx) => {
  const unitType = val.unit_type
  const needsParent = unitType !== 'school' && unitType !== 'faculty'
  if (needsParent && (!val.parent_id || val.parent_id === 'none' || val.parent_id.trim() === '')) {
    ctx.addIssue({
      path: ['parent_id'],
      code: z.ZodIssueCode.custom,
      message: 'Khoa trực thuộc là bắt buộc',
    })
  }
})

type DepartmentFormValues = z.infer<typeof departmentFormSchema>

const departmentFormResolver = zodResolver(departmentFormSchema)

// ─── Helper: Map Backend → Form Values ────────────────────────────────────────

function mapBackendToForm(detail: Department): DepartmentFormValues {
  return {
    code: detail.code || '',
    unit_type: detail.unit_type || 'department',
    parent_id: detail.parent_id || '',
    thumbnail_object_key: detail.thumbnail_object_key || '',
    logo_object_key: detail.logo_object_key || '',
    banner_object_key: detail.banner_object_key || '',
    phone: detail.phone || '',
    email: detail.email || '',
    website: detail.website || '',
    office: detail.office || '',
    sort_order: detail.sort_order,
    display_order: detail.display_order ?? 0,
    is_active: detail.is_active,
    head_staff_id: detail.head_staff_id || '',
    translations: {
      vi: {
        name: detail.translations?.vi?.name || detail.name || '',
        slug: detail.translations?.vi?.slug || detail.slug || '',
        description: detail.translations?.vi?.description || detail.description || '',
        mission: detail.translations?.vi?.mission || '',
        vision: detail.translations?.vi?.vision || '',
        history: detail.translations?.vi?.history || '',
        research_overview: detail.translations?.vi?.research_overview || '',
        seo_title: detail.translations?.vi?.seo_title || '',
        seo_description: detail.translations?.vi?.seo_description || '',
      },
      en: {
        name: detail.translations?.en?.name || '',
        slug: detail.translations?.en?.slug || '',
        description: detail.translations?.en?.description || '',
        mission: detail.translations?.en?.mission || '',
        vision: detail.translations?.en?.vision || '',
        history: detail.translations?.en?.history || '',
        research_overview: detail.translations?.en?.research_overview || '',
        seo_title: detail.translations?.en?.seo_title || '',
        seo_description: detail.translations?.en?.seo_description || '',
      }
    }
  }
}

function getCreateDefaultValues(): DepartmentFormValues {
  return {
    code: '',
    unit_type: 'department',
    parent_id: '',
    thumbnail_object_key: '',
    logo_object_key: '',
    banner_object_key: '',
    phone: '',
    email: '',
    website: '',
    office: '',
    sort_order: 0,
    display_order: 0,
    is_active: true,
    head_staff_id: '',
    translations: {
      vi: { name: '', slug: '', description: '', mission: '', vision: '', history: '', research_overview: '', seo_title: '', seo_description: '' },
      en: { name: '', slug: '', description: '', mission: '', vision: '', history: '', research_overview: '', seo_title: '', seo_description: '' },
    }
  }
}

// ─── Helper: Map Form Values → Payload ────────────────────────────────────────

function mapFormToPayload(values: DepartmentFormValues) {
  const buildTranslation = (lang: 'vi' | 'en') => ({
    name: values.translations[lang].name.trim(),
    slug: values.translations[lang].slug?.trim() || '',
    description: values.translations[lang].description?.trim() || '',
    mission: values.translations[lang].mission?.trim() || '',
    vision: values.translations[lang].vision?.trim() || '',
    history: values.translations[lang].history?.trim() || '',
    research_overview: values.translations[lang].research_overview?.trim() || '',
    seo_title: values.translations[lang].seo_title?.trim() || '',
    seo_description: values.translations[lang].seo_description?.trim() || '',
  })

  return {
    code: values.code?.trim() || null,
    unit_type: values.unit_type,
    parent_id: (values.parent_id === 'none' || !values.parent_id) ? null : values.parent_id.trim(),
    thumbnail_object_key: values.thumbnail_object_key || '',
    logo_object_key: values.logo_object_key?.trim() || '',
    banner_object_key: values.banner_object_key?.trim() || '',
    phone: values.phone?.trim() || '',
    email: values.email?.trim() || null,
    website: values.website?.trim() || null,
    office: values.office?.trim() || '',
    sort_order: values.sort_order,
    display_order: values.display_order,
    is_active: values.is_active,
    head_staff_id: (values.head_staff_id === 'none' || !values.head_staff_id) ? null : values.head_staff_id.trim(),
    translations: {
      vi: buildTranslation('vi'),
      en: buildTranslation('en'),
    }
  }
}

// ─── Container Component ──────────────────────────────────────────────────────

interface DepartmentFormProps {
  departmentId: string | null
}

export function DepartmentForm({ departmentId }: DepartmentFormProps) {
  const isEditMode = !!departmentId

  // Fetch chi tiết bộ môn (edit mode)
  const { data: departmentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['departments', departmentId],
    queryFn: () => departmentService.getDetail(departmentId!),
    enabled: isEditMode,
  })

  // Fetch danh sách giảng viên cho dropdown head_staff_id
  const { data: staffList = [], isLoading: isLoadingStaffs } = useQuery({
    queryKey: ['staffs-for-department-head'],
    queryFn: async () => {
      const res = await httpClient.get('/admin/staffs', { params: { page_size: 200, is_active: true } })
      return res.data?.items || res.data || []
    },
  })

  const isLoadingData = (isEditMode && isLoadingDetail) || isLoadingStaffs

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu bộ môn...</p>
      </div>
    )
  }

  const initialValues = isEditMode && departmentDetail
    ? mapBackendToForm(departmentDetail)
    : getCreateDefaultValues()

  return (
    <DepartmentFormInner
      initialValues={initialValues}
      departmentId={departmentId}
      staffList={staffList}
    />
  )
}

// ─── Inner Form Component ─────────────────────────────────────────────────────

interface DepartmentFormInnerProps {
  initialValues: DepartmentFormValues
  departmentId: string | null
  staffList: any[]
}

function DepartmentFormInner({
  initialValues,
  departmentId,
  staffList,
}: DepartmentFormInnerProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isEditMode = !!departmentId

  // Upload refs
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Upload states
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    initialValues.thumbnail_object_key ? getMediaUrl(initialValues.thumbnail_object_key) : null
  )
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    initialValues.logo_object_key ? getMediaUrl(initialValues.logo_object_key) : null
  )
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(
    initialValues.banner_object_key ? getMediaUrl(initialValues.banner_object_key) : null
  )

  // Translation states
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['vi']))

  const handleTabChange = useCallback((tab: 'vi' | 'en') => {
    setActiveTab(tab)
    setMountedTabs(prev => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }, [])
  const [isTranslatingName, setIsTranslatingName] = useState(false)
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form: any = useForm<DepartmentFormValues>({
    resolver: departmentFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: initialValues,
  })

  const unitType = form.watch('unit_type')

  const parentUnitType = useMemo(() => {
    if (unitType !== 'school' && unitType !== 'faculty') return 'faculty'
    return null
  }, [unitType])

  const { data: parentUnitsData } = useQuery({
    queryKey: ['parent-departments', parentUnitType],
    queryFn: () => departmentService.list({ unit_type: parentUnitType, page_size: 1000 }),
    enabled: !!parentUnitType,
  })

  const parentOptions = useMemo(() => {
    if (!parentUnitsData?.items) return []
    return parentUnitsData.items.filter((item: any) => item.id !== departmentId)
  }, [parentUnitsData, departmentId])

  // ─── Mutation ─────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      const payload = mapFormToPayload(values)
      if (isEditMode) {
        return departmentService.update(departmentId!, payload)
      } else {
        return departmentService.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Cập nhật bộ môn thành công!' : 'Thêm bộ môn mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments-stats'] })
      navigate('/departments')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const errorCode = errorData?.error_code || errorData?.code
      const msg = errorData?.message

      if (errorCode === 'DUPLICATE_DEPARTMENT_NAME') {
        toast.error('Tên bộ môn đã tồn tại trong hệ thống. Vui lòng chọn tên khác.')
      } else if (errorCode === 'BAD_REQUEST' && msg?.includes('giảng viên')) {
        toast.error(msg)
      } else {
        toast.error(msg || 'Không thể lưu bộ môn. Vui lòng thử lại.')
      }
    },
  })

  // ─── Upload Handlers ──────────────────────────────────────────────────

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'thumbnail_object_key' | 'logo_object_key' | 'banner_object_key',
    setUploading: (v: boolean) => void,
    setPreview: (v: string | null) => void,
    label: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await httpClient.post<{ object_key: string }>('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      form.setValue(fieldName, data.object_key, { shouldValidate: true })
      setPreview(getMediaUrl(data.object_key))
      toast.success(`Tải ${label} thành công!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || `Tải ${label} thất bại`)
    } finally {
      setUploading(false)
    }
  }

  const handleMediaRemove = (
    fieldName: 'thumbnail_object_key' | 'logo_object_key' | 'banner_object_key',
    setPreview: (v: string | null) => void,
    label: string,
  ) => {
    form.setValue(fieldName, '', { shouldValidate: true })
    setPreview(null)
    toast.success(`Đã gỡ bỏ ${label}.`)
  }

  // ─── Translation Handlers ─────────────────────────────────────────────

  const handleAutoTranslate = async () => {
    const nameVi = form.getValues('translations.vi.name')?.trim()
    const descVi = form.getValues('translations.vi.description')?.trim()
    if (!nameVi) {
      toast.error('Vui lòng điền tên bộ môn Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslatingName(true)
    setIsTranslatingDesc(true)
    try {
      // Dịch tên
      const nameRes = await httpClient.post<Record<string, string>>('/translation', {
        text: nameVi,
        target_languages: ['en'],
        context: 'department_name'
      })
      if (nameRes.data?.en) {
        form.setValue('translations.en.name', nameRes.data.en)
      }

      // Dịch mô tả
      if (descVi) {
        const descRes = await httpClient.post<Record<string, string>>('/translation', {
          text: descVi,
          target_languages: ['en'],
          context: 'department_description'
        })
        if (descRes.data?.en) {
          form.setValue('translations.en.description', descRes.data.en)
        }
      }

      toast.success('Dịch tự động thành công!')
    } catch (err) {
      console.error('Lỗi dịch tự động:', err)
      toast.error('Có lỗi xảy ra khi dịch tự động.')
    } finally {
      setIsTranslatingName(false)
      setIsTranslatingDesc(false)
    }
  }

  const handleTranslateClick = () => {
    const enName = form.getValues('translations.en.name')?.trim()
    const enDesc = form.getValues('translations.en.description')?.trim()
    if (enName || enDesc) {
      setShowConfirm(true)
    } else {
      handleAutoTranslate()
    }
  }

  const handleTranslateHtml = async (
    fieldVi: string,
    fieldEn: string,
    context: string,
    label: string,
  ) => {
    const htmlVi = form.getValues(fieldVi)?.trim()
    if (!htmlVi) {
      toast.error(`Vui lòng điền ${label} Tiếng Việt trước khi dịch.`)
      return
    }

    try {
      const res = await httpClient.post<Record<string, string>>('/translation/html', {
        html: htmlVi,
        target_languages: ['en'],
        context,
      }, { timeout: 60000 })
      if (res.data?.en) {
        form.setValue(fieldEn, res.data.en)
        toast.success(`Dịch ${label} thành công!`)
      }
    } catch (err) {
      console.error(err)
      toast.error(`Có lỗi xảy ra khi dịch ${label}.`)
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────

  const onSubmit = (data: DepartmentFormValues) => {
    saveMutation.mutate(data)
  }

  const onInvalid = (errors: any) => {
    console.error('Form validation errors:', errors)
    const errorMessages: string[] = []

    const extractErrors = (obj: any, prefix = '') => {
      if (!obj) return
      if (obj.message) {
        errorMessages.push(prefix ? `${prefix}: ${obj.message}` : obj.message)
        return
      }
      Object.entries(obj).forEach(([key, val]: [string, any]) => {
        if (key === 'vi') {
          extractErrors(val, 'Bản dịch Tiếng Việt')
        } else if (key === 'en') {
          extractErrors(val, 'Bản dịch Tiếng Anh')
        } else {
          const fieldLabel = key === 'name' ? 'Tên'
            : key === 'description' ? 'Mô tả'
            : key === 'mission' ? 'Sứ mệnh'
            : key === 'vision' ? 'Tầm nhìn'
            : key === 'history' ? 'Lịch sử'
            : key === 'research_overview' ? 'Tổng quan nghiên cứu'
            : key === 'seo_title' ? 'Tiêu đề SEO'
            : key === 'seo_description' ? 'Mô tả SEO'
            : key === 'code' ? 'Mã đơn vị'
            : key === 'thumbnail_object_key' ? 'Ảnh đại diện'
            : key === 'logo_object_key' ? 'Logo'
            : key === 'banner_object_key' ? 'Ảnh banner'
            : key === 'phone' ? 'Số điện thoại'
            : key === 'email' ? 'Email'
            : key === 'website' ? 'Website'
            : key === 'office' ? 'Văn phòng'
            : key === 'head_staff_id' ? 'Trưởng đơn vị'
            : key === 'parent_id' ? 'Đơn vị cha'
            : key
          extractErrors(val, prefix ? `${prefix} - ${fieldLabel}` : fieldLabel)
        }
      })
    }

    extractErrors(errors)
    if (errorMessages.length > 0) {
      toast.error(`Vui lòng kiểm tra lại thông tin: ${errorMessages.slice(0, 3).join('; ')}${errorMessages.length > 3 ? '...' : ''}`)
    } else {
      toast.error('Vui lòng kiểm tra lại các trường thông tin chưa nhập đầy đủ.')
    }
  }

  // ─── Render Helpers ───────────────────────────────────────────────────

  const isTranslating = isTranslatingName || isTranslatingDesc

  // Media upload component
  const renderMediaUpload = (
    label: string,
    fieldName: 'thumbnail_object_key' | 'logo_object_key' | 'banner_object_key',
    previewUrl: string | null,
    isUploading: boolean,
    inputRef: React.RefObject<HTMLInputElement | null>,
    setUploading: (v: boolean) => void,
    setPreview: (v: string | null) => void,
    required = false,
    aspectClass = 'aspect-video',
  ) => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={(e) => handleMediaUpload(e, fieldName, setUploading, setPreview, label)}
      />
      {previewUrl ? (
        <div className={cn("relative w-full overflow-hidden rounded-lg border bg-muted/30 group", aspectClass)}>
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-medium cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              Thay đổi
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-medium cursor-pointer gap-1"
              onClick={() => handleMediaRemove(fieldName, setPreview, label)}
            >
              <Trash2 className="h-3 w-3" /> Gỡ bỏ
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-all text-muted-foreground",
            aspectClass,
            form.formState.errors[fieldName]
              ? "border-destructive bg-destructive/5 hover:bg-destructive/10"
              : "border-muted-foreground/30 bg-muted/5 hover:bg-muted/15"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-[10px] font-medium text-muted-foreground">Đang tải lên...</span>
            </div>
          ) : (
            <>
              <Camera className="h-7 w-7 mb-1.5 opacity-60" />
              <span className="text-[10px] font-semibold text-foreground/80">Chọn {label.toLowerCase()}</span>
              <span className="text-[9px] text-muted-foreground/80 mt-0.5">Hỗ trợ JPG, PNG (tối đa 5MB)</span>
            </>
          )}
        </div>
      )}
      {form.formState.errors[fieldName] && (
        <p className="text-[10px] font-medium text-destructive mt-1">
          {(form.formState.errors[fieldName] as any)?.message}
        </p>
      )}
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/departments')}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full cursor-pointer hover:bg-muted"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-5.5 w-5.5 text-primary" />
              {isEditMode ? 'Chỉnh sửa bộ môn' : 'Thêm bộ môn mới'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode ? 'Cập nhật thông tin chi tiết bộ môn' : 'Tạo mới bộ môn giảng dạy, đào tạo khoa học trong trường.'}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit, onInvalid)}
          disabled={saveMutation.isPending}
          className="cursor-pointer text-xs h-9 font-semibold gap-1.5 shadow-sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>Lưu bộ môn</span>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ═══ Left Column (8/12): Nội dung chính ═══ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Nội dung Đa Ngôn Ngữ ── */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Nội dung Đa Ngôn Ngữ <span className="text-destructive">*</span></span>
                    </CardTitle>
                    <CardDescription className="text-[11px]">Tên, mô tả bộ môn theo từng ngôn ngữ.</CardDescription>
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
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tabs Selector */}
                <div className="flex border bg-muted/20 rounded-lg p-1 gap-1">
                  {([
                    { code: 'vi' as const, label: 'Tiếng Việt' },
                    { code: 'en' as const, label: 'Tiếng Anh' },
                  ]).map((tab) => {
                    const nameVal = form.watch(`translations.${tab.code}.name`)
                    const isTabDone = !!nameVal?.trim()
                    return (
                      <button
                        key={tab.code}
                        type="button"
                        onClick={() => handleTabChange(tab.code)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer relative",
                          activeTab === tab.code
                            ? "bg-card text-foreground shadow-xs border"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                      >
                        <span>{tab.label}</span>
                        {!isTabDone && (
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse absolute -top-0.5 -right-0.5" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Tiếng Việt Tab Content */}
                {mountedTabs.has('vi') && <div className={cn("space-y-4", activeTab !== 'vi' && "hidden")}>
                  {/* Tên bộ môn VI */}
                  <FormField
                    control={form.control}
                    name="translations.vi.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tên bộ môn (VI) <span className="text-destructive">*</span>
                        </FormLabel>
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

                   {/* Slug VI */}
                   <FormField
                     control={form.control}
                     name="translations.vi.slug"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-xs font-semibold">Slug (VI)</FormLabel>
                         <FormControl>
                           <Input
                             placeholder="Tự sinh từ tên bộ môn"
                             className="text-xs focus-visible:ring-primary/20 h-9 bg-muted/50 font-mono cursor-not-allowed"
                             readOnly
                             tabIndex={-1}
                             {...field}
                           />
                         </FormControl>
                         <FormDescription className="text-[10px]">Tự động sinh bởi hệ thống từ tên bộ môn.</FormDescription>
                       </FormItem>
                     )}
                   />

                  {/* Mô tả VI */}
                  <FormField
                    control={form.control}
                    name="translations.vi.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Mô tả bộ môn (VI) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <CmsEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Nhập mô tả giới thiệu..."
                            minHeight={120}
                            maxHeight={300}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                </div>}

                {/* Tiếng Anh Tab Content */}
                {mountedTabs.has('en') && <div className={cn("space-y-4", activeTab !== 'en' && "hidden")}>
                  {/* Tên bộ môn EN */}
                  <FormField
                    control={form.control}
                    name="translations.en.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tên bộ môn (EN) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Example: Department of Computer Science..."
                            className="text-xs focus-visible:ring-primary/20 h-9 bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                   {/* Slug EN */}
                   <FormField
                     control={form.control}
                     name="translations.en.slug"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-xs font-semibold">Slug (EN)</FormLabel>
                         <FormControl>
                           <Input
                             placeholder="Auto-generated from name"
                             className="text-xs focus-visible:ring-primary/20 h-9 bg-muted/50 font-mono cursor-not-allowed"
                             readOnly
                             tabIndex={-1}
                             {...field}
                           />
                         </FormControl>
                         <FormDescription className="text-[10px]">Auto-generated by the system from department name.</FormDescription>
                       </FormItem>
                     )}
                   />

                  {/* Mô tả EN */}
                  <FormField
                    control={form.control}
                    name="translations.en.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Mô tả bộ môn (EN) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <CmsEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Short description..."
                            minHeight={120}
                            maxHeight={300}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                </div>}
              </CardContent>
            </Card>

            {/* ── Nội dung chi tiết (CmsEditor) ── */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Nội dung chi tiết ({activeTab.toUpperCase()})</span>
                    </CardTitle>
                    <CardDescription className="text-[11px]">Sứ mệnh, tầm nhìn, lịch sử và tổng quan nghiên cứu.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* ── Tiếng Việt Editors ── */}
                {mountedTabs.has('vi') && <div className={cn("space-y-5", activeTab !== 'vi' && "hidden")}>
                  {/* Sứ mệnh VI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary/70" />
                        Sứ mệnh (VI)
                      </Label>
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-6 text-[10px] px-2 text-primary cursor-pointer"
                        onClick={() => handleTranslateHtml('translations.vi.mission', 'translations.en.mission', 'department_mission', 'sứ mệnh')}
                      >
                        <Languages className="h-3 w-3 mr-1" /> Dịch sang EN
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="translations.vi.mission"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Nhập sứ mệnh của bộ môn..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tầm nhìn VI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-primary/70" />
                        Tầm nhìn (VI)
                      </Label>
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-6 text-[10px] px-2 text-primary cursor-pointer"
                        onClick={() => handleTranslateHtml('translations.vi.vision', 'translations.en.vision', 'department_vision', 'tầm nhìn')}
                      >
                        <Languages className="h-3 w-3 mr-1" /> Dịch sang EN
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="translations.vi.vision"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Nhập tầm nhìn của bộ môn..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Lịch sử VI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                        Lịch sử (VI)
                      </Label>
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-6 text-[10px] px-2 text-primary cursor-pointer"
                        onClick={() => handleTranslateHtml('translations.vi.history', 'translations.en.history', 'department_history', 'lịch sử')}
                      >
                        <Languages className="h-3 w-3 mr-1" /> Dịch sang EN
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="translations.vi.history"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Nhập lịch sử hình thành bộ môn..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tổng quan nghiên cứu VI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <FlaskConical className="h-3.5 w-3.5 text-primary/70" />
                        Tổng quan nghiên cứu (VI)
                      </Label>
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-6 text-[10px] px-2 text-primary cursor-pointer"
                        onClick={() => handleTranslateHtml('translations.vi.research_overview', 'translations.en.research_overview', 'department_research_overview', 'tổng quan nghiên cứu')}
                      >
                        <Languages className="h-3 w-3 mr-1" /> Dịch sang EN
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="translations.vi.research_overview"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Nhập tổng quan nghiên cứu..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>}

                {/* ── Tiếng Anh Editors ── */}
                {mountedTabs.has('en') && <div className={cn("space-y-5", activeTab !== 'en' && "hidden")}>
                  {/* Sứ mệnh EN */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary/70" />
                      Sứ mệnh (EN)
                    </Label>
                    <FormField
                      control={form.control}
                      name="translations.en.mission"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Enter department mission..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tầm nhìn EN */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-primary/70" />
                      Tầm nhìn (EN)
                    </Label>
                    <FormField
                      control={form.control}
                      name="translations.en.vision"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Enter department vision..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Lịch sử EN */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary/70" />
                      Lịch sử (EN)
                    </Label>
                    <FormField
                      control={form.control}
                      name="translations.en.history"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Enter department history..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tổng quan nghiên cứu EN */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5 text-primary/70" />
                      Tổng quan nghiên cứu (EN)
                    </Label>
                    <FormField
                      control={form.control}
                      name="translations.en.research_overview"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Enter research overview..."
                              minHeight={120}
                              maxHeight={300}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>}
              </CardContent>
            </Card>

            {/* ── SEO ── */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-primary" />
                  <span>SEO ({activeTab.toUpperCase()})</span>
                </CardTitle>
                <CardDescription className="text-[11px]">Tối ưu hiển thị trên công cụ tìm kiếm.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google SERP Preview */}
                <div className="bg-background border rounded-lg p-4 space-y-1 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                    Xem trước trên Google
                  </div>
                  <div className="text-[#1a0dab] hover:underline text-[16px] leading-[20px] font-medium truncate">
                    {form.watch(`translations.${activeTab}.seo_title`)?.trim() || form.watch(`translations.${activeTab}.name`)?.trim() || 'Tên bộ môn'}
                    {' | Trường Kỹ Thuật Và Công Nghệ'}
                  </div>
                  <div className="text-[#006621] text-[12px] leading-[16px] truncate flex items-center gap-1">
                    {`https://kcnt.vinhuni.edu.vn/portal/departments/${form.watch(`translations.${activeTab}.slug`)?.trim() || '...'}`}
                  </div>
                  <div className="text-[#545454] text-[13px] leading-[18px] line-clamp-2">
                    {form.watch(`translations.${activeTab}.seo_description`)?.trim() || 'Mô tả chi tiết bộ môn...'}
                  </div>
                </div>

                {/* AI SEO Analysis Panel */}
                <DepartmentSeoAnalysisPanel
                  departmentId={departmentId}
                  lang={activeTab}
                  disabled={saveMutation.isPending}
                  getFormValues={() => ({
                    name: form.getValues(`translations.${activeTab}.name`) || '',
                    description: form.getValues(`translations.${activeTab}.description`) || '',
                    mission: form.getValues(`translations.${activeTab}.mission`) || '',
                    vision: form.getValues(`translations.${activeTab}.vision`) || '',
                    history: form.getValues(`translations.${activeTab}.history`) || '',
                    research_overview: form.getValues(`translations.${activeTab}.research_overview`) || '',
                    seo_title: form.getValues(`translations.${activeTab}.seo_title`) || '',
                    seo_description: form.getValues(`translations.${activeTab}.seo_description`) || '',
                    thumbnail_object_key: form.getValues('thumbnail_object_key') || '',
                    logo_object_key: form.getValues('logo_object_key') || '',
                    banner_object_key: form.getValues('banner_object_key') || '',
                  })}
                  onApplySeoTitle={(title) => {
                    form.setValue(`translations.${activeTab}.seo_title`, title)
                    toast.success('Đã áp dụng Tiêu đề SEO từ AI.')
                  }}
                  onApplySeoDescription={(desc) => {
                    form.setValue(`translations.${activeTab}.seo_description`, desc)
                    toast.success('Đã áp dụng Mô tả SEO từ AI.')
                  }}
                />

                {/* SEO Inputs */}
                <div className="space-y-4 pt-3 border-t border-border/40">
                  <FormField
                    control={form.control}
                    name={`translations.${activeTab}.seo_title`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-xs font-semibold">SEO Title</FormLabel>
                          <span className={cn(
                            'text-[10px]',
                            (field.value?.length || 0) > 70 ? 'text-destructive font-semibold' : 'text-muted-foreground'
                          )}>
                            {field.value?.length || 0}/70 ký tự
                          </span>
                        </div>
                        <FormControl>
                          <Input
                            placeholder={activeTab === 'vi' ? "Tiêu đề hiển thị trên Google..." : "Google display title..."}
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
                    name={`translations.${activeTab}.seo_description`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-xs font-semibold">SEO Description</FormLabel>
                          <span className={cn(
                            'text-[10px]',
                            (field.value?.length || 0) > 160 ? 'text-destructive font-semibold' : 'text-muted-foreground'
                          )}>
                            {field.value?.length || 0}/160 ký tự
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder={activeTab === 'vi' ? "Mô tả hiển thị trên kết quả tìm kiếm..." : "Search result description..."}
                            className="text-xs focus-visible:ring-primary/20 min-h-[70px] bg-background resize-none leading-relaxed"
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
          </div>

          {/* ═══ Right Column (4/12): Sidebar ═══ */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">

            {/* ── Media Upload ── */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Hình ảnh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderMediaUpload(
                  'Ảnh đại diện', 'thumbnail_object_key',
                  thumbnailPreviewUrl, isUploadingThumbnail,
                  thumbnailInputRef, setIsUploadingThumbnail, setThumbnailPreviewUrl,
                  false, 'aspect-video'
                )}
                {renderMediaUpload(
                  'Logo', 'logo_object_key',
                  logoPreviewUrl, isUploadingLogo,
                  logoInputRef, setIsUploadingLogo, setLogoPreviewUrl,
                  false, 'aspect-square'
                )}
                {renderMediaUpload(
                  'Banner', 'banner_object_key',
                  bannerPreviewUrl, isUploadingBanner,
                  bannerInputRef, setIsUploadingBanner, setBannerPreviewUrl,
                  false, 'aspect-[3/1]'
                )}
              </CardContent>
            </Card>

            {/* ── Thông tin liên hệ ── */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="0238-xxxxxx" className="text-xs focus-visible:ring-primary/20 h-9 bg-background font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Email liên hệ</FormLabel>
                      <FormControl>
                        <Input placeholder="username@vinhuni.edu.vn" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://fit.vinhuni.edu.vn" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="office"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Văn phòng</FormLabel>
                      <FormControl>
                        <Input placeholder="P. 302, Nhà A5..." className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ── Cấu hình ── */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-primary" />
                  Cấu hình
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mã đơn vị */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Mã đơn vị</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: CNTT_001" className="text-xs focus-visible:ring-primary/20 h-9 bg-background font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Loại đơn vị */}
                <FormField
                  control={form.control}
                  name="unit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Loại đơn vị</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-xs h-9 bg-background cursor-pointer">
                            <SelectValue placeholder="Chọn loại đơn vị..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="school" className="text-xs">Trường</SelectItem>
                          <SelectItem value="faculty" className="text-xs">Khoa</SelectItem>
                          <SelectItem value="department" className="text-xs">Bộ môn</SelectItem>
                          <SelectItem value="office" className="text-xs">Phòng ban</SelectItem>
                          <SelectItem value="center" className="text-xs">Trung tâm</SelectItem>
                          <SelectItem value="lab" className="text-xs">Phòng thí nghiệm</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Đơn vị cha */}
                {parentUnitType && (
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Khoa trực thuộc</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background cursor-pointer">
                              <SelectValue placeholder="Chọn khoa trực thuộc..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parentOptions.map((opt: any) => (
                              <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                {opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Trưởng bộ môn */}
                <FormField
                  control={form.control}
                  name="head_staff_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Trưởng bộ môn</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="text-xs h-9 bg-background cursor-pointer">
                            <SelectValue placeholder="Chọn trưởng bộ môn..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-xs">
                            <span className="text-muted-foreground">Không chọn</span>
                          </SelectItem>
                          {staffList.map((staff: any) => (
                            <SelectItem key={staff.id} value={staff.id} className="text-xs">
                              {staff.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                        Giảng viên phụ trách điều hành bộ môn.
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Thứ tự sắp xếp</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="display_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Thứ tự hiển thị</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Trạng thái */}
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
              </CardContent>
            </Card>
          </div>

        </form>
      </Form>

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
    </div>
  )
}
