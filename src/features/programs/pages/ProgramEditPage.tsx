import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  GraduationCap,
  Languages,
  ListChecks,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { programService } from '../services/programService'
import type {
  Program,
  ProgramAcademicProfileInput,
  ProgramCourseInput,
  ProgramDocumentInput,
  ProgramOutcomeInput,
  ProgramTranslation,
  ProgramVersionInput,
} from '../types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/lib/utils'

type EditorSection = 'overview' | 'documents' | 'outcomes' | 'courses'
type MainSection = 'general' | 'academic'

const optionalText = (value?: string | null) => value?.trim() || null
const numberOrNull = (value: string) => (value === '' ? null : Number(value))

function newVersion(year: number): ProgramVersionInput {
  return {
    version_year: year,
    cohort_code: '',
    total_credits: null,
    is_current: false,
    is_published: false,
    sort_order: 0,
    translations: {
      vi: {
        title: `Chương trình đào tạo năm ${year}`,
        summary: '',
        general_objective: '',
        career_opportunities: '',
      },
    },
    documents: [],
    outcomes: [],
    courses: [],
  }
}

function newDocument(sortOrder: number): ProgramDocumentInput {
  return {
    document_type: 'program_specification',
    source_url: '',
    object_key: null,
    mime_type: 'application/pdf',
    file_size: null,
    page_count: null,
    checksum_sha256: null,
    sort_order: sortOrder,
    translations: { vi: { title: '', description: '' } },
  }
}

function newOutcome(type: ProgramOutcomeInput['outcome_type'], sortOrder: number): ProgramOutcomeInput {
  return {
    code: type === 'objective' ? `PO${sortOrder + 1}` : `PLO${sortOrder + 1}`,
    outcome_type: type,
    parent_code: null,
    sort_order: sortOrder,
    translations: { vi: { content: '' } },
  }
}

function newCourse(sortOrder: number): ProgramCourseInput {
  return {
    course_code: '',
    row_type: 'course',
    credits: null,
    credits_text: '',
    semester: '',
    knowledge_block: '',
    course_type: '',
    managing_unit: '',
    sort_order: sortOrder,
    translations: { vi: { name: '' } },
  }
}

function cleanProfile(profile: ProgramAcademicProfileInput): ProgramAcademicProfileInput {
  return {
    versions: profile.versions.map((version) => ({
      ...version,
      cohort_code: optionalText(version.cohort_code),
      translations: Object.fromEntries(
        Object.entries(version.translations)
          .filter(([, value]) => value.title.trim())
          .map(([locale, value]) => [
            locale,
            {
              title: value.title.trim(),
              summary: optionalText(value.summary),
              general_objective: optionalText(value.general_objective),
              career_opportunities: optionalText(value.career_opportunities),
            },
          ]),
      ),
      documents: version.documents.map((document) => ({
        ...document,
        source_url: optionalText(document.source_url),
        object_key: optionalText(document.object_key),
        mime_type: optionalText(document.mime_type),
        checksum_sha256: optionalText(document.checksum_sha256),
        translations: Object.fromEntries(
          Object.entries(document.translations)
            .filter(([, value]) => value.title.trim())
            .map(([locale, value]) => [
              locale,
              { title: value.title.trim(), description: optionalText(value.description) },
            ]),
        ),
      })),
      outcomes: version.outcomes.map((outcome) => ({
        ...outcome,
        code: outcome.code.trim(),
        parent_code: optionalText(outcome.parent_code),
        translations: Object.fromEntries(
          Object.entries(outcome.translations)
            .filter(([, value]) => value.content.trim())
            .map(([locale, value]) => [locale, { content: value.content.trim() }]),
        ),
      })),
      courses: version.courses.map((course) => ({
        ...course,
        course_code: optionalText(course.course_code),
        credits_text: optionalText(course.credits_text),
        semester: optionalText(course.semester),
        knowledge_block: optionalText(course.knowledge_block),
        course_type: optionalText(course.course_type),
        managing_unit: optionalText(course.managing_unit),
        translations: Object.fromEntries(
          Object.entries(course.translations)
            .filter(([, value]) => value.name.trim())
            .map(([locale, value]) => [locale, { name: value.name.trim() }]),
        ),
      })),
    })),
  }
}

