import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { httpClient } from '@/services/http/client'
import { categoryService } from '../services/categoryService'
import type { CategoryStatus } from '../types'
import { useAuth } from '@/app/providers/AuthProvider'

export interface TranslationFormState {
  name: string
  slug: string
  description: string
  seo_title: string
  seo_description: string
}

export interface FormState {
  parent_id: string | null
  status: CategoryStatus
  is_visible: boolean
  thumbnail_id: string | null
  is_weekly_schedule: boolean
  sort_order: number
  translations: {
    vi: TranslationFormState
    en: TranslationFormState
  }
}

export const INITIAL_TRANSLATION: TranslationFormState = {
  name: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
}

export const INITIAL_FORM: FormState = {
  parent_id: null,
  status: 'ACTIVE',
  is_visible: true,
  thumbnail_id: null,
  is_weekly_schedule: false,
  sort_order: 0,
  translations: {
    vi: { ...INITIAL_TRANSLATION },
    en: { ...INITIAL_TRANSLATION },
  }
}

// Helper sinh slug chuẩn SEO
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z\u0e80-\u0eff-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper parse translations an toàn
export const parseTranslations = (rawTranslations: any) => {
  const result = {
    vi: { ...INITIAL_TRANSLATION },
    en: { ...INITIAL_TRANSLATION },
  }

  if (!rawTranslations) return result

  if (Array.isArray(rawTranslations)) {
    rawTranslations.forEach((item: any) => {
      const code = item.language_code || item.language?.code
      if (code === 'vi' || code === 'en') {
        result[code as 'vi' | 'en'] = {
          name: item.name || '',
          slug: item.slug || '',
          description: item.description || '',
          seo_title: item.seo_title || '',
          seo_description: item.seo_description || '',
        }
      }
    })
  } else if (typeof rawTranslations === 'object') {
    ;['vi', 'en'].forEach((code) => {
      const item = rawTranslations[code]
      if (item) {
        result[code as 'vi' | 'en'] = {
          name: item.name || '',
          slug: item.slug || '',
          description: item.description || '',
          seo_title: item.seo_title || '',
          seo_description: item.seo_description || '',
        }
      }
    })
  }

  return result
}

interface UseCategoryFormProps {
  mode: 'create' | 'edit'
  selectedCategoryId: string
  createParentId: string | null
  refetchTree: () => void
  onSelectCreatedItem: (id: string) => void
}

