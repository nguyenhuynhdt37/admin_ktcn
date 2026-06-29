import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router'
import {
  GraduationCap,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  Building2,
  Briefcase,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { teacherService } from '../services/teacherService'

export default function TeacherDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  // Fetch teacher details by Slug
  const { data: teacher, isLoading, isError } = useQuery({
    queryKey: ['teachers-detail', slug],
    queryFn: () => teacherService.getBySlug(slug!),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải hồ sơ giảng viên...</p>
      </div>
    )
  }

  if (isError || !teacher) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 text-left max-w-lg mx-auto mt-12">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold text-base text-destructive">Không tìm thấy giảng viên</h3>
          <p className="text-muted-foreground text-xs max-w-sm mt-1">
            Hồ sơ giảng viên không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/teachers')} className="mt-4 flex items-center gap-1.5 cursor-pointer text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    )
  }

  const initials = teacher.full_name.trim().split(' ').pop()?.charAt(0).toUpperCase() || 'G'
  const label = [teacher.academic_title, teacher.degree].filter(Boolean).join('. ')

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Top Action Bar */}
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
              Chi tiết hồ sơ giảng viên
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xem chi tiết lý lịch khoa học và thông tin liên hệ được công bố.
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => navigate(`/teachers/${teacher.id}/edit`)}
          variant="outline"
          size="sm"
          className="cursor-pointer text-xs h-9 font-semibold gap-1.5 shadow-xs"
        >
          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Sửa hồ sơ</span>
        </Button>
      </div>

      {/* Main Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Avatar & Science Biography (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border shadow-xs overflow-hidden">
            <div className="bg-muted/10 p-6 border-b flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar circle */}
              {teacher.avatar_object_key ? (
                <img
                  src={teacher.avatar_object_key}
                  alt={teacher.full_name}
                  className="h-24 w-24 rounded-full object-cover shrink-0 border-2 border-background shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0 border border-primary/20 shadow-inner">
                  {initials}
                </div>
              )}

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground leading-normal">{teacher.full_name}</h1>
                  {label && (
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border-none rounded self-center sm:self-auto">
                      {label}
                    </Badge>
                  )}
                </div>
                {teacher.english_name && (
                  <p className="text-xs text-muted-foreground font-medium">{teacher.english_name}</p>
                )}
                
                {/* Active switch mockup status */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <Badge variant={teacher.is_active ? 'default' : 'secondary'} className={`text-[9px] px-1.5 py-0 rounded ${
                    teacher.is_active ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 border'
                  }`}>
                    {teacher.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Thứ tự hiển thị: <strong className="font-mono text-foreground">{teacher.sort_order}</strong></span>
                </div>
              </div>
            </div>

            {/* Research interests */}
            {teacher.research_interests && (
              <CardContent className="pt-5 border-b">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Hướng nghiên cứu chính</h3>
                <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 border rounded-lg p-3 italic">
                  {teacher.research_interests}
                </p>
              </CardContent>
            )}

            {/* Biography */}
            <CardContent className="pt-5 pb-8 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Lý lịch khoa học chi tiết</h3>
              {teacher.biography ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-slate-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: teacher.biography }}
                />
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-6">Chưa cập nhật lý lịch khoa học.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact details (4/12) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">Thông tin liên hệ & Công tác</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Bộ môn */}
              <div className="flex items-start gap-3">
                <Building2 className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-left">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Bộ môn công tác</span>
                  <p className="font-medium text-foreground leading-normal">
                    {teacher.department?.name || 'Chưa liên kết'}
                  </p>
                </div>
              </div>

              {/* Chức vụ */}
              <div className="flex items-start gap-3">
                <Briefcase className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-left">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Chức vụ chính</span>
                  <p className="font-medium text-foreground leading-normal">
                    {teacher.position?.name || 'Chưa liên kết'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-left">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Email làm việc</span>
                  {teacher.email ? (
                    <a href={`mailto:${teacher.email}`} className="block font-medium text-primary hover:underline truncate max-w-[200px]">
                      {teacher.email}
                    </a>
                  ) : (
                    <p className="text-muted-foreground font-medium">-</p>
                  )}
                </div>
              </div>

              {/* Điện thoại */}
              <div className="flex items-start gap-3">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-left">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Điện thoại</span>
                  <p className="font-medium text-foreground font-mono">
                    {teacher.phone || '-'}
                  </p>
                </div>
              </div>

              {/* Văn phòng */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-left">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Văn phòng</span>
                  <p className="font-medium text-foreground leading-normal">
                    {teacher.office || '-'}
                  </p>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-start gap-3">
                <Globe className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-left">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Website cá nhân</span>
                  {teacher.website ? (
                    <a href={teacher.website} target="_blank" rel="noopener noreferrer" className="block font-medium text-primary hover:underline truncate max-w-[200px]">
                      {teacher.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <p className="text-muted-foreground font-medium">-</p>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
