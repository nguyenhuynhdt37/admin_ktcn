import { useState, useRef, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { CmsEditor } from '@/shared/components/CmsEditor'
import { toast } from 'sonner'
import { ArrowLeft, Save, Camera, Loader2, Trash, GraduationCap, Globe, Languages } from 'lucide-react'
import { teacherService } from '../services/teacherService'
import { departmentService } from '@/features/departments/services/departmentService'
import { positionService } from '@/features/positions/services/positionService'
import { getMediaUrl } from '@/features/articles/utils/media'
import { httpClient } from '@/services/http/client'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { cn } from '@/lib/utils'

// 1. Zod Schema
const translationSchema = z.object({
  biography: z.string().optional().or(z.literal('')),
  research_interests: z.string().trim().max(1000, { message: 'Hướng nghiên cứu không vượt quá 1000 ký tự' }).optional().or(z.literal('')),
})

const teacherFormSchema = z.object({
  department_id: z.string().min(1, { message: 'Vui lòng chọn Bộ môn' }),
  position_id: z.string().min(1, { message: 'Vui lòng chọn Chức vụ chính' }),
  academic_title_id: z.string().nullable().optional().or(z.literal('')),
  degree_id: z.string().nullable().optional().or(z.literal('')),
  full_name: z.string()
    .trim()
    .min(1, { message: 'Họ và tên là bắt buộc' })
    .max(150, { message: 'Họ và tên không vượt quá 150 ký tự' }),
  english_name: z.string().trim().max(150, { message: 'Tên tiếng Anh không vượt quá 150 ký tự' }).optional().or(z.literal('')),
  date_of_birth: z.string().nullable().optional().or(z.literal('')),
  gender: z.string().nullable().optional().or(z.literal('')),
  avatar_object_key: z.string().optional().or(z.literal('')),
  email: z.string()
    .trim()
    .max(100, { message: 'Email liên hệ không vượt quá 100 ký tự' })
    .email({ message: 'Địa chỉ email không hợp lệ' })
    .nullable()
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .max(50, { message: 'Số điện thoại không vượt quá 50 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  website: z.string()
    .trim()
    .max(255, { message: 'Địa chỉ website cá nhân không vượt quá 255 ký tự' })
    .refine(
      (val) => !val || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val),
      { message: 'Đường dẫn website không đúng định dạng' }
    )
    .nullable()
    .optional()
    .or(z.literal('')),
  office: z.string()
    .trim()
    .max(150, { message: 'Văn phòng làm việc không vượt quá 150 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
  profile_status: z.enum(['imported', 'pending_review', 'completed', 'published']).default('pending_review'),
  is_visible: z.boolean().default(false),
  note: z.string().max(2000, { message: 'Ghi chú không vượt quá 2000 ký tự' }).optional().or(z.literal('')),
  translations: z.object({
    vi: translationSchema,
    en: translationSchema,
  })
})

type TeacherFormValues = z.infer<typeof teacherFormSchema>

const teacherFormResolver = zodResolver(teacherFormSchema)

interface TeacherFormProps {
  teacherId: string | null
}

// Hàm map dữ liệu Backend trả về -> Form Values
function mapBackendToForm(detail: any): TeacherFormValues {
  return {
    department_id: detail.department_id || '',
    position_id: detail.position_id || '',
    academic_title_id: detail.academic_title_id || '',
    degree_id: detail.degree_id || '',
    full_name: detail.full_name || '',
    english_name: detail.english_name || '',
    date_of_birth: detail.date_of_birth || '',
    gender: detail.gender || '',
    avatar_object_key: detail.avatar_object_key || '',
    email: detail.email || '',
    phone: detail.phone || '',
    website: detail.website || '',
    office: detail.office || '',
    sort_order: detail.sort_order || 0,
    is_active: detail.is_active !== undefined ? detail.is_active : true,
    profile_status: detail.profile_status || 'pending_review',
    is_visible: detail.is_visible === true,
    note: detail.note || '',
    translations: {
      vi: {
        biography: detail.translations?.vi?.biography || detail.biography || '',
        research_interests: detail.translations?.vi?.research_interests || detail.research_interests || '',
      },
      en: {
        biography: detail.translations?.en?.biography || '',
        research_interests: detail.translations?.en?.research_interests || '',
      }
    }
  }
}

// Form values mặc định cho màn tạo mới (Create)
function getCreateDefaultValues(): TeacherFormValues {
  return {
    department_id: '',
    position_id: '',
    academic_title_id: '',
    degree_id: '',
    full_name: '',
    english_name: '',
    date_of_birth: '',
    gender: '',
    avatar_object_key: '',
    email: '',
    phone: '',
    website: '',
    office: '',
    sort_order: 0,
    is_active: true,
    profile_status: 'pending_review',
    is_visible: false,
    note: '',
    translations: {
      vi: { biography: '', research_interests: '' },
      en: { biography: '', research_interests: '' }
    }
  }
}

// Component Container: Load dependencies, load detail, mapping dữ liệu và quản lý trạng thái loading chung
export function TeacherForm({ teacherId }: TeacherFormProps) {
  const isEditMode = !!teacherId

  // 1. Fetch chi tiết giảng viên nếu ở chế độ Edit
  const { data: teacherDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: () => teacherService.getDetail(teacherId!),
    enabled: isEditMode,
  })

  // 2. Fetch danh sách bộ môn
  const { data: departmentData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments-active'],
    queryFn: () => departmentService.list({ is_active: true, page_size: 100 }),
  })

  // 3. Fetch danh sách chức vụ
  const { data: positionData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions-active'],
    queryFn: () => positionService.list({ is_active: true, page_size: 100 }),
  })

  // 4. Fetch danh sách học hàm
  const { data: rawAcademicTitles = [], isLoading: isLoadingTitles } = useQuery({
    queryKey: ['academic-titles-active'],
    queryFn: () => teacherService.getAcademicTitles(),
  })

  // 5. Fetch danh sách học vị
  const { data: rawDegrees = [], isLoading: isLoadingDegrees } = useQuery({
    queryKey: ['degrees-active'],
    queryFn: () => teacherService.getDegrees(),
  })

  // Xử lý nạp bản ghi hiện tại của giảng viên vào danh sách danh mục nếu bản ghi đó không active (tránh select rỗng)
  const departments = useMemo(() => {
    const items = departmentData?.items || []
    if (isEditMode && teacherDetail?.department_id) {
      const hasDept = items.some((d) => d.id === teacherDetail.department_id)
      if (!hasDept) {
        const name = teacherDetail.department?.name || `Bộ môn (ID: ${teacherDetail.department_id.substring(0, 8)})`
        return [...items, {
          id: teacherDetail.department_id,
          name: `${name} (Chưa kích hoạt hoặc lưu trữ)`,
          thumbnail_object_key: '',
          phone: '',
          email: '',
          website: '',
          office: '',
          sort_order: 99,
          is_active: false
        } as any]
      }
    }
    return items
  }, [departmentData, isEditMode, teacherDetail])

  const positions = useMemo(() => {
    const items = positionData?.items || []
    if (isEditMode && teacherDetail?.position_id) {
      const hasPos = items.some((p) => p.id === teacherDetail.position_id)
      if (!hasPos) {
        const name = teacherDetail.position?.name || `Chức vụ (ID: ${teacherDetail.position_id.substring(0, 8)})`
        return [...items, {
          id: teacherDetail.position_id,
          name: `${name} (Chưa kích hoạt hoặc lưu trữ)`,
          sort_order: 99,
          is_active: false
        } as any]
      }
    }
    return items
  }, [positionData, isEditMode, teacherDetail])

  const academicTitles = useMemo(() => {
    const items = rawAcademicTitles || []
    if (isEditMode && teacherDetail?.academic_title_id) {
      const hasTitle = items.some((t) => t.id === teacherDetail.academic_title_id)
      if (!hasTitle) {
        const name = teacherDetail.academic_title || `Học hàm (ID: ${teacherDetail.academic_title_id.substring(0, 8)})`
        return [...items, {
          id: teacherDetail.academic_title_id,
          name: `${name} (Chưa kích hoạt hoặc lưu trữ)`,
          abbreviation: '',
          sort_order: 99,
          is_active: false
        }]
      }
    }
    return items
  }, [rawAcademicTitles, isEditMode, teacherDetail])

  const degrees = useMemo(() => {
    const items = rawDegrees || []
    if (isEditMode && teacherDetail?.degree_id) {
      const hasDegree = items.some((d) => d.id === teacherDetail.degree_id)
      if (!hasDegree) {
        const name = teacherDetail.degree || `Học vị (ID: ${teacherDetail.degree_id.substring(0, 8)})`
        return [...items, {
          id: teacherDetail.degree_id,
          name: `${name} (Chưa kích hoạt hoặc lưu trữ)`,
          abbreviation: '',
          sort_order: 99,
          is_active: false
        }]
      }
    }
    return items
  }, [rawDegrees, isEditMode, teacherDetail])

  const isLoadingData = isLoadingDepts || isLoadingPositions || isLoadingTitles || isLoadingDegrees || (isEditMode && isLoadingDetail)

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu giảng viên...</p>
      </div>
    )
  }

  // Thực hiện mapping tập trung Backend -> Form
  const initialValues = isEditMode && teacherDetail
    ? mapBackendToForm(teacherDetail)
    : getCreateDefaultValues()

  return (
    <TeacherFormInner
      initialValues={initialValues}
      departments={departments}
      positions={positions}
      academicTitles={academicTitles}
      degrees={degrees}
      teacherId={teacherId}
    />
  )
}