export function useCategoryForm({
  mode,
  selectedCategoryId,
  createParentId,
  refetchTree,
  onSelectCreatedItem,
}: UseCategoryFormProps) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('category.update')
  const canCreate = hasPermission('category.create')

  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    parent_id: mode === 'create' ? createParentId : null
  })
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  // Lấy chi tiết category (chỉ ở chế độ edit)
  const { data: categoryDetail, isLoading: isLoadingDetail, isError } = useQuery({
    queryKey: ['category-detail', selectedCategoryId],
    queryFn: () => categoryService.getCategory(selectedCategoryId),
    enabled: mode === 'edit' && !!selectedCategoryId,
  })

  // Đổ dữ liệu khi mở Edit
  useEffect(() => {
    if (mode === 'edit' && categoryDetail) {
      const parsed = parseTranslations(categoryDetail.translations)
      
      // Fallback
      if (!parsed.vi.name && categoryDetail.name) parsed.vi.name = categoryDetail.name
      if (!parsed.vi.slug && categoryDetail.slug) parsed.vi.slug = categoryDetail.slug
      if (!parsed.vi.description && categoryDetail.description) parsed.vi.description = categoryDetail.description

      // Tự động điền fallback SEO nếu trống
      ;['vi', 'en'].forEach((code) => {
        const lang = code as 'vi' | 'en'
        if (!parsed[lang].seo_title && parsed[lang].name) {
          parsed[lang].seo_title = parsed[lang].name.substring(0, 60)
        }
        if (!parsed[lang].seo_description && parsed[lang].description) {
          parsed[lang].seo_description = parsed[lang].description.substring(0, 160)
        }
      })

      setForm({
        parent_id: categoryDetail.parent_id,
        status: ((categoryDetail.status || 'ACTIVE').toUpperCase() as CategoryStatus) || 'ACTIVE',
        is_visible: categoryDetail.is_visible !== false,
        thumbnail_id: categoryDetail.thumbnail_id || null,
        is_weekly_schedule: categoryDetail.is_weekly_schedule === true,
        sort_order: categoryDetail.sort_order || 0,
        translations: parsed
      })

      setShowValidationErrors(false)
    } else if (mode === 'create') {
      setForm({
        ...INITIAL_FORM,
        parent_id: createParentId
      })
      setShowValidationErrors(false)
    }
  }, [categoryDetail, mode, createParentId])

  // Cập nhật trường dùng chung
  const handleFieldChange = useCallback(
    (field: keyof FormState, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Cập nhật trường dịch thuật và tự sinh slug/seo
  const handleTranslationChange = useCallback(
    (lang: 'vi' | 'en', field: keyof TranslationFormState, value: string) => {
      setForm((prev) => {
        const nextTrans = prev.translations ? { ...prev.translations } : {
          vi: { ...INITIAL_TRANSLATION },
          en: { ...INITIAL_TRANSLATION },
        }
        nextTrans[lang] = { ...nextTrans[lang], [field]: value }

        // Sinh slug
        if (field === 'name') {
          nextTrans[lang].slug = slugify(value)
          // Sinh seo_title mặc định (luôn đồng bộ và cắt 60 ký tự)
          nextTrans[lang].seo_title = value.substring(0, 60)
        }

        // Sinh seo_description mặc định (luôn đồng bộ và cắt 160 ký tự)
        if (field === 'description') {
          nextTrans[lang].seo_description = value.substring(0, 160)
        }

        return { ...prev, translations: nextTrans }
      })
    },
    []
  )

  // Nút dịch thủ công (Dịch tự động)
  const handleAutoTranslate = async () => {
    const textToTranslate = form.translations?.vi?.name?.trim() || ''
    const descToTranslate = form.translations?.vi?.description?.trim() || ''
    if (!textToTranslate) {
      toast.error('Vui lòng nhập Tên danh mục Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslating(true)
    try {
      // 1. Dịch Tên (Tăng timeout lên 60s tránh phản hồi chậm của AI dịch thuật)
      const nameRes = await httpClient.post<Record<string, string>>('/translation', {
        text: textToTranslate,
        target_languages: ['en'],
        context: 'category_name'
      }, {
        timeout: 60000
      })
      const nameTranslations = nameRes.data

      // 2. Dịch Mô tả (Chỉ call API dịch khi có dữ liệu)
      let descTranslations: Record<string, string> = {}
      if (descToTranslate) {
        const descRes = await httpClient.post<Record<string, string>>('/translation', {
          text: descToTranslate,
          target_languages: ['en'],
          context: 'short_description'
        }, {
          timeout: 60000
        })
        descTranslations = descRes.data
      }

      setForm((prev) => {
        const nextTrans = prev.translations ? { ...prev.translations } : {
          vi: { ...INITIAL_TRANSLATION },
          en: { ...INITIAL_TRANSLATION },
        }

        nextTrans.en = { ...nextTrans.en }

        // Gán Tiếng Anh
        if (nameTranslations?.en) {
          nextTrans.en.name = nameTranslations.en
          nextTrans.en.slug = slugify(nameTranslations.en)
          nextTrans.en.seo_title = nameTranslations.en.substring(0, 60)
        }
        
        // Chỉ gán mô tả và seo_description khi có dữ liệu dịch
        if (descToTranslate && descTranslations?.en) {
          nextTrans.en.description = descTranslations.en
          nextTrans.en.seo_description = descTranslations.en.substring(0, 160)
        } else if (!descToTranslate) {
          nextTrans.en.description = ''
          nextTrans.en.seo_description = ''
        }

        return { ...prev, translations: nextTrans }
      })

      toast.success('Đã dịch tự động sang Tiếng Anh thành công!')
    } catch (err: any) {
      toast.error('Sinh bản dịch tự động thất bại.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Thumbnail Image handlers
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (form.thumbnail_id) {
        try {
          const res = await httpClient.get<{ url: string }>(`/admin/media/${form.thumbnail_id}/url`)
          setThumbnailUrl(res.data.url)
        } catch {
          setThumbnailUrl(null)
        }
      } else {
        setThumbnailUrl(null)
      }
    }
    fetchThumbnailUrl()
  }, [form.thumbnail_id])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingThumbnail(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await httpClient.post<{ id: string; name: string }>('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const urlRes = await httpClient.get<{ url: string }>(`/admin/media/${data.id}/url`)
      setForm((prev) => ({ ...prev, thumbnail_id: data.id }))
      setThumbnailUrl(urlRes.data.url)
      toast.success('Đã tải lên ảnh đại diện danh mục!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Tải ảnh lên thất bại')
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  const handleThumbnailRemove = () => {
    setForm((prev) => ({ ...prev, thumbnail_id: null }))
    setThumbnailUrl(null)
    toast.success('Đã gỡ bỏ hình ảnh đại diện.')
  }

  // Debounce check slug
  const [slugCheck, setSlugCheck] = useState<{
    isChecking: boolean
    exists: boolean
    suggested: string | null
  }>({
    isChecking: false,
    exists: false,
    suggested: null,
  })

  useEffect(() => {
    const currentSlug = form.translations?.[activeTab]?.slug
    if (!currentSlug || currentSlug.trim() === '') {
      setSlugCheck({ isChecking: false, exists: false, suggested: null })
      return
    }

    // So sánh với slug cũ trong cơ sở dữ liệu
    const parsedDetailTrans = categoryDetail ? parseTranslations(categoryDetail.translations) : null
    const oldSlug = parsedDetailTrans?.[activeTab]?.slug || (activeTab === 'vi' ? categoryDetail?.slug : '')
    if (oldSlug && currentSlug === oldSlug) {
      setSlugCheck({ isChecking: false, exists: false, suggested: null })
      return
    }

    setSlugCheck((prev) => ({ ...prev, isChecking: true }))

    const timer = setTimeout(async () => {
      try {
        const res = await categoryService.checkSlug(currentSlug, selectedCategoryId, activeTab)
        setSlugCheck({
          isChecking: false,
          exists: res.exists,
          suggested: res.exists ? res.suggested_slug : null,
        })
      } catch {
        setSlugCheck({ isChecking: false, exists: false, suggested: null })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [form.translations, activeTab, selectedCategoryId, categoryDetail])

  // Helper check tab có đầy đủ thông tin bắt buộc (name, slug) chưa
  const isTabComplete = useCallback((lang: 'vi' | 'en') => {
    const t = form.translations?.[lang]
    if (!t) return false
    return (
      !!t.name.trim() &&
      !!t.slug.trim()
    )
  }, [form.translations])

  // Helper check toàn bộ form đã hợp lệ chưa để active nút lưu
  const isFormValid = useCallback(() => {
    if (!isTabComplete('vi') || !isTabComplete('en')) {
      return false
    }
    // Bỏ chặn slugCheck.exists để người dùng bấm Lưu bình thường (vì Backend tự sinh hậu tố giải quyết trùng lặp)
    return true
  }, [isTabComplete])

  // Xử lý lỗi API
  const handleApiError = (error: any, defaultMsg: string) => {
    const errorCode = error?.response?.data?.error_code || error?.response?.data?.error?.code
    const errorMap: Record<string, string> = {
      CIRCULAR_REFERENCE: 'Không thể gán danh mục cha làm con của chính nó hoặc danh mục con của nó.',
      CATEGORY_HAS_CHILDREN: 'Không thể xóa danh mục này vì đang chứa danh mục con. Vui lòng xóa các danh mục con trước.',
      CATEGORY_NOT_FOUND: 'Danh mục không tồn tại hoặc đã bị xóa.',
      AI_BUDGET_EXCEEDED: 'Hạn mức AI tháng của hệ thống đã dùng hết.',
    }
    toast.error(errorMap[errorCode] || error?.response?.data?.message || error?.response?.data?.error?.message || defaultMsg)
  }

  // Mutation lưu (Update hoặc Create)
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        parent_id: form.parent_id,
        status: form.status,
        is_visible: form.is_visible,
        thumbnail_id: form.thumbnail_id,
        is_weekly_schedule: form.is_weekly_schedule,
        sort_order: form.sort_order, // Gửi sort_order ngầm
        translations: {
          vi: {
            name: form.translations?.vi?.name || '',
            slug: form.translations?.vi?.slug || '',
            description: form.translations?.vi?.description || '',
            seo_title: form.translations?.vi?.seo_title || (form.translations?.vi?.name || '').substring(0, 60),
            seo_description: form.translations?.vi?.seo_description || (form.translations?.vi?.description || '').substring(0, 160),
          },
          en: {
            name: form.translations?.en?.name || '',
            slug: form.translations?.en?.slug || '',
            description: form.translations?.en?.description || '',
            seo_title: form.translations?.en?.seo_title || (form.translations?.en?.name || '').substring(0, 60),
            seo_description: form.translations?.en?.seo_description || (form.translations?.en?.description || '').substring(0, 160),
          }
        }
      }

      if (mode === 'create') {
        return categoryService.createCategory(payload)
      } else {
        return categoryService.updateCategory(selectedCategoryId, payload)
      }
    },
    onSuccess: (resData) => {
      const displayTitle = resData.translations?.vi?.name || resData.name || 'Danh mục'
      if (mode === 'create') {
        toast.success(`Đã tạo thành công danh mục "${displayTitle}"!`)
        refetchTree()
        queryClient.invalidateQueries({ queryKey: ['category-tree'] })
        queryClient.invalidateQueries({ queryKey: ['categories-list'] })
        onSelectCreatedItem(resData.id) // Chuyển sang chế độ chỉnh sửa của item mới tạo
      } else {
        toast.success(`Đã cập nhật danh mục "${displayTitle}" thành công!`)
        refetchTree()
        queryClient.invalidateQueries({ queryKey: ['category-tree'] })
        queryClient.invalidateQueries({ queryKey: ['categories-list'] })
        queryClient.invalidateQueries({ queryKey: ['category-detail', selectedCategoryId] })
      }
    },
    onError: (error: any) => handleApiError(error, mode === 'create' ? 'Tạo danh mục thất bại.' : 'Cập nhật danh mục thất bại.'),
  })

  // Validation 2 ngôn ngữ nghiêm ngặt
  const validateForm = (): boolean => {
    setShowValidationErrors(true)
    
    // 1. Tiếng Việt
    if (!form.translations?.vi?.name?.trim()) {
      toast.error('Vui lòng nhập Tên danh mục ở Tiếng Việt 🇻🇳')
      setActiveTab('vi')
      return false
    }
    if (!form.translations?.vi?.slug?.trim()) {
      toast.error('Vui lòng nhập Slug ở Tiếng Việt 🇻🇳')
      setActiveTab('vi')
      return false
    }

    // 2. Tiếng Anh
    if (!form.translations?.en?.name?.trim()) {
      toast.error('Vui lòng nhập đầy đủ Tên cho Tiếng Anh 🇬🇧')
      setActiveTab('en')
      return false
    }
    if (!form.translations?.en?.slug?.trim()) {
      toast.error('Vui lòng nhập đầy đủ Slug cho Tiếng Anh 🇬🇧')
      setActiveTab('en')
      return false
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isTranslating) {
      toast.error('Vui lòng đợi quá trình dịch tự động hoàn thành.')
      return
    }

    if (!validateForm()) return

    if (mode === 'create' && !canCreate) {
      toast.error('Bạn không có quyền tạo mới danh mục.')
      return
    }
    if (mode === 'edit' && !canUpdate) {
      toast.error('Bạn không có quyền cập nhật danh mục.')
      return
    }

    saveMutation.mutate()
  }

  return {
    form,
    setForm,
    activeTab,
    setActiveTab,
    isTranslating,
    showValidationErrors,
    isLoadingDetail,
    isError,
    categoryDetail,
    handleFieldChange,
    handleTranslationChange,
    handleAutoTranslate,
    isUploadingThumbnail,
    thumbnailUrl,
    thumbnailInputRef,
    handleThumbnailUpload,
    handleThumbnailRemove,
    slugCheck,
    isTabComplete,
    isFormValid,
    handleSubmit,
    saveMutation,
  }
}
