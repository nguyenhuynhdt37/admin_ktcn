import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { articleService } from '../services/articleService'
import { SEO_CONFIG } from '../constants'
import { generateSeoTitle, generateSeoDescription } from '@/shared/utils/seo'
import type { ArticleCreatePayload } from '../types/articles.types'
import { httpClient } from '@/services/http/client'

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '') // Bỏ ký tự đặc biệt
    .replace(/(\s+)/g, '-') // Đổi khoảng trắng thành -
    .replace(/-+/g, '-') // Bỏ - trùng lặp
    .replace(/^-+|-+$/g, '') // Bỏ - ở đầu/cuối
}

interface UseArticleFormProps {
  articleId?: string | null
  showDraftsFeature?: boolean
}

export function useArticleForm({ articleId, showDraftsFeature = true }: UseArticleFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // State quản lý ID bài viết hiện tại (có thể là bài mới đang lưu nháp)
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(articleId || null)
  const isEditMode = !!currentArticleId
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')

  // Trạng thái tự động dịch từng trường
  const [isTranslatingTitle, setIsTranslatingTitle] = useState(false)
  const [isTranslatingExcerpt, setIsTranslatingExcerpt] = useState(false)
  const [isTranslatingContent, setIsTranslatingContent] = useState(false)

  // Cờ đánh dấu người dùng đã chỉnh sửa thủ công (Manual Override) - Tiếng Việt
  const [isViSeoTitleOverridden, setIsViSeoTitleOverridden] = useState(false)
  const [isViSeoDescriptionOverridden, setIsViSeoDescriptionOverridden] = useState(false)

  // Cờ đánh dấu người dùng đã chỉnh sửa thủ công (Manual Override) - Tiếng Anh
  const [isEnSeoTitleOverridden, setIsEnSeoTitleOverridden] = useState(false)
  const [isEnSeoDescriptionOverridden, setIsEnSeoDescriptionOverridden] = useState(false)

  // Ref lưu giá trị ban đầu để so sánh sự thay đổi (isDirty)
  const initialValuesRef = useRef<any>(null)

  // --- STATE ĐA NGÔN NGỮ (VIỆT - ANH) ---
  // Tiếng Việt
  const [viTitle, setViTitle] = useState('')
  const [viSlug, setViSlug] = useState('')
  const [viExcerpt, setViExcerpt] = useState('')
  const [viContent, setViContent] = useState('')
  const [viSeoTitle, setViSeoTitle] = useState('')
  const [viSeoDescription, setViSeoDescription] = useState('')
  const [viCanonicalUrl, setViCanonicalUrl] = useState('')
  const [viRobots, setViRobots] = useState('index, follow')
  const [viOgTitle, setViOgTitle] = useState('')
  const [viOgDescription, setViOgDescription] = useState('')
  const [isCheckingViSlug, setIsCheckingViSlug] = useState(false)

  // Tiếng Anh
  const [enTitle, setEnTitle] = useState('')
  const [enSlug, setEnSlug] = useState('')
  const [enExcerpt, setEnExcerpt] = useState('')
  const [enContent, setEnContent] = useState('')
  const [enSeoTitle, setEnSeoTitle] = useState('')
  const [enSeoDescription, setEnSeoDescription] = useState('')
  const [enCanonicalUrl, setEnCanonicalUrl] = useState('')
  const [enRobots, setEnRobots] = useState('index, follow')
  const [enOgTitle, setEnOgTitle] = useState('')
  const [enOgDescription, setEnOgDescription] = useState('')
  const [isCheckingEnSlug, setIsCheckingEnSlug] = useState(false)

  // SEO Focus Keywords (chỉ lưu local để phân tích)
  const [viFocusKeyword, setViFocusKeyword] = useState('')
  const [enFocusKeyword, setEnFocusKeyword] = useState('')

  // --- HANDLER ĐỒNG BỘ CẤU HÌNH SEO EVENT-DRIVEN ---
  const handleSetViTitle = (val: string) => {
    setViTitle(val)
    if (!isViSeoTitleOverridden) {
      setViSeoTitle(generateSeoTitle(val))
    }
  }

  const handleSetEnTitle = (val: string) => {
    setEnTitle(val)
    if (!isEnSeoTitleOverridden) {
      setEnSeoTitle(generateSeoTitle(val))
    }
  }

  const handleSetViExcerpt = (val: string) => {
    setViExcerpt(val)
    if (!isViSeoDescriptionOverridden) {
      setViSeoDescription(generateSeoDescription(viContent, val))
    }
  }

  const handleSetViContent = (val: string) => {
    setViContent(val)
    if (!isViSeoDescriptionOverridden) {
      setViSeoDescription(generateSeoDescription(val, viExcerpt))
    }
  }

  const handleSetEnExcerpt = (val: string) => {
    setEnExcerpt(val)
    if (!isEnSeoDescriptionOverridden) {
      setEnSeoDescription(generateSeoDescription(enContent, val))
    }
  }

  const handleSetEnContent = (val: string) => {
    setEnContent(val)
    if (!isEnSeoDescriptionOverridden) {
      setEnSeoDescription(generateSeoDescription(val, enExcerpt))
    }
  }

  // --- CẤU HÌNH CHUNG ---
  const [categoryId, setCategoryId] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [status, setStatus] = useState<'PUBLISHED' | 'SCHEDULED'>('PUBLISHED')
  const [publishAt, setPublishAt] = useState('')
  const [expireAt, setExpireAt] = useState('')
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(null)
  const [coverKey, setCoverKey] = useState<string | null>(null)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Drafts Modal state & count query
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false)
  const { data: draftsCountData } = useQuery({
    queryKey: ['my-drafts-count'],
    queryFn: articleService.countMyDrafts,
  })
  const draftCount = draftsCountData?.count || 0

  // State lưu trữ các lỗi validation
  const [errors, setErrors] = useState<{
    vi?: { title?: string; content?: string }
    en?: { title?: string; content?: string }
    categoryId?: string
    publishAt?: string
    expireAt?: string
  }>({})

  // Fetch Categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: articleService.listCategories,
  })

  // Fetch Tags
  const { data: tags = [], isLoading: isTagsLoading } = useQuery({
    queryKey: ['tags', 'all'],
    queryFn: articleService.listTags,
  })

  // Fetch Article detail in Edit Mode
  const { data: articleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['articles', currentArticleId],
    queryFn: () => articleService.getDetail(currentArticleId!),
    enabled: isEditMode,
  })

  // Sync state with article detail in Edit Mode
  useEffect(() => {
    if (isEditMode && articleDetail) {
      // Bảo mật phía Frontend: Chặn chỉnh sửa nếu user hiện tại không phải tác giả của bài viết
      const authorId = articleDetail.author_id || articleDetail.author?.id
      if (user && authorId && authorId !== user.id) {
        toast.error('Bạn không có quyền chỉnh sửa bài viết của tác giả khác.')
        navigate('/articles')
        return
      }

      // Tiếng Việt
      const vi = articleDetail.translations?.vi || {}
      setViTitle(vi.title || '')
      setViSlug(vi.slug || '')
      setViExcerpt(vi.excerpt || '')
      setViContent(vi.content || '')
      
      let rawViSeoTitle = vi.seo_title || ''
      if (rawViSeoTitle.endsWith(SEO_CONFIG.SUFFIX)) {
        rawViSeoTitle = rawViSeoTitle.slice(0, -SEO_CONFIG.SUFFIX.length)
      }
      setViSeoTitle(rawViSeoTitle)
      setViSeoDescription(vi.seo_description || '')
      setViCanonicalUrl(vi.canonical_url || '')
      setViRobots(vi.robots || 'index, follow')
      setViOgTitle(vi.og_title || '')
      setViOgDescription(vi.og_description || '')

      // Tiếng Anh
      const en = articleDetail.translations?.en || {}
      setEnTitle(en.title || '')
      setEnSlug(en.slug || '')
      setEnExcerpt(en.excerpt || '')
      setEnContent(en.content || '')

      let rawEnSeoTitle = en.seo_title || ''
      if (rawEnSeoTitle.endsWith(SEO_CONFIG.SUFFIX)) {
        rawEnSeoTitle = rawEnSeoTitle.slice(0, -SEO_CONFIG.SUFFIX.length)
      }
      setEnSeoTitle(rawEnSeoTitle)
      setEnSeoDescription(en.seo_description || '')
      setEnCanonicalUrl(en.canonical_url || '')
      setEnRobots(en.robots || 'index, follow')
      setEnOgTitle(en.og_title || '')
      setEnOgDescription(en.og_description || '')

      // SEO Overridden Check
      const expectedViSeoTitle = generateSeoTitle(vi.title || '')
      const expectedViSeoDesc = generateSeoDescription(vi.content || '', vi.excerpt || '')
      setIsViSeoTitleOverridden(!!rawViSeoTitle && rawViSeoTitle.trim() !== expectedViSeoTitle.trim())
      setIsViSeoDescriptionOverridden(!!vi.seo_description && vi.seo_description.trim() !== expectedViSeoDesc.trim())

      const expectedEnSeoTitle = generateSeoTitle(en.title || '')
      const expectedEnSeoDesc = generateSeoDescription(en.content || '', en.excerpt || '')
      setIsEnSeoTitleOverridden(!!rawEnSeoTitle && rawEnSeoTitle.trim() !== expectedEnSeoTitle.trim())
      setIsEnSeoDescriptionOverridden(!!en.seo_description && en.seo_description.trim() !== expectedEnSeoDesc.trim())

      // Các trường chung
      setCategoryId(articleDetail.category_id || articleDetail.category?.id || '')
      setTagIds(articleDetail.tags?.map((t) => t.id) || [])
      
      const dbStatus = articleDetail.status
      if (dbStatus === 'SCHEDULED') {
        setStatus('SCHEDULED')
      } else {
        setStatus('PUBLISHED')
      }
      
      setPublishAt(
        articleDetail.publish_at
          ? dayjs(articleDetail.publish_at).format('YYYY-MM-DDTHH:mm')
          : ''
      )
      setExpireAt(
        articleDetail.expire_at
          ? dayjs(articleDetail.expire_at).format('YYYY-MM-DDTHH:mm')
          : ''
      )
      setThumbnailKey(articleDetail.thumbnail_object_key || null)
      setCoverKey(articleDetail.cover_object_key || null)
      setIsFeatured(articleDetail.is_featured)
      setIsPinned(articleDetail.is_pinned)

      // Lưu giá trị ban đầu sạch để so sánh độ thay đổi (isDirty)
      initialValuesRef.current = {
        viTitle: vi.title || '',
        viSlug: vi.slug || '',
        viExcerpt: vi.excerpt || '',
        viContent: vi.content || '',
        viSeoTitle: rawViSeoTitle,
        viSeoDescription: vi.seo_description || '',
        viCanonicalUrl: vi.canonical_url || '',
        viRobots: vi.robots || 'index, follow',
        viOgTitle: vi.og_title || '',
        viOgDescription: vi.og_description || '',

        enTitle: en.title || '',
        enSlug: en.slug || '',
        enExcerpt: en.excerpt || '',
        enContent: en.content || '',
        enSeoTitle: rawEnSeoTitle,
        enSeoDescription: en.seo_description || '',
        enCanonicalUrl: en.canonical_url || '',
        enRobots: en.robots || 'index, follow',
        enOgTitle: en.og_title || '',
        enOgDescription: en.og_description || '',

        categoryId: articleDetail.category_id || articleDetail.category?.id || '',
        tagIds: articleDetail.tags?.map((t) => t.id) || [],
        status: dbStatus === 'SCHEDULED' ? 'SCHEDULED' : 'PUBLISHED',
        publishAt: articleDetail.publish_at ? dayjs(articleDetail.publish_at).format('YYYY-MM-DDTHH:mm') : '',
        expireAt: articleDetail.expire_at ? dayjs(articleDetail.expire_at).format('YYYY-MM-DDTHH:mm') : '',
        thumbnailKey: articleDetail.thumbnail_object_key || null,
        coverKey: articleDetail.cover_object_key || null,
        isFeatured: articleDetail.is_featured,
        isPinned: articleDetail.is_pinned,
      }
    }
  }, [isEditMode, articleDetail])

  // Real-time Clear Errors
  useEffect(() => {
    if (viTitle.trim()) {
      setErrors((prev) => ({ ...prev, vi: { ...prev.vi, title: undefined } }))
    }
  }, [viTitle])

  useEffect(() => {
    if (categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: undefined }))
    }
  }, [categoryId])

  useEffect(() => {
    const cleanContent = viContent.replace(/<[^>]*>/g, '').trim()
    if (cleanContent) {
      setErrors((prev) => ({ ...prev, vi: { ...prev.vi, content: undefined } }))
    }
  }, [viContent])



  // Debounce check slug - Tiếng Việt
  useEffect(() => {
    const trimmedTitle = viTitle.trim()
    if (!trimmedTitle) {
      setViSlug('')
      return
    }

    const rawSlug = generateSlug(trimmedTitle)
    if (isEditMode && articleDetail?.translations?.vi && rawSlug === articleDetail.translations.vi.slug) {
      setViSlug(articleDetail.translations.vi.slug)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingViSlug(true)
      try {
        const res = await articleService.checkSlug(rawSlug)
        setViSlug(res.suggested_slug)
      } catch (err) {
        console.error(err)
        setViSlug(rawSlug)
      } finally {
        setIsCheckingViSlug(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [viTitle, isEditMode, articleDetail])

  // Debounce check slug - Tiếng Anh
  useEffect(() => {
    const trimmedTitle = enTitle.trim()
    if (!trimmedTitle) {
      setEnSlug('')
      return
    }

    const rawSlug = generateSlug(trimmedTitle)
    if (isEditMode && articleDetail?.translations?.en && rawSlug === articleDetail.translations.en.slug) {
      setEnSlug(articleDetail.translations.en.slug)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingEnSlug(true)
      try {
        const res = await articleService.checkSlug(rawSlug)
        setEnSlug(res.suggested_slug)
      } catch (err) {
        console.error(err)
        setEnSlug(rawSlug)
      } finally {
        setIsCheckingEnSlug(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [enTitle, isEditMode, articleDetail])

  // 1. Dịch Tiêu đề (viTitle -> enTitle)
  const handleTranslateTitle = async () => {
    if (!viTitle.trim()) {
      toast.error('Vui lòng nhập Tiêu đề bài viết Tiếng Việt trước khi dịch.')
      return
    }
    setIsTranslatingTitle(true)
    const translateToast = toast.loading('Đang dịch tiêu đề sang Tiếng Anh...')
    try {
      const res = await httpClient.post<Record<string, string>>('/translation', {
        text: viTitle,
        target_languages: ['en'],
        context: 'article_title'
      }, { timeout: 60000 })
      if (res.data?.en) {
        setEnTitle(res.data.en)
        toast.success('Dịch tiêu đề thành công!', { id: translateToast })
      } else {
        toast.error('Không nhận được bản dịch từ hệ thống.', { id: translateToast })
      }
    } catch (err) {
      console.error(err)
      toast.error('Dịch tiêu đề thất bại.', { id: translateToast })
    } finally {
      setIsTranslatingTitle(false)
    }
  }

  // 2. Dịch Tóm tắt ngắn (viExcerpt -> enExcerpt)
  const handleTranslateExcerpt = async () => {
    if (!viExcerpt.trim()) {
      toast.error('Vui lòng nhập Tóm tắt bài viết Tiếng Việt trước khi dịch.')
      return
    }
    setIsTranslatingExcerpt(true)
    const translateToast = toast.loading('Đang dịch tóm tắt ngắn sang Tiếng Anh...')
    try {
      const res = await httpClient.post<Record<string, string>>('/translation', {
        text: viExcerpt,
        target_languages: ['en'],
        context: 'article_summary'
      }, { timeout: 60000 })
      if (res.data?.en) {
        setEnExcerpt(res.data.en)
        toast.success('Dịch tóm tắt ngắn thành công!', { id: translateToast })
      } else {
        toast.error('Không nhận được bản dịch từ hệ thống.', { id: translateToast })
      }
    } catch (err) {
      console.error(err)
      toast.error('Dịch tóm tắt ngắn thất bại.', { id: translateToast })
    } finally {
      setIsTranslatingExcerpt(false)
    }
  }

  // 3. Dịch Nội dung (viContent -> enContent)
  const handleTranslateContent = async () => {
    const cleanViContent = viContent.replace(/<[^>]*>/g, '').trim()
    if (!cleanViContent) {
      toast.error('Vui lòng nhập Nội dung bài viết Tiếng Việt trước khi dịch.')
      return
    }
    setIsTranslatingContent(true)
    const translateToast = toast.loading('Đang dịch nội dung sang Tiếng Anh...')
    try {
      const res = await httpClient.post<Record<string, string>>('/translation/html', {
        html: viContent,
        target_languages: ['en'],
        context: 'article_content'
      }, { timeout: 60000 })
      if (res.data?.en) {
        setEnContent(res.data.en)
        toast.success('Dịch nội dung bài viết thành công!', { id: translateToast })
      } else {
        toast.error('Không nhận được bản dịch từ hệ thống.', { id: translateToast })
      }
    } catch (err) {
      console.error(err)
      toast.error('Dịch nội dung bài viết thất bại.', { id: translateToast })
    } finally {
      setIsTranslatingContent(false)
    }
  }

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: ArticleCreatePayload) => {
      if (currentArticleId) {
        return articleService.update(currentArticleId, payload)
      } else {
        return articleService.create(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article-stats'] })
      queryClient.invalidateQueries({ queryKey: ['my-drafts-count'] })
      queryClient.invalidateQueries({ queryKey: ['my-drafts'] })
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error?.message ||
          'Không thể lưu thông tin bài viết'
      )
    },
  })

  // Tạo nhanh thẻ tag mới khi đang viết bài
  const handleCreateTag = async (name: string) => {
    try {
      const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#FF9800', '#FF5722']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const newTag = await articleService.createTag({
        color: randomColor,
        is_active: true,
        translations: {
          vi: {
            name,
            slug: generateSlug(name),
            description: `Tạo nhanh từ bài viết`
          }
        }
      })

      queryClient.setQueryData(['tags', 'all'], (oldTags: any) => {
        const list = Array.isArray(oldTags) ? oldTags : []
        return [...list, newTag]
      })

      toast.success(`Đã tạo nhanh thẻ tag "${name}" thành công!`)
      const labelName = newTag.translations?.vi?.name || newTag.name || name
      return { id: newTag.id, label: labelName, color: newTag.color }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Không thể tạo nhanh thẻ tag mới.'
      toast.error(msg)
      throw err
    }
  }

  // Chọn bản nháp để edit tiếp
  const handleSelectDraft = (draftId: string) => {
    setIsDraftsModalOpen(false)
    setCurrentArticleId(draftId)
  }

  // Check form is dirty
  const isFormDirty = () => {
    if (!isEditMode) {
      return viTitle.trim().length > 0
    }
    if (!initialValuesRef.current) return false
    const init = initialValuesRef.current

    const isTagsChanged =
      init.tagIds.length !== tagIds.length ||
      !tagIds.every((id) => init.tagIds.includes(id))

    return (
      init.viTitle !== viTitle ||
      init.viSlug !== viSlug ||
      init.viExcerpt !== viExcerpt ||
      init.viContent !== viContent ||
      init.viSeoTitle !== viSeoTitle ||
      init.viSeoDescription !== viSeoDescription ||
      init.viCanonicalUrl !== viCanonicalUrl ||
      init.viRobots !== viRobots ||
      init.viOgTitle !== viOgTitle ||
      init.viOgDescription !== viOgDescription ||
      
      init.enTitle !== enTitle ||
      init.enSlug !== enSlug ||
      init.enExcerpt !== enExcerpt ||
      init.enContent !== enContent ||
      init.enSeoTitle !== enSeoTitle ||
      init.enSeoDescription !== enSeoDescription ||
      init.enCanonicalUrl !== enCanonicalUrl ||
      init.enRobots !== enRobots ||
      init.enOgTitle !== enOgTitle ||
      init.enOgDescription !== enOgDescription ||

      init.categoryId !== categoryId ||
      isTagsChanged ||
      init.status !== status ||
      init.publishAt !== publishAt ||
      init.expireAt !== expireAt ||
      init.thumbnailKey !== thumbnailKey ||
      init.coverKey !== coverKey ||
      init.isFeatured !== isFeatured ||
      init.isPinned !== isPinned
    )
  }

  // Validate form
  const validateForm = (showToast = false): boolean => {
    const newErrors: any = {}
    
    if (!viTitle.trim()) {
      newErrors.vi = { ...newErrors.vi, title: 'Tiêu đề tiếng Việt không được để trống' }
      if (showToast) toast.error('Tiêu đề bài viết Tiếng Việt không được để trống')
    }
    
    if (!categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục cho bài viết trước khi xuất bản'
      if (showToast) toast.error(newErrors.categoryId)
    }

    const cleanContent = viContent.replace(/<[^>]*>/g, '').trim()
    if (!cleanContent) {
      newErrors.vi = { ...newErrors.vi, content: 'Nội dung bài viết Tiếng Việt chưa được soạn thảo' }
      if (showToast) toast.error('Nội dung bài viết Tiếng Việt chưa được soạn thảo')
    }

    // Tiếng Anh (English validation)
    if (!enTitle.trim()) {
      newErrors.en = { ...newErrors.en, title: 'Tiêu đề tiếng Anh không được để trống' }
      if (showToast) toast.error('Tiêu đề bài viết Tiếng Anh không được để trống')
    }

    const cleanEnContent = enContent.replace(/<[^>]*>/g, '').trim()
    if (!cleanEnContent) {
      newErrors.en = { ...newErrors.en, content: 'Nội dung bài viết Tiếng Anh chưa được soạn thảo' }
      if (showToast) toast.error('Nội dung bài viết Tiếng Anh chưa được soạn thảo')
    }

    // Lên lịch xuất bản
    if (status === 'SCHEDULED') {
      if (!publishAt) {
        newErrors.publishAt = 'Vui lòng chọn thời gian lên lịch xuất bản'
        if (showToast) toast.error(newErrors.publishAt)
      } else {
        const selectedPublishTime = dayjs(publishAt)
        if (!selectedPublishTime.isAfter(dayjs())) {
          newErrors.publishAt = 'Thời gian lên lịch xuất bản phải lớn hơn thời gian hiện tại'
          if (showToast) toast.error(newErrors.publishAt)
        }
      }
    }

    // Expire Date
    if (expireAt) {
      const selectedExpireTime = dayjs(expireAt)
      if (status === 'SCHEDULED' && publishAt) {
        const selectedPublishTime = dayjs(publishAt)
        if (!selectedExpireTime.isAfter(selectedPublishTime)) {
          newErrors.expireAt = 'Thời gian hết hạn phải lớn hơn thời gian xuất bản dự kiến'
          if (showToast) toast.error(newErrors.expireAt)
        }
      }
      if (!selectedExpireTime.isAfter(dayjs())) {
        newErrors.expireAt = 'Thời gian hết hạn phải lớn hơn thời gian hiện tại'
        if (showToast) toast.error(newErrors.expireAt)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Lưu bản nháp (DRAFT)
  const handleSaveDraft = (callback?: () => void) => {
    if (!viTitle.trim()) {
      toast.error('Tiêu đề bài viết Tiếng Việt không được để trống khi lưu nháp')
      return
    }

    let formattedPublishAt: string | null = null
    if (status === 'SCHEDULED' && publishAt) {
      const selectedPublishTime = dayjs(publishAt)
      if (!selectedPublishTime.isAfter(dayjs())) {
        toast.error('Thời gian lên lịch xuất bản phải lớn hơn thời gian hiện tại')
        return
      }
      formattedPublishAt = selectedPublishTime.toISOString()
    }

    let formattedExpireAt: string | null = null
    if (expireAt) {
      const selectedExpireTime = dayjs(expireAt)
      if (status === 'SCHEDULED' && publishAt && !selectedExpireTime.isAfter(dayjs(publishAt))) {
        toast.error('Thời gian hết hạn phải lớn hơn thời gian xuất bản dự kiến')
        return
      }
      if (!selectedExpireTime.isAfter(dayjs())) {
        toast.error('Thời gian hết hạn phải lớn hơn thời gian hiện tại')
        return
      }
      formattedExpireAt = selectedExpireTime.toISOString()
    }

    const payload: ArticleCreatePayload = {
      category_id: categoryId || null,
      tag_ids: tagIds.length > 0 ? tagIds : [],
      status: status,
      is_draft: true,
      publish_at: formattedPublishAt,
      expire_at: formattedExpireAt,
      thumbnail_object_key: thumbnailKey,
      cover_object_key: coverKey,
      is_featured: isFeatured,
      is_pinned: isPinned,
      translations: {
        vi: {
          title: viTitle.trim(),
          slug: viSlug.trim() || null,
          excerpt: viExcerpt.trim() || null,
          content: viContent.trim() || null,
          seo_title: viSeoTitle.trim() || null,
          seo_description: viSeoDescription.trim() || null,
          canonical_url: viCanonicalUrl.trim() || null,
          robots: viRobots || 'index, follow',
          og_title: viOgTitle.trim() || null,
          og_description: viOgDescription.trim() || null,
          og_image: thumbnailKey,
        },
        en: enTitle.trim() ? {
          title: enTitle.trim(),
          slug: enSlug.trim() || null,
          excerpt: enExcerpt.trim() || null,
          content: enContent.trim() || null,
          seo_title: enSeoTitle.trim() || null,
          seo_description: enSeoDescription.trim() || null,
          canonical_url: enCanonicalUrl.trim() || null,
          robots: enRobots || 'index, follow',
          og_title: enOgTitle.trim() || null,
          og_description: enOgDescription.trim() || null,
          og_image: thumbnailKey,
        } : null
      }
    }

    saveMutation.mutate(payload, {
      onSuccess: (data: any) => {
        toast.success('Đã lưu bản nháp thành công!')
        if (!isEditMode && data?.id) {
          setCurrentArticleId(data.id)
        }
        if (callback) callback()
      }
    })
  }

  // Back with Draft check
  const handleBackWithDraft = () => {
    if (!showDraftsFeature) {
      if (window.confirm('Bạn có chắc chắn muốn hủy bỏ và quay lại danh sách bài viết? Mọi thay đổi chưa lưu sẽ bị mất.')) {
        navigate('/articles')
      }
      return
    }

    if (!viTitle.trim()) {
      navigate('/articles')
      return
    }

    if (window.confirm('Bạn có muốn lưu bài viết này thành Bản nháp trước khi quay lại không?\n\n- Bấm OK để lưu nháp và quay lại.\n- Bấm Cancel để quay lại mà không lưu.')) {
      handleSaveDraft(() => navigate('/articles'))
    } else {
      navigate('/articles')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm(true)) {
      return
    }

    let formattedPublishAt: string | null = null
    if (status === 'SCHEDULED') {
      formattedPublishAt = dayjs(publishAt).toISOString()
    }

    let formattedExpireAt: string | null = null
    if (expireAt) {
      formattedExpireAt = dayjs(expireAt).toISOString()
    }

    const payload: ArticleCreatePayload = {
      category_id: categoryId || null,
      tag_ids: tagIds.length > 0 ? tagIds : [],
      status: status,
      is_draft: false,
      publish_at: formattedPublishAt,
      expire_at: formattedExpireAt,
      thumbnail_object_key: thumbnailKey,
      cover_object_key: coverKey,
      is_featured: isFeatured,
      is_pinned: isPinned,
      translations: {
        vi: {
          title: viTitle.trim(),
          slug: viSlug.trim() || null,
          excerpt: viExcerpt.trim() || null,
          content: viContent.trim() || null,
          seo_title: viSeoTitle.trim() || null,
          seo_description: viSeoDescription.trim() || null,
          canonical_url: viCanonicalUrl.trim() || null,
          robots: viRobots || 'index, follow',
          og_title: viOgTitle.trim() || null,
          og_description: viOgDescription.trim() || null,
          og_image: thumbnailKey,
        },
        en: enTitle.trim() ? {
          title: enTitle.trim(),
          slug: enSlug.trim() || null,
          excerpt: enExcerpt.trim() || null,
          content: enContent.trim() || null,
          seo_title: enSeoTitle.trim() || null,
          seo_description: enSeoDescription.trim() || null,
          canonical_url: enCanonicalUrl.trim() || null,
          robots: enRobots || 'index, follow',
          og_title: enOgTitle.trim() || null,
          og_description: enOgDescription.trim() || null,
          og_image: thumbnailKey,
        } : null
      }
    }

    saveMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          (isEditMode && !articleDetail?.is_draft)
            ? 'Cập nhật bài viết thành công!'
            : 'Xuất bản bài viết thành công!'
        )
        navigate('/articles')
      }
    })
  }

  const isFormDisabled = saveMutation.isPending || (isEditMode && isLoadingDetail)

  return {
    currentArticleId,
    setCurrentArticleId,
    isEditMode,
    activeTab,
    setActiveTab,
    isTranslatingTitle,
    isTranslatingExcerpt,
    isTranslatingContent,
    isViSeoTitleOverridden,
    setIsViSeoTitleOverridden,
    isViSeoDescriptionOverridden,
    setIsViSeoDescriptionOverridden,
    isEnSeoTitleOverridden,
    setIsEnSeoTitleOverridden,
    isEnSeoDescriptionOverridden,
    setIsEnSeoDescriptionOverridden,

    viFocusKeyword,
    setViFocusKeyword,
    enFocusKeyword,
    setEnFocusKeyword,

    viTitle,
    setViTitle: handleSetViTitle,
    viSlug,
    setViSlug,
    viExcerpt,
    setViExcerpt: handleSetViExcerpt,
    viContent,
    setViContent: handleSetViContent,
    viSeoTitle,
    setViSeoTitle,
    viSeoDescription,
    setViSeoDescription,
    viCanonicalUrl,
    setViCanonicalUrl,
    viRobots,
    setViRobots,
    viOgTitle,
    setViOgTitle,
    viOgDescription,
    setViOgDescription,
    isCheckingViSlug,

    enTitle,
    setEnTitle: handleSetEnTitle,
    enSlug,
    setEnSlug,
    enExcerpt,
    setEnExcerpt: handleSetEnExcerpt,
    enContent,
    setEnContent: handleSetEnContent,
    enSeoTitle,
    setEnSeoTitle,
    enSeoDescription,
    setEnSeoDescription,
    enCanonicalUrl,
    setEnCanonicalUrl,
    enRobots,
    setEnRobots,
    enOgTitle,
    setEnOgTitle,
    enOgDescription,
    setEnOgDescription,
    isCheckingEnSlug,

    categoryId,
    setCategoryId,
    tagIds,
    setTagIds,
    status,
    setStatus,
    publishAt,
    setPublishAt,
    expireAt,
    setExpireAt,
    thumbnailKey,
    setThumbnailKey,
    coverKey,
    setCoverKey,
    isFeatured,
    setIsFeatured,
    isPinned,
    setIsPinned,

    isDraftsModalOpen,
    setIsDraftsModalOpen,
    draftCount,
    errors,
    categories,
    isCategoriesLoading,
    tags,
    isTagsLoading,
    articleDetail,
    isLoadingDetail,

    handleTranslateTitle,
    handleTranslateExcerpt,
    handleTranslateContent,
    saveMutation,
    handleCreateTag,
    handleSelectDraft,
    isFormDirty,
    validateForm,
    handleSaveDraft,
    handleBackWithDraft,
    handleSubmit,
    isFormDisabled,
  }
}