interface TeacherFormInnerProps {
  initialValues: TeacherFormValues
  departments: any[]
  positions: any[]
  academicTitles: any[]
  degrees: any[]
  teacherId: string | null
}

// Hàm map từ Form Values -> Payload submit Backend
function mapFormToPayload(values: TeacherFormValues) {
  return {
    department_id: values.department_id,
    position_id: values.position_id,
    academic_title_id: values.academic_title_id || null,
    degree_id: values.degree_id || null,
    full_name: values.full_name.trim(),
    english_name: values.english_name?.trim() || null,
    date_of_birth: values.date_of_birth || null,
    gender: values.gender || null,
    avatar_object_key: values.avatar_object_key,
    email: values.email ? values.email.trim() : null,
    phone: values.phone ? values.phone.trim() : null,
    website: values.website ? values.website.trim() : null,
    office: values.office ? values.office.trim() : null,
    sort_order: values.sort_order,
    is_active: values.is_active,
    profile_status: values.profile_status,
    is_visible: values.is_visible,
    note: values.note?.trim() || null,
    translations: {
      vi: {
        biography: values.translations.vi.biography?.trim() || null,
        research_interests: values.translations.vi.research_interests?.trim() || null,
      },
      en: {
        biography: values.translations.en.biography?.trim() || null,
        research_interests: values.translations.en.research_interests?.trim() || null,
      }
    }
  }
}

