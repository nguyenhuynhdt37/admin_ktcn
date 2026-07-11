import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Eye, EyeOff, ImagePlus, Images, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Textarea } from '@/shared/components/ui/textarea'
import { departmentService } from '@/features/departments/services/departmentService'
import { getMediaUrl } from '@/features/articles/utils/media'
import { academicContentService, type GalleryItem, type Program } from '../services/academicContentService'

type ProgramForm = { department_id: string; name: string; code: string; degree_level: string; duration_years: string; training_mode: string; short_description: string; is_published: boolean }
const emptyProgram: ProgramForm = { department_id: '', name: '', code: '', degree_level: 'bachelor', duration_years: '4', training_mode: 'Chính quy', short_description: '', is_published: false }

export function AcademicContentPage() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [departmentId, setDepartmentId] = useState('all')
  const [programOpen, setProgramOpen] = useState(false)
  const [programForm, setProgramForm] = useState<ProgramForm>(emptyProgram)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryDescription, setGalleryDescription] = useState('')
  const [galleryDepartment, setGalleryDepartment] = useState('')
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])

  const { data: departmentsData } = useQuery({ queryKey: ['departments', 'academic-content'], queryFn: () => departmentService.list({ page_size: 1000 }) })
  const departments = useMemo(() => departmentsData?.items ?? [], [departmentsData?.items])
  const departmentNames = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d.name])), [departments])
  const filterId = departmentId === 'all' ? undefined : departmentId
  const { data: programsData, isLoading: programsLoading } = useQuery({ queryKey: ['programs', filterId], queryFn: () => academicContentService.listPrograms(filterId) })
  const { data: galleriesData, isLoading: galleriesLoading } = useQuery({ queryKey: ['galleries', filterId], queryFn: () => academicContentService.listGalleries(filterId) })

  const programMutation = useMutation({
    mutationFn: () => academicContentService.createProgram({
      department_id: programForm.department_id, code: programForm.code || null, degree_level: programForm.degree_level,
      duration_years: programForm.duration_years ? Number(programForm.duration_years) : null, training_mode: programForm.training_mode || null,
      is_published: programForm.is_published, is_active: true, sort_order: 0,
      translations: { vi: { name: programForm.name, short_description: programForm.short_description || null } },
    }),
    onSuccess: () => { toast.success('Đã thêm chương trình đào tạo'); setProgramOpen(false); setProgramForm(emptyProgram); queryClient.invalidateQueries({ queryKey: ['programs'] }) },
    onError: () => toast.error('Không thể lưu chương trình đào tạo'),
  })
  const deleteProgram = useMutation({ mutationFn: academicContentService.deleteProgram, onSuccess: () => { toast.success('Đã xóa chương trình'); queryClient.invalidateQueries({ queryKey: ['programs'] }) } })
  const publishProgram = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => academicContentService.updateProgram(id, { is_published: value }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }) })

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => Promise.all(files.map(academicContentService.uploadImage)),
    onSuccess: (files) => setGalleryItems((current) => [...current, ...files.map((file, index) => ({ media_item_id: file.id, object_key: file.object_key, sort_order: current.length + index, is_active: true }))]),
    onError: () => toast.error('Không thể tải ảnh lên'),
  })
  const galleryMutation = useMutation({
    mutationFn: () => academicContentService.createGallery({
      department_id: galleryDepartment, is_active: true, sort_order: 0,
      cover_object_key: galleryItems[0]?.object_key || null,
      translations: { vi: { title: galleryTitle, description: galleryDescription || null } },
      items: galleryItems.map(({ media_item_id, caption, alt_text, sort_order, is_active }) => ({ media_item_id, caption, alt_text, sort_order, is_active })),
    }),
    onSuccess: () => { toast.success('Đã tạo album ảnh'); setGalleryOpen(false); setGalleryTitle(''); setGalleryDescription(''); setGalleryDepartment(''); setGalleryItems([]); queryClient.invalidateQueries({ queryKey: ['galleries'] }) },
    onError: () => toast.error('Không thể tạo album ảnh'),
  })
  const deleteGallery = useMutation({ mutationFn: academicContentService.deleteGallery, onSuccess: () => { toast.success('Đã xóa album'); queryClient.invalidateQueries({ queryKey: ['galleries'] }) } })

  const busy = programsLoading || galleriesLoading
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-primary">Nội dung đơn vị</p><h1 className="text-2xl font-bold">Đào tạo và hình ảnh</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý dữ liệu hiển thị trên trang từng khoa, bộ môn.</p></div>
        <div className="w-full sm:w-72"><Label className="sr-only">Lọc theo đơn vị</Label><Select value={departmentId} onValueChange={setDepartmentId}><SelectTrigger><SelectValue placeholder="Tất cả đơn vị" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả đơn vị</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <Tabs defaultValue="programs">
        <TabsList><TabsTrigger value="programs"><BookOpen className="mr-2 h-4 w-4" />Chương trình</TabsTrigger><TabsTrigger value="galleries"><Images className="mr-2 h-4 w-4" />Thư viện ảnh</TabsTrigger></TabsList>
        <TabsContent value="programs" className="mt-5 space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Chương trình đào tạo</h2><p className="text-sm text-muted-foreground">{programsData?.total ?? 0} chương trình</p></div><Button onClick={() => setProgramOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm chương trình</Button></div>
          <div className="overflow-hidden rounded-md border bg-card">{busy ? <Loading /> : (programsData?.items.length ? programsData.items.map((program) => <ProgramRow key={program.id} program={program} department={departmentNames[program.department_id]} onPublish={(value) => publishProgram.mutate({ id: program.id, value })} onDelete={() => deleteProgram.mutate(program.id)} />) : <Empty icon={BookOpen} text="Chưa có chương trình đào tạo" />)}</div>
        </TabsContent>
        <TabsContent value="galleries" className="mt-5 space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Thư viện ảnh</h2><p className="text-sm text-muted-foreground">{galleriesData?.total ?? 0} album</p></div><Button onClick={() => setGalleryOpen(true)}><ImagePlus className="mr-2 h-4 w-4" />Tạo album</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{galleriesLoading ? <Loading /> : galleriesData?.items.length ? galleriesData.items.map((gallery) => <div key={gallery.id} className="overflow-hidden rounded-md border bg-card"><div className="grid aspect-[16/8] grid-cols-3 bg-muted">{gallery.items.slice(0, 3).map((item) => <img key={item.id} src={getMediaUrl(item.object_key || '')} alt={item.alt_text || gallery.title} className="h-full w-full object-cover" />)}</div><div className="flex items-start justify-between gap-4 p-4"><div className="min-w-0"><h3 className="truncate font-semibold">{gallery.title}</h3><p className="mt-1 text-sm text-muted-foreground">{departmentNames[gallery.department_id]} · {gallery.items.length} ảnh</p></div><Button size="icon" variant="ghost" title="Xóa album" onClick={() => deleteGallery.mutate(gallery.id)}><Trash2 className="h-4 w-4" /></Button></div></div>) : <div className="sm:col-span-2 xl:col-span-3"><Empty icon={Images} text="Chưa có album ảnh" /></div>}</div>
        </TabsContent>
      </Tabs>

      <Dialog open={programOpen} onOpenChange={setProgramOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Thêm chương trình đào tạo</DialogTitle><DialogDescription>Thông tin cơ bản có thể bổ sung nội dung chi tiết sau.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="Đơn vị"><Select value={programForm.department_id} onValueChange={(v) => setProgramForm({ ...programForm, department_id: v })}><SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Mã chương trình"><Input value={programForm.code} onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })} placeholder="7480201" /></Field><div className="sm:col-span-2"><Field label="Tên chương trình"><Input value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} placeholder="Công nghệ thông tin" /></Field></div><Field label="Trình độ"><Select value={programForm.degree_level} onValueChange={(v) => setProgramForm({ ...programForm, degree_level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bachelor">Đại học</SelectItem><SelectItem value="master">Thạc sĩ</SelectItem><SelectItem value="doctorate">Tiến sĩ</SelectItem></SelectContent></Select></Field><Field label="Thời gian (năm)"><Input type="number" step="0.5" value={programForm.duration_years} onChange={(e) => setProgramForm({ ...programForm, duration_years: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Mô tả ngắn"><Textarea value={programForm.short_description} onChange={(e) => setProgramForm({ ...programForm, short_description: e.target.value })} /></Field></div><div className="flex items-center gap-3 sm:col-span-2"><Switch checked={programForm.is_published} onCheckedChange={(v) => setProgramForm({ ...programForm, is_published: v })} /><Label>Hiển thị ngay trên website</Label></div></div><DialogFooter><Button variant="outline" onClick={() => setProgramOpen(false)}>Hủy</Button><Button disabled={!programForm.department_id || !programForm.name || programMutation.isPending} onClick={() => programMutation.mutate()}>{programMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu chương trình</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Tạo album ảnh</DialogTitle><DialogDescription>Tải nhiều ảnh cùng lúc; ảnh đầu tiên được dùng làm ảnh bìa.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="Đơn vị"><Select value={galleryDepartment} onValueChange={setGalleryDepartment}><SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Tên album"><Input value={galleryTitle} onChange={(e) => setGalleryTitle(e.target.value)} placeholder="Hoạt động học thuật 2026" /></Field><div className="sm:col-span-2"><Field label="Mô tả"><Textarea value={galleryDescription} onChange={(e) => setGalleryDescription(e.target.value)} /></Field></div><div className="sm:col-span-2"><input ref={inputRef} className="hidden" type="file" accept="image/*" multiple onChange={(e) => e.target.files && uploadMutation.mutate(Array.from(e.target.files))} /><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-28 w-full flex-col items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-foreground"><Upload className="mb-2 h-5 w-5" />{uploadMutation.isPending ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}</button></div>{galleryItems.length > 0 && <div className="grid grid-cols-3 gap-2 sm:col-span-2 sm:grid-cols-5">{galleryItems.map((item, index) => <div key={item.media_item_id} className="group relative aspect-square overflow-hidden rounded-md bg-muted"><img src={getMediaUrl(item.object_key || '')} alt="" className="h-full w-full object-cover" /><button type="button" title="Bỏ ảnh" onClick={() => setGalleryItems((items) => items.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded bg-background/90 p-1 opacity-0 group-hover:opacity-100"><X className="h-4 w-4" /></button></div>)}</div>}</div><DialogFooter><Button variant="outline" onClick={() => setGalleryOpen(false)}>Hủy</Button><Button disabled={!galleryDepartment || !galleryTitle || galleryItems.length === 0 || galleryMutation.isPending} onClick={() => galleryMutation.mutate()}>{galleryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tạo album</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Loading() { return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> }
function Empty({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) { return <div className="flex h-44 flex-col items-center justify-center text-muted-foreground"><Icon className="mb-3 h-7 w-7" /><p className="text-sm">{text}</p></div> }
function ProgramRow({ program, department, onPublish, onDelete }: { program: Program; department?: string; onPublish: (value: boolean) => void; onDelete: () => void }) { return <div className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{program.name}</h3>{program.code && <Badge variant="outline">{program.code}</Badge>}</div><p className="mt-1 truncate text-sm text-muted-foreground">{department} · {program.duration_years ? `${program.duration_years} năm` : 'Chưa đặt thời gian'}</p></div><Button size="sm" variant="outline" onClick={() => onPublish(!program.is_published)}>{program.is_published ? <><Eye className="mr-2 h-4 w-4" />Đang hiển thị</> : <><EyeOff className="mr-2 h-4 w-4" />Bản nháp</>}</Button><Button size="icon" variant="ghost" title="Xóa chương trình" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div> }
