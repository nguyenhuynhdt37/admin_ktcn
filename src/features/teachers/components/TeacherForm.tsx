import { useState, useRef, useMemo, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { ArrowLeft, Save, Camera, Loader2, Trash, GraduationCap } from 'lucide-react'
import { teacherService } from '../services/teacherService'
import { departmentService } from '@/features/departments/services/departmentService'
import { positionService } from '@/features/positions/services/positionService'

// Zod validation schema for Teacher Form
const teacherFormSchema = z.object({
  department_id: z.string().min(1, { message: 'Vui lòng chọn Bộ môn' }),
  position_id: z.string().min(1, { message: 'Vui lòng chọn Chức vụ chính' }),
  full_name: z.string()
    .trim()
    .min(1, { message: 'Họ và tên là bắt buộc' })
    .max(150, { message: 'Họ và tên không vượt quá 150 ký tự' }),
  english_name: z.string()
    .trim()
    .max(150, { message: 'Tên tiếng Anh không vượt quá 150 ký tự' })
    .nullable()
    .optional()
    .or(z.literal('')),
  academic_title: z.string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal('')),
  degree: z.string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal('')),
  avatar_object_key: z.string().nullable().optional(),
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
  biography: z.string().nullable().optional().or(z.literal('')),
  research_interests: z.string()
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

type TeacherFormValues = z.infer<typeof teacherFormSchema>

// Hoist resolver statically to comply with valid-resolver-caching rule
const teacherFormResolver = zodResolver(teacherFormSchema)

interface TeacherFormProps {
  teacherId: string | null
}

export function TeacherForm({ teacherId }: TeacherFormProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)
  const isEditMode = !!teacherId

  // 1. Fetch departments (Bộ môn) to populate Select
  const { data: departmentData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments-active'],
    queryFn: () => departmentService.list({ is_active: true, page_size: 100 }),
  })
  const departments = useMemo(() => departmentData?.items || [], [departmentData])

  // 2. Fetch positions (Chức vụ) to populate Select
  const { data: positionData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions-active'],
    queryFn: () => positionService.list({ is_active: true, page_size: 100 }),
  })
  const positions = useMemo(() => positionData?.items || [], [positionData])

  // 3. Fetch details for editing
  const { data: teacherDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: () => teacherService.getDetail(teacherId!),
    enabled: isEditMode,
  })

  // 4. Initialize useForm with dynamic defaultValues matching the fetched detail if available
  const form = useForm<TeacherFormValues>({
    resolver: teacherFormResolver,
    reValidateMode: 'onBlur',
    defaultValues: isEditMode && teacherDetail ? {
      department_id: teacherDetail.department_id,
      position_id: teacherDetail.position_id,
      full_name: teacherDetail.full_name,
      english_name: teacherDetail.english_name || '',
      academic_title: teacherDetail.academic_title || '',
      degree: teacherDetail.degree || '',
      avatar_object_key: teacherDetail.avatar_object_key || '',
      email: teacherDetail.email || '',
      phone: teacherDetail.phone || '',
      website: teacherDetail.website || '',
      office: teacherDetail.office || '',
      biography: teacherDetail.biography || '',
      research_interests: teacherDetail.research_interests || '',
      sort_order: teacherDetail.sort_order,
      is_active: teacherDetail.is_active,
    } : {
      department_id: '',
      position_id: '',
      full_name: '',
      english_name: '',
      academic_title: '',
      degree: '',
      avatar_object_key: '',
      email: '',
      phone: '',
      website: '',
      office: '',
      biography: '',
      research_interests: '',
      sort_order: 0,
      is_active: true,
    }
  })

  // Sync edit data dynamically when teacherDetail updates
  useEffect(() => {
    if (isEditMode && teacherDetail) {
      form.reset({
        department_id: teacherDetail.department_id,
        position_id: teacherDetail.position_id,
        full_name: teacherDetail.full_name,
        english_name: teacherDetail.english_name || '',
        academic_title: teacherDetail.academic_title || '',
        degree: teacherDetail.degree || '',
        avatar_object_key: teacherDetail.avatar_object_key || '',
        email: teacherDetail.email || '',
        phone: teacherDetail.phone || '',
        website: teacherDetail.website || '',
        office: teacherDetail.office || '',
        biography: teacherDetail.biography || '',
        research_interests: teacherDetail.research_interests || '',
        sort_order: teacherDetail.sort_order,
        is_active: teacherDetail.is_active,
      })
    }
  }, [isEditMode, teacherDetail, form])

  // Watch avatar value reactively using useWatch for performance isolation
  const avatarKey = useWatch({ control: form.control, name: 'avatar_object_key' })
  const avatarPreview = localAvatarUrl || avatarKey



  // 4. Mutations: Create / Update
  const saveMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      // Clean and normalize payloads
      const payload = {
        ...values,
        english_name: values.english_name ? values.english_name.trim() : null,
        academic_title: values.academic_title ? values.academic_title : null,
        degree: values.degree ? values.degree : null,
        avatar_object_key: values.avatar_object_key ? values.avatar_object_key : null,
        email: values.email ? values.email.trim() : null,
        phone: values.phone ? values.phone.trim() : null,
        website: values.website ? values.website.trim() : null,
        office: values.office ? values.office.trim() : null,
        biography: values.biography ? values.biography.trim() : null,
        research_interests: values.research_interests ? values.research_interests.trim() : null,
      }

      if (isEditMode) {
        return teacherService.update(teacherId, payload)
      } else {
        return teacherService.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Cập nhật hồ sơ giảng viên thành công!' : 'Thêm hồ sơ giảng viên mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      navigate('/teachers')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      toast.error(errorData?.message || 'Không thể lưu hồ sơ giảng viên. Vui lòng thử lại.')
    },
  })

  // 5. Image uploading handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    const localUrl = URL.createObjectURL(file)
    setLocalAvatarUrl(localUrl)

    try {
      const res = await teacherService.uploadAvatar(file)
      // Save only the relative object_key (e.g. staffs/avatars/xxx.jpg)
      form.setValue('avatar_object_key', res.object_key)
      toast.success('Tải ảnh đại diện lên thành công!')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Không thể tải ảnh lên.')
      setLocalAvatarUrl(null)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    form.setValue('avatar_object_key', null)
    setLocalAvatarUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = (data: TeacherFormValues) => {
    saveMutation.mutate(data)
  }

  const isLoadingData = isLoadingDepts || isLoadingPositions || (isEditMode && isLoadingDetail)

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu giảng viên...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Top action bar */}
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
          
          {/* Left Column: Basic Information (8/12) */}
          <div className="lg:col-span-8 space-y-6">
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
                        <FormLabel className="text-xs font-semibold">Tên tiếng Anh (Không dấu)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Nguyen Van A" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Học hàm */}
                  <FormField
                    control={form.control}
                    name="academic_title"
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
                            <SelectItem value="Giáo sư" className="text-xs">Giáo sư (GS)</SelectItem>
                            <SelectItem value="Phó Giáo sư" className="text-xs">Phó Giáo sư (PGS)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* Học vị */}
                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Học vị</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-9 bg-background focus:ring-primary/20">
                              <SelectValue placeholder="Chọn học vị" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="" className="text-xs">Không có</SelectItem>
                            <SelectItem value="Tiến sĩ" className="text-xs">Tiến sĩ (TS)</SelectItem>
                            <SelectItem value="Thạc sĩ" className="text-xs">Thạc sĩ (ThS)</SelectItem>
                            <SelectItem value="Kỹ sư" className="text-xs">Kỹ sư (KS)</SelectItem>
                            <SelectItem value="Cử nhân" className="text-xs">Cử nhân (CN)</SelectItem>
                            <SelectItem value="Khác" className="text-xs">Khác</SelectItem>
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
              </CardContent>
            </Card>

            {/* Tiểu sử khoa học (CmsEditor) */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Lý lịch khoa học (Biography)</CardTitle>
                <CardDescription className="text-[11px]">Mô tả quá trình học tập, công tác, giảng dạy và công trình khoa học của giảng viên.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="biography"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CmsEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Soạn thảo lý lịch khoa học tại đây..."
                          minHeight={250}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Avatar, Contact & Options (4/12) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* Avatar Upload Card */}
            <Card className="border shadow-xs text-center">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Ảnh đại diện</CardTitle>
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
                      {avatarPreview && (
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
                  Hỗ trợ định dạng JPG, PNG. Ảnh đại diện sẽ tự động được thu nhỏ và tối ưu hóa khi tải lên.
                </p>
              </CardContent>
            </Card>

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
                        <Input placeholder="username@vinhuni.edu.vn" className="text-xs focus-visible:ring-primary/20 h-9 bg-background" {...field} value={field.value || ''} />
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

            {/* Research & Settings Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Hướng nghiên cứu & Sắp xếp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hướng nghiên cứu */}
                <FormField
                  control={form.control}
                  name="research_interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Hướng nghiên cứu chính</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ví dụ: Trí tuệ nhân tạo, Học máy, Khai phá dữ liệu..."
                          className="text-xs focus-visible:ring-primary/20 min-h-[70px] bg-background resize-none leading-relaxed"
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
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold">Trạng thái hoạt động</FormLabel>
                        <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
                          Cho phép giảng viên hoạt động và hiển thị trên cổng thông tin.
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
    </div>
  )
}
