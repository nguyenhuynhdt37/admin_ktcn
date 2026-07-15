export type TranslationMap<T> = Record<string, T>

export interface ProgramTranslation {
  name: string
  slug?: string | null
  short_description?: string | null
  description?: string | null
  career_opportunities?: string | null
  admissions_info?: string | null
}

export interface Program {
  id: string
  department_id: string
  code?: string | null
  degree_level: string
  duration_years?: number | null
  training_mode?: string | null
  thumbnail_object_key?: string | null
  sort_order: number
  is_active: boolean
  is_published: boolean
  name: string
  slug: string
  short_description?: string | null
  description?: string | null
  career_opportunities?: string | null
  admissions_info?: string | null
  translations: TranslationMap<ProgramTranslation>
}

export interface ProgramPagination {
  items: Program[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface VersionTranslation {
  title: string
  summary?: string | null
  general_objective?: string | null
  career_opportunities?: string | null
}

export interface DocumentTranslation {
  title: string
  description?: string | null
}

export interface OutcomeTranslation {
  content: string
}

export interface CourseTranslation {
  name: string
}

export interface ProgramDocumentInput {
  document_type: string
  source_url?: string | null
  object_key?: string | null
  mime_type?: string | null
  file_size?: number | null
  page_count?: number | null
  checksum_sha256?: string | null
  sort_order: number
  translations: TranslationMap<DocumentTranslation>
}

export interface ProgramOutcomeInput {
  code: string
  outcome_type: 'objective' | 'learning_outcome'
  parent_code?: string | null
  sort_order: number
  translations: TranslationMap<OutcomeTranslation>
}

export interface ProgramCourseInput {
  course_code?: string | null
  row_type: 'course' | 'group' | 'placeholder' | 'summary'
  credits?: number | null
  credits_text?: string | null
  semester?: string | null
  knowledge_block?: string | null
  course_type?: string | null
  managing_unit?: string | null
  sort_order: number
  translations: TranslationMap<CourseTranslation>
}

export interface ProgramVersionInput {
  version_year: number
  cohort_code?: string | null
  total_credits?: number | null
  is_current: boolean
  is_published: boolean
  sort_order: number
  translations: TranslationMap<VersionTranslation>
  documents: ProgramDocumentInput[]
  outcomes: ProgramOutcomeInput[]
  courses: ProgramCourseInput[]
}

export interface ProgramAcademicProfileInput {
  versions: ProgramVersionInput[]
}

export interface ProgramUpdatePayload {
  code?: string | null
  degree_level?: string
  duration_years?: number | null
  training_mode?: string | null
  sort_order?: number
  is_active?: boolean
  is_published?: boolean
  translations?: TranslationMap<ProgramTranslation>
}