// Component hiển thị chính: Khởi tạo React Hook Form một lần duy nhất bằng defaultValues đã load đầy đủ
function TeacherFormInner({
  initialValues,
  departments,
  positions,
  academicTitles,
  degrees,
  teacherId
}: TeacherFormInnerProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  
  // Trạng thái loading cho các nút dịch tự động riêng lẻ
  const [isTranslatingName, setIsTranslatingName] = useState(false)
  const [isTranslatingInterests, setIsTranslatingInterests] = useState(false)
  const [isTranslatingBiography, setIsTranslatingBiography] = useState(false)

  const isEditMode = !!teacherId

  const form: any = useForm<TeacherFormValues>({
    resolver: teacherFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: initialValues
  })

  // Watch avatar key
  const avatarKey = form.watch('avatar_object_key')
  const avatarPreview = localAvatarUrl || (avatarKey ? getMediaUrl(avatarKey) : null)

  // Xử lý tự động dịch Tên tiếng Anh (Text) từ full_name
  const handleTranslateEnglishName = async () => {
    const fullName = form.getValues('full_name')?.trim()
    if (!fullName) {
      toast.error('Vui lòng điền Họ và tên Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslatingName(true)
    try {
      const res = await httpClient.post<Record<string, string>>('/translation', {
        text: fullName,
        target_languages: ['en'],
        context: 'english_name'
      }, { timeout: 60000 })
      if (res.data?.en) {
        form.setValue('english_name', res.data.en)
        toast.success('Dịch tên tiếng Anh thành công!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Có lỗi xảy ra khi dịch tên tiếng Anh.')
    } finally {
      setIsTranslatingName(false)
    }
  }

  // 2. Dịch Hướng nghiên cứu chính (Text) từ translations.vi.research_interests
  const handleTranslateResearchInterests = async () => {
    const interestsVi = form.getValues('translations.vi.research_interests')?.trim()
    if (!interestsVi) {
      toast.error('Vui lòng điền Hướng nghiên cứu Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslatingInterests(true)
    try {
      const res = await httpClient.post<Record<string, string>>('/translation', {
        text: interestsVi,
        target_languages: ['en'],
        context: 'research_direction'
      }, { timeout: 60000 })
      if (res.data?.en) {
        form.setValue('translations.en.research_interests', res.data.en)
        toast.success('Dịch hướng nghiên cứu thành công!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Có lỗi xảy ra khi dịch hướng nghiên cứu.')
    } finally {
      setIsTranslatingInterests(false)
    }
  }

  // 3. Dịch Lý lịch khoa học (HTML) từ translations.vi.biography
  const handleTranslateBiography = async () => {
    const biographyVi = form.getValues('translations.vi.biography')?.trim()
    if (!biographyVi) {
      toast.error('Vui lòng điền Lý lịch khoa học Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslatingBiography(true)
    try {
      const res = await httpClient.post<Record<string, string>>('/translation/html', {
        html: biographyVi,
        target_languages: ['en'],
        context: 'scientific_profile'
      }, { timeout: 60000 })
      if (res.data?.en) {
        form.setValue('translations.en.biography', res.data.en)
        toast.success('Dịch lý lịch khoa học (HTML) thành công!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Có lỗi xảy ra khi dịch lý lịch khoa học.')
    } finally {
      setIsTranslatingBiography(false)
    }
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  const onTranslateEnglishNameClick = () => {
    const enName = form.getValues('english_name')?.trim()
    if (enName) {
      setConfirmAction(() => handleTranslateEnglishName)
      setConfirmOpen(true)
    } else {
      handleTranslateEnglishName()
    }
  }

  const onTranslateResearchInterestsClick = () => {
    const enInterests = form.getValues('translations.en.research_interests')?.trim()
    if (enInterests) {
      setConfirmAction(() => handleTranslateResearchInterests)
      setConfirmOpen(true)
    } else {
      handleTranslateResearchInterests()
    }
  }

  const onTranslateBiographyClick = () => {
    const enBiography = form.getValues('translations.en.biography')?.trim()
    const cleanEnBiography = enBiography?.replace(/<[^>]*>/g, '').trim()
    if (cleanEnBiography) {
      setConfirmAction(() => handleTranslateBiography)
      setConfirmOpen(true)
    } else {
      handleTranslateBiography()
    }
  }

  // Mutation lưu dữ liệu
  const saveMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      const payload = mapFormToPayload(values)
      if (isEditMode) {
        return teacherService.update(teacherId!, payload)
      } else {
        return teacherService.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Cập nhật hồ sơ giảng viên thành công!' : 'Thêm hồ sơ giảng viên mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] })
      navigate('/teachers')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      toast.error(errorData?.message || 'Không thể lưu hồ sơ giảng viên. Vui lòng thử lại.')
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    const localUrl = URL.createObjectURL(file)
    setLocalAvatarUrl(localUrl)

    try {
      const res = await teacherService.uploadAvatar(file)
      form.setValue('avatar_object_key', res.object_key)
      form.clearErrors('avatar_object_key')
      toast.success('Tải ảnh đại diện lên thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh lên.')
      setLocalAvatarUrl(null)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    form.setValue('avatar_object_key', '')
    setLocalAvatarUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = (data: TeacherFormValues) => {
    saveMutation.mutate(data)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/teachers')}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full cursor-pointer hover:bg-muted"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="h-5.5 w-5.5 text-primary" />
              {isEditMode ? 'Chỉnh sửa hồ sơ giảng viên' : 'Thêm giảng viên mới'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode ? 'Cập nhật lý lịch khoa học và thông tin giảng viên' : 'Tạo mới hồ sơ khoa học của giảng viên mới'}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={saveMutation.isPending}
          className="cursor-pointer text-xs h-9 font-semibold gap-1.5 shadow-sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>Lưu hồ sơ</span>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Basic & i18n details (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Basic Information */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Thông tin cơ bản</CardTitle>
                <CardDescription className="text-[11px]">Các thông tin cá nhân cơ bản của giảng viên.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Họ và tên <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Nguyễn Văn A" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} />
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
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold">Tên tiếng Anh (Không dấu) <span className="text-destructive">*</span></FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 text-[10px] text-primary hover:bg-primary/5 px-1.5 flex items-center gap-1 cursor-pointer"
                            onClick={onTranslateEnglishNameClick}
                            disabled={isTranslatingName}
                          >
                            {isTranslatingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                            <span>Dịch tự động</span>
                          </Button>
                        </div>
                        <FormControl>
                          <Input placeholder="Ví dụ: Nguyen Van A" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Ngày sinh</FormLabel>
                        <FormControl>
                          <Input type="date" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription className="text-[10px]">Chỉ dùng trong quản trị, không hiển thị trên portal.</FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Giới tính</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                              <SelectValue placeholder="Chưa cập nhật" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nam" className="text-xs">Nam</SelectItem>
                            <SelectItem value="nu" className="text-xs">Nữ</SelectItem>
                            <SelectItem value="khac" className="text-xs">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bộ môn */}
                  <FormField
                    control={form.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Bộ môn <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                              <SelectValue placeholder="Chọn bộ môn sinh hoạt" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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

                  {/* Chức vụ */}
                  <FormField
                    control={form.control}
                    name="position_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Chức vụ chính <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                              <SelectValue placeholder="Chọn chức vụ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id} className="text-xs">
                                {pos.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Học hàm */}
                  <FormField
                    control={form.control}
                    name="academic_title_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Học hàm</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                              <SelectValue placeholder="Chọn học hàm (nếu có)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="" className="text-xs">Không có</SelectItem>
                            {academicTitles.map((title) => (
                              <SelectItem key={title.id} value={title.id} className="text-xs">
                                {title.name} ({title.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* Học vị */}
                  <FormField
                    control={form.control}
                    name="degree_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Học vị</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                              <SelectValue placeholder="Chọn học vị (nếu có)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="" className="text-xs">Không có</SelectItem>
                            {degrees.map((deg) => (
                              <SelectItem key={deg.id} value={deg.id} className="text-xs">
                                {deg.name} ({deg.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* i18n Fields Section */}
            <div className="space-y-4 border border-border/80 p-4 rounded-2xl bg-muted/5 relative">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Nội dung Đa Ngôn Ngữ</span>
                </div>
              </div>

              {/* Language Tabs */}
              <div className="flex border bg-muted/20 rounded-lg p-1 gap-1">
                {[
                  { code: 'vi' as const, label: 'Tiếng Việt' },
                  { code: 'en' as const, label: 'Tiếng Anh' },
                ].map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setActiveTab(tab.code)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      activeTab === tab.code
                        ? "bg-card text-foreground shadow-xs border"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Localized inputs (sử dụng css hidden để tránh unmount làm mất data của CKEditor/Textarea khi chuyển tab) */}
              <div className="space-y-4 pt-2">
                {/* Tab Tiếng Việt */}
                <div className={cn("space-y-4", activeTab !== 'vi' && "hidden")}>
                  {/* Hướng nghiên cứu chính VI */}
                  <FormField
                    control={form.control}
                    name="translations.vi.research_interests"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold">Hướng nghiên cứu chính (VI)</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 text-[10px] text-primary hover:bg-primary/5 px-1.5 flex items-center gap-1 cursor-pointer"
                            onClick={onTranslateResearchInterestsClick}
                            disabled={isTranslatingInterests}
                          >
                            {isTranslatingInterests ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                            <span>Dịch sang EN</span>
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Ví dụ: Trí tuệ nhân tạo, Big Data..."
                            className="text-xs focus-visible:ring-primary/20 min-h-[70px] bg-background resize-none leading-relaxed"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* Lý lịch khoa học VI */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold">Lý lịch khoa học (VI)</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-6 text-[10px] text-primary hover:bg-primary/5 px-1.5 flex items-center gap-1 cursor-pointer"
                        onClick={onTranslateBiographyClick}
                        disabled={isTranslatingBiography}
                      >
                        {isTranslatingBiography ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                        <span>Dịch sang EN (HTML)</span>
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="translations.vi.biography"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Soạn thảo lý lịch khoa học Tiếng Việt tại đây..."
                              minHeight={250}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Tab Tiếng Anh */}
                <div className={cn("space-y-4", activeTab !== 'en' && "hidden")}>
                  {/* Hướng nghiên cứu chính EN */}
                  <FormField
                    control={form.control}
                    name="translations.en.research_interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Hướng nghiên cứu chính (EN)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Example: Artificial Intelligence, Big Data..."
                            className="text-xs focus-visible:ring-primary/20 min-h-[70px] bg-background resize-none leading-relaxed"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* Lý lịch khoa học EN */}
                  <div className="space-y-1.5 text-left">
                    <FormLabel className="text-xs font-semibold">Lý lịch khoa học (EN)</FormLabel>
                    <FormField
                      control={form.control}
                      name="translations.en.biography"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CmsEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Draft academic biography in English here..."
                              minHeight={250}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Avatar, Contact Info & Settings (4/12) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* Avatar Upload Card */}
            <FormField
              control={form.control}
              name="avatar_object_key"
              render={({ field, fieldState }) => (
                <Card className={cn("border shadow-xs text-center", fieldState.invalid && "border-destructive/50")}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center justify-center gap-1">
                      <span>Ảnh đại diện</span>
                      <span className="text-destructive">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-4 space-y-4">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border bg-muted flex items-center justify-center group shadow-sm">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="size-full object-cover transition-transform group-hover:scale-105 duration-200"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground/55 p-4">
                          <Camera className="h-9 w-9 mb-1.5 opacity-50" />
                          <span className="text-[10px] font-semibold">Chưa có ảnh</span>
                        </div>
                      )}

                      {!avatarUploading && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[10px] font-semibold cursor-pointer px-2 rounded-md"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Chọn ảnh
                          </Button>
                          {avatarKey && (
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7 p-0 cursor-pointer rounded-md"
                              onClick={handleRemoveAvatar}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}

                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Hỗ trợ định dạng JPG, PNG. Ảnh đại diện sẽ tự động được lưu và tối ưu hóa trên máy chủ.
                    </p>
                    <FormMessage className="text-[10px]" />
                  </CardContent>
                </Card>
              )}
            />

            {/* Contact Details Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Email làm việc</FormLabel>
                      <FormControl>
                        <Input placeholder="username@university.edu.vn" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Điện thoại */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Điện thoại di động</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: 0987654321..." className="text-xs focus-visible:ring-primary/20 h-9 bg-background font-mono" {...field} value={field.value || ''} />
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
                      <FormLabel className="text-xs font-semibold">Địa chỉ văn phòng</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Phòng 301, Nhà A1" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Website cá nhân */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Website cá nhân / Google Scholar</FormLabel>
                      <FormControl>
                        <Input placeholder="https://scholar.google.com/..." className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Cấu hình & Sắp xếp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="profile_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Tiến độ hồ sơ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="imported" className="text-xs">Mới nhập từ quyết định</SelectItem>
                          <SelectItem value="pending_review" className="text-xs">Chờ rà soát</SelectItem>
                          <SelectItem value="completed" className="text-xs">Đã hoàn thiện</SelectItem>
                          <SelectItem value="published" className="text-xs">Đã xuất bản</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <FormLabel className="text-xs font-semibold">Thứ tự hiển thị</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Trạng thái hoạt động */}
                <FormField
                  control={form.control}
                  name="is_visible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 bg-muted/10">
                      <div className="space-y-0.5 pr-3">
                        <FormLabel className="text-xs font-semibold">Hiển thị công khai</FormLabel>
                        <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                          Cho phép hồ sơ xuất hiện trên website sau khi đã rà soát.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75 cursor-pointer" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold">Trạng thái hoạt động</FormLabel>
                        <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                          Giữ hồ sơ trong hệ thống và cho phép quản trị cập nhật.
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

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Ghi chú nội bộ</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Thông tin cần bổ sung hoặc kiểm tra..."
                          className="min-h-[84px] resize-none text-xs bg-background"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

          </div>

        </form>
      </Form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận ghi đè bản dịch"
        description="Thông tin Tiếng Anh hiện tại đã có dữ liệu. Bạn có chắc chắn muốn dịch lại và ghi đè bản dịch cũ không?"
        onConfirm={() => {
          confirmAction?.()
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