function validateProfile(profile: ProgramAcademicProfileInput): string | null {
  if (!profile.versions.length) return 'Cần có ít nhất một phiên bản chương trình.'
  const years = profile.versions.map((version) => version.version_year)
  if (new Set(years).size !== years.length) return 'Năm phiên bản không được trùng nhau.'
  if (profile.versions.filter((version) => version.is_current).length > 1) {
    return 'Chỉ được chọn một phiên bản đang áp dụng.'
  }
  for (const version of profile.versions) {
    if (!version.translations.vi?.title.trim()) {
      return `Phiên bản ${version.version_year} chưa có tiêu đề tiếng Việt.`
    }
    if (version.documents.some((document) => !document.translations.vi?.title.trim())) {
      return `Phiên bản ${version.version_year} có tài liệu chưa nhập tiêu đề tiếng Việt.`
    }
    if (
      version.outcomes.some(
        (outcome) => !outcome.code.trim() || !outcome.translations.vi?.content.trim(),
      )
    ) {
      return `Phiên bản ${version.version_year} có mục tiêu hoặc chuẩn đầu ra chưa đầy đủ.`
    }
    if (version.courses.some((course) => !course.translations.vi?.name.trim())) {
      return `Phiên bản ${version.version_year} có dòng học phần chưa nhập tên tiếng Việt.`
    }
  }
  return null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function LanguageTextarea({
  label,
  locale,
  value,
  onChange,
  rows = 4,
}: {
  label: string
  locale: 'vi' | 'en'
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <Field label={`${label} · ${locale.toUpperCase()}`}>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} />
    </Field>
  )
}

function GeneralEditor({ program, onChange }: { program: Program; onChange: (value: Program) => void }) {
  const updateTranslation = (
    locale: 'vi' | 'en',
    field: keyof ProgramTranslation,
    value: string,
  ) => {
    const current = program.translations[locale] ?? { name: '' }
    onChange({
      ...program,
      translations: {
        ...program.translations,
        [locale]: { ...current, [field]: value },
      },
    })
  }

  return (
    <section className="space-y-7">
      <div>
        <h2 className="text-lg font-semibold">Thông tin chung</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin nhận diện và trạng thái công bố của chương trình.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Mã ngành">
          <Input value={program.code ?? ''} onChange={(e) => onChange({ ...program, code: e.target.value })} />
        </Field>
        <Field label="Trình độ">
          <select
            value={program.degree_level}
            onChange={(e) => onChange({ ...program, degree_level: e.target.value })}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="bachelor">Đại học</option>
            <option value="master">Thạc sĩ</option>
            <option value="doctorate">Tiến sĩ</option>
          </select>
        </Field>
        <Field label="Thời gian đào tạo (năm)">
          <Input
            type="number"
            min="0"
            step="0.5"
            value={program.duration_years ?? ''}
            onChange={(e) => onChange({ ...program, duration_years: numberOrNull(e.target.value) })}
          />
        </Field>
        <Field label="Hình thức đào tạo">
          <Input
            value={program.training_mode ?? ''}
            onChange={(e) => onChange({ ...program, training_mode: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {(['vi', 'en'] as const).map((locale) => (
          <div key={locale} className="space-y-4 border-l-2 border-primary/30 pl-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Languages className="size-4 text-primary" />
              {locale === 'vi' ? 'Tiếng Việt' : 'English'}
            </div>
            <Field label="Tên chương trình">
              <Input
                value={program.translations[locale]?.name ?? ''}
                onChange={(e) => updateTranslation(locale, 'name', e.target.value)}
              />
            </Field>
            <Field label="Đường dẫn">
              <Input
                value={program.translations[locale]?.slug ?? ''}
                onChange={(e) => updateTranslation(locale, 'slug', e.target.value)}
              />
            </Field>
            <LanguageTextarea
              label="Mô tả ngắn"
              locale={locale}
              value={program.translations[locale]?.short_description ?? ''}
              onChange={(value) => updateTranslation(locale, 'short_description', value)}
              rows={3}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-4 border-t pt-5 sm:grid-cols-3">
        <Field label="Thứ tự hiển thị">
          <Input
            type="number"
            value={program.sort_order}
            onChange={(e) => onChange({ ...program, sort_order: Number(e.target.value) })}
          />
        </Field>
        <label className="flex h-16 items-center justify-between rounded-md border px-4">
          <span>
            <span className="block text-sm font-medium">Hoạt động</span>
            <span className="text-xs text-muted-foreground">Cho phép sử dụng chương trình</span>
          </span>
          <Switch checked={program.is_active} onCheckedChange={(value) => onChange({ ...program, is_active: value })} />
        </label>
        <label className="flex h-16 items-center justify-between rounded-md border px-4">
          <span>
            <span className="block text-sm font-medium">Công bố</span>
            <span className="text-xs text-muted-foreground">Hiển thị trên trang người dùng</span>
          </span>
          <Switch checked={program.is_published} onCheckedChange={(value) => onChange({ ...program, is_published: value })} />
        </label>
      </div>
    </section>
  )
}

function AcademicEditor({
  profile,
  onChange,
}: {
  profile: ProgramAcademicProfileInput
  onChange: (value: ProgramAcademicProfileInput) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [section, setSection] = useState<EditorSection>('overview')
  const [courseSearch, setCourseSearch] = useState('')
  const activeIndex = Math.min(selectedIndex, Math.max(0, profile.versions.length - 1))
  const version = profile.versions[activeIndex]

  const updateVersion = (value: ProgramVersionInput) => {
    onChange({
      versions: profile.versions.map((item, index) => (index === activeIndex ? value : item)),
    })
  }

  const addVersion = () => {
    const latestYear = Math.max(new Date().getFullYear(), ...profile.versions.map((item) => item.version_year + 1))
    onChange({ versions: [...profile.versions, newVersion(latestYear)] })
    setSelectedIndex(profile.versions.length)
    setSection('overview')
  }

  const removeVersion = () => {
    if (!version || !window.confirm(`Xóa phiên bản ${version.version_year}?`)) return
    onChange({ versions: profile.versions.filter((_, index) => index !== activeIndex) })
    setSelectedIndex(Math.max(0, activeIndex - 1))
  }

  if (!version) {
    return (
      <div className="py-16 text-center">
        <BookOpen className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-medium">Chưa có phiên bản chương trình</p>
        <Button className="mt-4" onClick={addVersion}>
          <Plus /> Thêm phiên bản đầu tiên
        </Button>
      </div>
    )
  }

  const updateVersionTranslation = (
    locale: 'vi' | 'en',
    field: 'title' | 'summary' | 'general_objective' | 'career_opportunities',
    value: string,
  ) => {
    const current = version.translations[locale] ?? { title: '' }
    updateVersion({
      ...version,
      translations: { ...version.translations, [locale]: { ...current, [field]: value } },
    })
  }

  const setCurrent = (checked: boolean) => {
    onChange({
      versions: profile.versions.map((item, index) => ({
        ...item,
        is_current: index === activeIndex ? checked : checked ? false : item.is_current,
      })),
    })
  }

  const sections: { id: EditorSection; label: string; icon: typeof FileText; count?: number }[] = [
    { id: 'overview', label: 'Tổng quan', icon: GraduationCap },
    { id: 'documents', label: 'Tài liệu', icon: FileText, count: version.documents.length },
    { id: 'outcomes', label: 'PO / PLO', icon: ListChecks, count: version.outcomes.length },
    { id: 'courses', label: 'Khung học phần', icon: BookOpen, count: version.courses.length },
  ]

  const filteredCourses = version.courses
    .map((course, index) => ({ course, index }))
    .filter(({ course }) => {
      const query = courseSearch.trim().toLocaleLowerCase()
      if (!query) return true
      return `${course.course_code ?? ''} ${course.translations.vi?.name ?? ''}`
        .toLocaleLowerCase()
        .includes(query)
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="space-y-3 lg:sticky lg:top-0 lg:self-start">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Phiên bản</p>
          <Button size="icon-xs" variant="ghost" onClick={addVersion} title="Thêm phiên bản">
            <Plus />
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col">
          {profile.versions.map((item, index) => (
            <button
              key={`${item.version_year}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'min-w-36 rounded-md border px-3 py-2 text-left transition-colors lg:min-w-0',
                index === activeIndex
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted',
              )}
            >
              <span className="block text-sm font-semibold">{item.version_year} · {item.cohort_code || 'Chưa có khóa'}</span>
              <span className={cn('mt-0.5 block text-xs', index === activeIndex ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                {item.is_current ? 'Đang áp dụng' : item.is_published ? 'Đã công bố' : 'Bản nháp'}
              </span>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={addVersion}>
          <Plus /> Thêm phiên bản
        </Button>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Hồ sơ học thuật</p>
            <h2 className="mt-1 text-xl font-bold">Phiên bản {version.version_year}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={removeVersion} className="text-destructive hover:text-destructive">
            <Trash2 /> Xóa phiên bản
          </Button>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto border-b">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium',
                section === item.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {item.count !== undefined && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        {section === 'overview' && (
          <div className="space-y-7 py-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Năm phiên bản">
                <Input type="number" value={version.version_year} onChange={(e) => updateVersion({ ...version, version_year: Number(e.target.value) })} />
              </Field>
              <Field label="Khóa áp dụng">
                <Input value={version.cohort_code ?? ''} onChange={(e) => updateVersion({ ...version, cohort_code: e.target.value })} />
              </Field>
              <Field label="Tổng tín chỉ">
                <Input type="number" min="0" step="0.5" value={version.total_credits ?? ''} onChange={(e) => updateVersion({ ...version, total_credits: numberOrNull(e.target.value) })} />
              </Field>
              <Field label="Thứ tự">
                <Input type="number" value={version.sort_order} onChange={(e) => updateVersion({ ...version, sort_order: Number(e.target.value) })} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex h-16 items-center justify-between rounded-md border px-4">
                <span><span className="block text-sm font-medium">Đang áp dụng</span><span className="text-xs text-muted-foreground">Tự bỏ chọn phiên bản khác</span></span>
                <Switch checked={version.is_current} onCheckedChange={setCurrent} />
              </label>
              <label className="flex h-16 items-center justify-between rounded-md border px-4">
                <span><span className="block text-sm font-medium">Công bố phiên bản</span><span className="text-xs text-muted-foreground">Cho phép hiển thị ngoài website</span></span>
                <Switch checked={version.is_published} onCheckedChange={(value) => updateVersion({ ...version, is_published: value })} />
              </label>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {(['vi', 'en'] as const).map((locale) => (
                <div key={locale} className="space-y-4 border-l-2 border-primary/30 pl-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Languages className="size-4 text-primary" />{locale === 'vi' ? 'Tiếng Việt' : 'English'}</p>
                  <Field label="Tiêu đề phiên bản">
                    <Input value={version.translations[locale]?.title ?? ''} onChange={(e) => updateVersionTranslation(locale, 'title', e.target.value)} />
                  </Field>
                  <LanguageTextarea label="Tóm tắt" locale={locale} value={version.translations[locale]?.summary ?? ''} onChange={(value) => updateVersionTranslation(locale, 'summary', value)} rows={3} />
                  <LanguageTextarea label="Mục tiêu chung" locale={locale} value={version.translations[locale]?.general_objective ?? ''} onChange={(value) => updateVersionTranslation(locale, 'general_objective', value)} rows={6} />
                  <LanguageTextarea label="Cơ hội nghề nghiệp" locale={locale} value={version.translations[locale]?.career_opportunities ?? ''} onChange={(value) => updateVersionTranslation(locale, 'career_opportunities', value)} rows={8} />
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'documents' && (
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold">Tài liệu chính thức</h3><p className="text-sm text-muted-foreground">Liên kết PDF, số trang và dung lượng hiển thị.</p></div>
              <Button size="sm" onClick={() => updateVersion({ ...version, documents: [...version.documents, newDocument(version.documents.length)] })}><Plus /> Thêm tài liệu</Button>
            </div>
            <div className="mt-5 divide-y rounded-md border">
              {version.documents.map((document, index) => {
                const update = (patch: Partial<ProgramDocumentInput>) => updateVersion({ ...version, documents: version.documents.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
                const updateTitle = (locale: 'vi' | 'en', value: string) => update({ translations: { ...document.translations, [locale]: { ...(document.translations[locale] ?? { title: '' }), title: value } } })
                return (
                  <article key={index} className="space-y-4 p-4">
                    <div className="flex items-center justify-between"><p className="font-medium">Tài liệu {index + 1}</p><Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => updateVersion({ ...version, documents: version.documents.filter((_, itemIndex) => itemIndex !== index) })} title="Xóa tài liệu"><Trash2 /><span className="sr-only">Xóa tài liệu</span></Button></div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Loại tài liệu"><select value={document.document_type} onChange={(e) => update({ document_type: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="program_specification">Bản mô tả</option><option value="curriculum_and_syllabi">Chương trình và đề cương</option><option value="curriculum">Khung chương trình</option><option value="other">Khác</option></select></Field>
                      <Field label="Số trang"><Input type="number" min="0" value={document.page_count ?? ''} onChange={(e) => update({ page_count: numberOrNull(e.target.value) })} /></Field>
                      <Field label="Dung lượng (byte)"><Input type="number" min="0" value={document.file_size ?? ''} onChange={(e) => update({ file_size: numberOrNull(e.target.value) })} /></Field>
                      <Field label="Thứ tự"><Input type="number" value={document.sort_order} onChange={(e) => update({ sort_order: Number(e.target.value) })} /></Field>
                    </div>
                    <Field label="Đường dẫn PDF"><Input type="url" value={document.source_url ?? ''} onChange={(e) => update({ source_url: e.target.value })} /></Field>
                    <div className="grid gap-4 md:grid-cols-2"><Field label="Tiêu đề · VI"><Input value={document.translations.vi?.title ?? ''} onChange={(e) => updateTitle('vi', e.target.value)} /></Field><Field label="Title · EN"><Input value={document.translations.en?.title ?? ''} onChange={(e) => updateTitle('en', e.target.value)} /></Field></div>
                  </article>
                )
              })}
              {!version.documents.length && <p className="p-10 text-center text-sm text-muted-foreground">Chưa có tài liệu.</p>}
            </div>
          </div>
        )}

        {section === 'outcomes' && (
          <div className="py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-semibold">Mục tiêu và chuẩn đầu ra</h3><p className="text-sm text-muted-foreground">PO là mục tiêu cụ thể; PLO là chuẩn đầu ra chương trình.</p></div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => updateVersion({ ...version, outcomes: [...version.outcomes, newOutcome('objective', version.outcomes.length)] })}><Plus /> Thêm PO</Button><Button size="sm" onClick={() => updateVersion({ ...version, outcomes: [...version.outcomes, newOutcome('learning_outcome', version.outcomes.length)] })}><Plus /> Thêm PLO</Button></div>
            </div>
            <div className="mt-5 divide-y rounded-md border">
              {version.outcomes.map((outcome, index) => {
                const update = (patch: Partial<ProgramOutcomeInput>) => updateVersion({ ...version, outcomes: version.outcomes.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
                const updateContent = (locale: 'vi' | 'en', value: string) => update({ translations: { ...outcome.translations, [locale]: { content: value } } })
                return (
                  <article key={index} className="grid gap-3 p-4 lg:grid-cols-[100px_160px_minmax(0,1fr)_minmax(0,1fr)_36px]">
                    <Field label="Mã"><Input value={outcome.code} onChange={(e) => update({ code: e.target.value })} /></Field>
                    <Field label="Loại"><select value={outcome.outcome_type} onChange={(e) => update({ outcome_type: e.target.value as ProgramOutcomeInput['outcome_type'] })} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="objective">Mục tiêu (PO)</option><option value="learning_outcome">Chuẩn đầu ra (PLO)</option></select></Field>
                    <LanguageTextarea label="Nội dung" locale="vi" value={outcome.translations.vi?.content ?? ''} onChange={(value) => updateContent('vi', value)} rows={3} />
                    <LanguageTextarea label="Content" locale="en" value={outcome.translations.en?.content ?? ''} onChange={(value) => updateContent('en', value)} rows={3} />
                    <Button variant="ghost" size="icon-sm" className="mt-6 text-destructive" onClick={() => updateVersion({ ...version, outcomes: version.outcomes.filter((_, itemIndex) => itemIndex !== index) })} title="Xóa mục"><Trash2 /><span className="sr-only">Xóa mục</span></Button>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {section === 'courses' && (
          <div className="py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><h3 className="font-semibold">Khung chương trình đào tạo</h3><p className="text-sm text-muted-foreground">Chỉnh trực tiếp từng dòng học phần hoặc tiêu đề nhóm.</p></div>
              <Button size="sm" onClick={() => updateVersion({ ...version, courses: [...version.courses, newCourse(version.courses.length)] })}><Plus /> Thêm dòng</Button>
            </div>
            <label className="relative mt-5 block max-w-md"><span className="sr-only">Tìm học phần</span><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên học phần" className="pl-9" /></label>
            <div className="mt-4 overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1460px] text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="w-24 px-2 py-2">Mã HP</th><th className="w-80 px-2 py-2">Tên học phần · VI</th><th className="w-72 px-2 py-2">Course name · EN</th><th className="w-32 px-2 py-2">Loại dòng</th><th className="w-20 px-2 py-2">TC</th><th className="w-20 px-2 py-2">TC chữ</th><th className="w-20 px-2 py-2">HK</th><th className="w-28 px-2 py-2">Khối</th><th className="w-28 px-2 py-2">Loại HP</th><th className="w-32 px-2 py-2">Đơn vị</th><th className="w-12 px-2 py-2"></th></tr></thead>
                <tbody className="divide-y">
                  {filteredCourses.map(({ course, index }) => {
                    const update = (patch: Partial<ProgramCourseInput>) => updateVersion({ ...version, courses: version.courses.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
                    const updateName = (locale: 'vi' | 'en', value: string) => update({ translations: { ...course.translations, [locale]: { name: value } } })
                    const inputClass = 'h-8 rounded border bg-background px-2 text-xs'
                    return (
                      <tr key={index} className="hover:bg-muted/20">
                        <td className="p-1.5"><input value={course.course_code ?? ''} onChange={(e) => update({ course_code: e.target.value })} className={cn(inputClass, 'w-full font-mono')} /></td>
                        <td className="p-1.5"><input value={course.translations.vi?.name ?? ''} onChange={(e) => updateName('vi', e.target.value)} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><input value={course.translations.en?.name ?? ''} onChange={(e) => updateName('en', e.target.value)} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><select value={course.row_type} onChange={(e) => update({ row_type: e.target.value as ProgramCourseInput['row_type'] })} className={cn(inputClass, 'w-full')}><option value="course">Học phần</option><option value="group">Nhóm</option><option value="placeholder">Tự chọn</option><option value="summary">Tổng</option></select></td>
                        <td className="p-1.5"><input type="number" min="0" step="0.5" value={course.credits ?? ''} onChange={(e) => update({ credits: numberOrNull(e.target.value) })} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><input value={course.credits_text ?? ''} onChange={(e) => update({ credits_text: e.target.value })} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><input value={course.semester ?? ''} onChange={(e) => update({ semester: e.target.value })} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><input value={course.knowledge_block ?? ''} onChange={(e) => update({ knowledge_block: e.target.value })} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><input value={course.course_type ?? ''} onChange={(e) => update({ course_type: e.target.value })} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><input value={course.managing_unit ?? ''} onChange={(e) => update({ managing_unit: e.target.value })} className={cn(inputClass, 'w-full')} /></td>
                        <td className="p-1.5"><Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => updateVersion({ ...version, courses: version.courses.filter((_, itemIndex) => itemIndex !== index) })} title="Xóa dòng"><Trash2 /><span className="sr-only">Xóa dòng</span></Button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!filteredCourses.length && <p className="p-10 text-center text-sm text-muted-foreground">Không có dòng học phần phù hợp.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgramEditWorkspace({
  id,
  initialProgram,
  initialProfile,
}: {
  id: string
  initialProgram: Program
  initialProfile: ProgramAcademicProfileInput
}) {
  const queryClient = useQueryClient()
  const [mainSection, setMainSection] = useState<MainSection>('academic')
  const [programDraft, setProgramDraft] = useState(initialProgram)
  const [profileDraft, setProfileDraft] = useState(initialProfile)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const error = validateProfile(profileDraft)
      if (error) throw new Error(error)
      const translations = Object.fromEntries(
        Object.entries(programDraft.translations)
          .filter(([, value]) => value.name.trim())
          .map(([locale, value]) => [locale, { ...value, name: value.name.trim(), slug: optionalText(value.slug), short_description: optionalText(value.short_description), description: optionalText(value.description), career_opportunities: optionalText(value.career_opportunities), admissions_info: optionalText(value.admissions_info) }]),
      )
      await programService.update(id, {
        code: optionalText(programDraft.code),
        degree_level: programDraft.degree_level,
        duration_years: programDraft.duration_years,
        training_mode: optionalText(programDraft.training_mode),
        sort_order: programDraft.sort_order,
        is_active: programDraft.is_active,
        is_published: programDraft.is_published,
        translations,
      })
      return programService.updateAcademicProfile(id, cleanProfile(profileDraft))
    },
    onSuccess: () => {
      toast.success('Đã lưu dữ liệu chương trình đào tạo')
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['program', id] })
      queryClient.invalidateQueries({ queryKey: ['program-academic-profile', id] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu dữ liệu'),
  })

  const title = programDraft.translations.vi?.name || programDraft.name || 'Chương trình đào tạo'

  const stats = useMemo(() => {
    const versions = profileDraft.versions
    return {
      versions: versions.length,
      documents: versions.reduce((sum, item) => sum + item.documents.length, 0),
      outcomes: versions.reduce((sum, item) => sum + item.outcomes.length, 0),
      courses: versions.reduce((sum, item) => sum + item.courses.length, 0),
    }
  }, [profileDraft])

  return (
    <div className="min-w-0 space-y-6">
      <header className="border-b pb-5">
        <div className="min-w-0">
          <Link to="/programs" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Danh sách chương trình</Link>
          <div className="flex items-center gap-2"><GraduationCap className="size-6 shrink-0 text-primary" /><h1 className="truncate text-2xl font-bold">{title}</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">Mã ngành {programDraft.code || 'chưa cập nhật'} · {stats.versions} phiên bản · {stats.documents} tài liệu · {stats.outcomes} PO/PLO · {stats.courses} dòng học phần</p>
        </div>
      </header>

      <div className="flex gap-1 border-b">
        <button type="button" onClick={() => setMainSection('general')} className={cn('flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium', mainSection === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}><GraduationCap className="size-4" />Thông tin chung</button>
        <button type="button" onClick={() => setMainSection('academic')} className={cn('flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium', mainSection === 'academic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}><BookOpen className="size-4" />Hồ sơ học thuật</button>
      </div>

      {mainSection === 'general' ? <GeneralEditor program={programDraft} onChange={setProgramDraft} /> : <AcademicEditor profile={profileDraft} onChange={setProfileDraft} />}

      <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-background/95 py-3 backdrop-blur">
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Check className="size-4 text-emerald-600" />Lưu sẽ cập nhật dữ liệu hiển thị trên website.</span>
        <Button className="ml-auto" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save />{saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
      </div>
    </div>
  )
}

export function ProgramEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const programQuery = useQuery({
    queryKey: ['program', id],
    queryFn: () => programService.get(id),
    enabled: Boolean(id),
  })
  const profileQuery = useQuery({
    queryKey: ['program-academic-profile', id],
    queryFn: () => programService.getAcademicProfile(id),
    enabled: Boolean(id),
  })

  if (programQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Đang tải hồ sơ chương trình...
      </div>
    )
  }
  if (programQuery.isError || profileQuery.isError || !programQuery.data || !profileQuery.data) {
    return (
      <div className="py-24 text-center">
        <p className="font-medium text-destructive">Không thể tải hồ sơ chương trình.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/programs')}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <ProgramEditWorkspace
      id={id}
      initialProgram={programQuery.data}
      initialProfile={profileQuery.data}
    />
  )
}
