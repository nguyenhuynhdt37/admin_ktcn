import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { Loader2, ArrowLeft, FileText, Eye } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { MyDraftsModal } from './form/MyDraftsModal'

import { Button } from '@/shared/components/ui/button'
import { articleService } from '../services/articleService'
import { ArticleBasicInfoSection } from './form/ArticleBasicInfoSection'
import { ArticleEditorSection } from './form/ArticleEditorSection'
import { ArticleMediaSection } from './form/ArticleMediaSection'
import { ArticlePublishSection } from './form/ArticlePublishSection'
import { ArticleSeoSection } from './form/ArticleSeoSection'
import type { ArticleCreatePayload } from '../types/articles.types'
import { SEO_CONFIG } from '../constants'
import { generateSeoTitle, generateSeoDescription } from '@/shared/utils/seo'

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

interface ArticleFormProps {
  articleId?: string | null
  showDraftsFeature?: boolean
}

export function ArticleForm({ articleId, showDraftsFeature = true }: ArticleFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State quản lý ID bài viết hiện tại (có thể là bài mới đang lưu nháp)
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(articleId || null)
  const isEditMode = !!currentArticleId

  // Cờ đánh dấu người dùng đã chỉnh sửa thủ công (Manual Override)
  const [isSeoTitleOverridden, setIsSeoTitleOverridden] = useState(false)
  const [isSeoDescriptionOverridden, setIsSeoDescriptionOverridden] = useState(false)

  // Ref lưu giá trị ban đầu để so sánh sự thay đổi (isDirty)
  const initialValuesRef = useRef<{
    title: string
    slug: string
    excerpt: string
    content: string
    categoryId: string
    tagIds: string[]
    status: string
    publishAt: string
    expireAt: string
    thumbnailKey: string | null
    coverKey: string | null
    isFeatured: boolean
    isPinned: boolean
    seoTitle: string
    seoDescription: string
    canonicalUrl: string
    robots: string
    ogTitle: string
    ogDescription: string
  } | null>(null)

  // Form Field States
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [status, setStatus] = useState<'PUBLISHED' | 'SCHEDULED'>('PUBLISHED')
  const [publishAt, setPublishAt] = useState('')
  const [expireAt, setExpireAt] = useState('')
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(null)
  const [coverKey, setCoverKey] = useState<string | null>(null)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)

  // SEO & Meta states
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [robots, setRobots] = useState('index, follow')
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')

  // Drafts Modal state & count query
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false)
  const { data: draftsCountData } = useQuery({
    queryKey: ['my-drafts-count'],
    queryFn: articleService.countMyDrafts,
  })
  const draftCount = draftsCountData?.count || 0

  // State lưu trữ các lỗi validation để hiển thị phía dưới các trường
  const [errors, setErrors] = useState<{
    title?: string
    categoryId?: string
    content?: string
    publishAt?: string
    expireAt?: string
  }>({})

  // Hàm helper dùng để check và validate các trường của bài viết
  const validateFormFields = (
    currentTitle: string,
    currentCategoryId: string,
    currentContent: string,
    currentStatus: string,
    currentPublishAt: string,
    currentExpireAt: string
  ) => {
    const newErrors: {
      title?: string
      categoryId?: string
      content?: string
      publishAt?: string
      expireAt?: string
    } = {}

    // Title
    if (!currentTitle.trim()) {
      newErrors.title = 'Tiêu đề bài viết không được để trống'
    }

    // Category
    if (!currentCategoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục cho bài viết trước khi xuất bản'
    }

    // Content
    const cleanContent = currentContent.replace(/<[^>]*>/g, '').trim()
    if (!cleanContent) {
      newErrors.content = 'Nội dung bài viết chưa được soạn thảo'
    }

    // Publish At
    if (currentStatus === 'SCHEDULED') {
      if (!currentPublishAt) {
        newErrors.publishAt = 'Vui lòng chọn thời gian lên lịch xuất bản'
      } else {
        const selectedPublishTime = dayjs(currentPublishAt)
        if (!selectedPublishTime.isAfter(dayjs())) {
          newErrors.publishAt = 'Thời gian lên lịch xuất bản phải lớn hơn thời gian hiện tại'
        }
      }
    }

    // Expire At
    if (currentExpireAt) {
      const selectedExpireTime = dayjs(currentExpireAt)
      if (currentStatus === 'SCHEDULED' && currentPublishAt) {
        const selectedPublishTime = dayjs(currentPublishAt)
        if (!selectedExpireTime.isAfter(selectedPublishTime)) {
          newErrors.expireAt = 'Thời gian hết hạn phải lớn hơn thời gian xuất bản dự kiến'
        }
      }
      if (!selectedExpireTime.isAfter(dayjs())) {
        newErrors.expireAt = 'Thời gian hết hạn phải lớn hơn thời gian hiện tại'
      }
    }

    return newErrors
  }

  // Hàm kiểm tra form có thay đổi so với giá trị ban đầu hay không
  const isFormDirty = () => {
    if (!isEditMode) {
      return title.trim().length > 0
    }
    if (!initialValuesRef.current) return false

    const init = initialValuesRef.current

    const isTagsChanged =
      init.tagIds.length !== tagIds.length ||
      !tagIds.every((id) => init.tagIds.includes(id))

    return (
      init.title !== title ||
      init.slug !== slug ||
      init.excerpt !== excerpt ||
      init.content !== content ||
      init.categoryId !== categoryId ||
      isTagsChanged ||
      init.status !== status ||
      init.publishAt !== publishAt ||
      init.expireAt !== expireAt ||
      init.thumbnailKey !== thumbnailKey ||
      init.coverKey !== coverKey ||
      init.isFeatured !== isFeatured ||
      init.isPinned !== isPinned ||
      init.seoTitle !== seoTitle ||
      init.seoDescription !== seoDescription ||
      init.canonicalUrl !== canonicalUrl ||
      init.robots !== robots ||
      init.ogTitle !== ogTitle ||
      init.ogDescription !== ogDescription
    )
  }

  // 1. Fetch Categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: articleService.listCategories,
  })

  // 2. Fetch Tags
  const { data: tags = [], isLoading: isTagsLoading } = useQuery({
    queryKey: ['tags', 'all'],
    queryFn: articleService.listTags,
  })

  // 3. Fetch Article detail in Edit Mode
  const { data: articleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['articles', currentArticleId],
    queryFn: () => articleService.getDetail(currentArticleId!),
    enabled: isEditMode,
  })

  // Sync state with article detail in Edit Mode
  useEffect(() => {
    if (isEditMode && articleDetail) {
      setTitle(articleDetail.title)
      setSlug(articleDetail.slug)
      setExcerpt(articleDetail.excerpt || '')
      setContent(articleDetail.content || '')
      setCategoryId(articleDetail.category?.id || '')
      setTagIds(articleDetail.tags?.map((t) => t.id) || [])
      // Chuẩn hóa status: Nếu là SCHEDULED thì giữ nguyên, các trạng thái khác (PUBLISHED, DRAFT, null, undefined) mặc định về PUBLISHED
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

      // SEO - Loại bỏ hậu tố SEO thương hiệu nếu có khi nạp từ DB để chỉ lưu phần người dùng nhập
      let rawSeoTitle = articleDetail.seo_title || ''
      if (rawSeoTitle.endsWith(SEO_CONFIG.SUFFIX)) {
        rawSeoTitle = rawSeoTitle.slice(0, -SEO_CONFIG.SUFFIX.length)
      }
      setSeoTitle(rawSeoTitle)
      setSeoDescription(articleDetail.seo_description || '')
      setCanonicalUrl(articleDetail.canonical_url || '')
      setRobots(articleDetail.robots || 'index, follow')
      setOgTitle(articleDetail.og_title || '')
      setOgDescription(articleDetail.og_description || '')

      // Kiểm tra xem tiêu đề SEO có bị ghi đè thủ công từ trước không
      const expectedSeoTitle = generateSeoTitle(articleDetail.title || '')
      const expectedSeoDesc = generateSeoDescription(articleDetail.content || '', articleDetail.excerpt || '')

      const hasSeoTitleOverridden = !!rawSeoTitle && rawSeoTitle.trim() !== expectedSeoTitle.trim()
      const hasSeoDescOverridden = !!articleDetail.seo_description && articleDetail.seo_description.trim() !== expectedSeoDesc.trim()

      setIsSeoTitleOverridden(hasSeoTitleOverridden)
      setIsSeoDescriptionOverridden(hasSeoDescOverridden)

      // Chạy validation báo lỗi lập tức khi nạp bài viết
      const validationErrors = validateFormFields(
        articleDetail.title || '',
        articleDetail.category?.id || '',
        articleDetail.content || '',
        dbStatus,
        articleDetail.publish_at ? dayjs(articleDetail.publish_at).format('YYYY-MM-DDTHH:mm') : '',
        articleDetail.expire_at ? dayjs(articleDetail.expire_at).format('YYYY-MM-DDTHH:mm') : ''
      )
      setErrors(validationErrors)

      // Lưu giá trị ban đầu sạch để so sánh độ thay đổi (isDirty)
      initialValuesRef.current = {
        title: articleDetail.title || '',
        slug: articleDetail.slug || '',
        excerpt: articleDetail.excerpt || '',
        content: articleDetail.content || '',
        categoryId: articleDetail.category?.id || '',
        tagIds: articleDetail.tags?.map((t) => t.id) || [],
        status: dbStatus === 'SCHEDULED' ? 'SCHEDULED' : 'PUBLISHED',
        publishAt: articleDetail.publish_at ? dayjs(articleDetail.publish_at).format('YYYY-MM-DDTHH:mm') : '',
        expireAt: articleDetail.expire_at ? dayjs(articleDetail.expire_at).format('YYYY-MM-DDTHH:mm') : '',
        thumbnailKey: articleDetail.thumbnail_object_key || null,
        coverKey: articleDetail.cover_object_key || null,
        isFeatured: articleDetail.is_featured,
        isPinned: articleDetail.is_pinned,
        seoTitle: rawSeoTitle,
        seoDescription: articleDetail.seo_description || '',
        canonicalUrl: articleDetail.canonical_url || '',
        robots: articleDetail.robots || 'index, follow',
        ogTitle: articleDetail.og_title || '',
        ogDescription: articleDetail.og_description || '',
      }
    }
  }, [isEditMode, articleDetail])

  // Xóa lỗi real-time khi người dùng bắt đầu chỉnh sửa
  useEffect(() => {
    if (title.trim()) {
      setErrors((prev) => ({ ...prev, title: undefined }))
    }
  }, [title])

  // Xóa lỗi real-time khi người dùng bắt đầu chỉnh sửa
  useEffect(() => {
    if (categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: undefined }))
    }
  }, [categoryId])

  // Xóa lỗi real-time khi người dùng bắt đầu chỉnh sửa
  useEffect(() => {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim()
    if (cleanContent) {
      setErrors((prev) => ({ ...prev, content: undefined }))
    }
  }, [content])

  // Validate và gán/xóa lỗi real-time các mốc thời gian khi người dùng chỉnh sửa
  useEffect(() => {
    if (isEditMode && !articleDetail) return

    setErrors((prev) => {
      const updatedErrors = { ...prev }

      // Validate publishAt
      if (status === 'SCHEDULED') {
        if (!publishAt) {
          updatedErrors.publishAt = 'Vui lòng chọn thời gian lên lịch xuất bản'
        } else {
          const selectedPublishTime = dayjs(publishAt)
          if (!selectedPublishTime.isAfter(dayjs())) {
            updatedErrors.publishAt = 'Thời gian lên lịch xuất bản phải lớn hơn thời gian hiện tại'
          } else {
            updatedErrors.publishAt = undefined
          }
        }
      } else {
        updatedErrors.publishAt = undefined
      }

      // Validate expireAt
      if (expireAt) {
        const selectedExpireTime = dayjs(expireAt)
        let expireError: string | undefined = undefined

        if (status === 'SCHEDULED' && publishAt) {
          const selectedPublishTime = dayjs(publishAt)
          if (!selectedExpireTime.isAfter(selectedPublishTime)) {
            expireError = 'Thời gian hết hạn phải lớn hơn thời gian xuất bản dự kiến'
          }
        }
        
        if (!expireError && !selectedExpireTime.isAfter(dayjs())) {
          expireError = 'Thời gian hết hạn phải lớn hơn thời gian hiện tại'
        }

        updatedErrors.expireAt = expireError
      } else {
        updatedErrors.expireAt = undefined
      }

      return updatedErrors
    })
  }, [publishAt, expireAt, status, isEditMode, articleDetail])

  // Auto-sync SEO Title from Title if not overridden
  useEffect(() => {
    if (!isSeoTitleOverridden) {
      setSeoTitle(generateSeoTitle(title))
    }
  }, [title, isSeoTitleOverridden])

  // Auto-sync SEO Description from Excerpt or Content if not overridden
  useEffect(() => {
    if (!isSeoDescriptionOverridden) {
      setSeoDescription(generateSeoDescription(content, excerpt))
    }
  }, [excerpt, content, isSeoDescriptionOverridden])

  // Auto-generate slug from title and check slug availability on backend
  useEffect(() => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setSlug('')
      return
    }

    const rawSlug = generateSlug(trimmedTitle)

    // In Edit mode, if title generates the exact original slug, do not check to save API calls
    if (isEditMode && articleDetail && rawSlug === articleDetail.slug) {
      setSlug(articleDetail.slug)
      return
    }

    // Debounce check slug for 500ms
    const timer = setTimeout(async () => {
      setIsCheckingSlug(true)
      try {
        const res = await articleService.checkSlug(rawSlug)
        setSlug(res.suggested_slug)
      } catch (err) {
        console.error('Failed to check slug availability:', err)
        setSlug(rawSlug)
      } finally {
        setIsCheckingSlug(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [title, isEditMode, articleDetail])

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

  // Hàm tạo nhanh thẻ tag mới khi đang viết bài
  const handleCreateTag = async (name: string) => {
    try {
      const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#FF9800', '#FF5722']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const newTag = await articleService.createTag({
        name,
        color: randomColor,
        is_active: true
      })

      // Cập nhật nóng cache tags của React Query để tránh reload trang
      queryClient.setQueryData(['tags', 'all'], (oldTags: any) => {
        const list = Array.isArray(oldTags) ? oldTags : []
        return [...list, newTag]
      })

      toast.success(`Đã tạo nhanh thẻ tag "${name}" thành công!`)
      return { id: newTag.id, label: newTag.name, color: newTag.color }
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

  // Hàm lưu bài viết dưới dạng bản nháp (DRAFT)
  const handleSaveDraft = (callback?: () => void) => {
    if (!title.trim()) {
      toast.error('Tiêu đề bài viết không được để trống khi lưu nháp')
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
      title: title.trim(),
      slug: slug.trim() || null,
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      category_id: categoryId || null,
      tag_ids: tagIds.length > 0 ? tagIds : [],
      status: status, // Gửi đúng trạng thái người dùng chọn trên UI
      is_draft: true,
      publish_at: formattedPublishAt,
      expire_at: formattedExpireAt,
      thumbnail_object_key: thumbnailKey,
      cover_object_key: coverKey,
      is_featured: isFeatured,
      is_pinned: isPinned,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      canonical_url: canonicalUrl.trim() || null,
      robots: robots || 'index, follow',
      og_title: ogTitle.trim() || null,
      og_description: ogDescription.trim() || null,
      og_image: thumbnailKey,
    }

    // Thực thi mutation
    saveMutation.mutate(payload, {
      onSuccess: (data: any) => {
        toast.success('Đã lưu bản nháp thành công!')
        
        // Nếu ở Create Mode, tự động nạp ID bản nháp vào state
        if (!isEditMode && data?.id) {
          setCurrentArticleId(data.id)
        }

        if (callback) {
          callback()
        }
      }
    })
  }

  // Hàm xử lý khi quay lại, gợi ý người dùng lưu nháp
  const handleBackWithDraft = () => {
    if (!showDraftsFeature) {
      if (window.confirm('Bạn có chắc chắn muốn hủy bỏ và quay lại danh sách bài viết? Mọi thay đổi chưa lưu sẽ bị mất.')) {
        navigate('/articles')
      }
      return
    }

    if (!title.trim()) {
      navigate('/articles')
      return
    }

    if (window.confirm('Bạn có muốn lưu bài viết này thành Bản nháp trước khi quay lại không?\n\n- Bấm OK để lưu nháp và quay lại.\n- Bấm Cancel để quay lại mà không lưu.')) {
      handleSaveDraft(() => navigate('/articles'))
    } else {
      navigate('/articles')
    }
  }

  // Khởi tạo hàm validation form dùng chung
  const validateForm = (showToast = false): boolean => {
    const newErrors: { title?: string; categoryId?: string; content?: string } = {}
    
    if (!title.trim()) {
      newErrors.title = 'Tiêu đề bài viết không được để trống'
      if (showToast) toast.error(newErrors.title)
    }
    
    if (!categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục cho bài viết trước khi xuất bản'
      if (showToast) toast.error(newErrors.categoryId)
    }

    const cleanContent = content.replace(/<[^>]*>/g, '').trim()
    if (!cleanContent) {
      newErrors.content = 'Nội dung bài viết chưa được soạn thảo'
      if (showToast) toast.error('Nội dung bài viết chưa được soạn thảo')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validation: Run validateForm
    if (!validateForm(true)) {
      return
    }

    // 3. Validation: Scheduled Posting
    let formattedPublishAt: string | null = null
    if (status === 'SCHEDULED') {
      if (!publishAt) {
        toast.error('Vui lòng chọn thời gian lên lịch đăng bài')
        return
      }

      const selectedPublishTime = dayjs(publishAt)
      if (!selectedPublishTime.isAfter(dayjs())) {
        toast.error('Thời gian lên lịch xuất bản phải lớn hơn thời gian hiện tại')
        return
      }
      formattedPublishAt = selectedPublishTime.toISOString()
    } else {
      // Nếu không phải SCHEDULED nhưng có điền publishAt (Ví dụ do switch trạng thái), 
      // ta vẫn có thể gửi lên hoặc set null. Theo spec: publish_at null cho DRAFT/PUBLISHED.
      formattedPublishAt = null
    }

    // 4. Validation: Expired date (if provided)
    let formattedExpireAt: string | null = null
    if (expireAt) {
      const selectedExpireTime = dayjs(expireAt)
      if (status === 'SCHEDULED' && publishAt && !selectedExpireTime.isAfter(dayjs(publishAt))) {
        toast.error('Thời gian hết hạn phải sau thời gian lên lịch xuất bản')
        return
      }
      if (!selectedExpireTime.isAfter(dayjs())) {
        toast.error('Thời gian hết hạn phải lớn hơn thời gian hiện tại')
        return
      }
      formattedExpireAt = selectedExpireTime.toISOString()
    }

    // Build Payload
    const payload: ArticleCreatePayload = {
      title: title.trim(),
      slug: slug.trim() || null,
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      category_id: categoryId,
      tag_ids: tagIds.length > 0 ? tagIds : [],
      status: status, // Gửi đúng trạng thái người dùng chọn trên UI
      is_draft: false,
      publish_at: formattedPublishAt,
      expire_at: formattedExpireAt,
      thumbnail_object_key: thumbnailKey,
      cover_object_key: coverKey,
      is_featured: isFeatured,
      is_pinned: isPinned,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      canonical_url: canonicalUrl.trim() || null,
      robots: robots || 'index, follow',
      og_title: ogTitle.trim() || null,
      og_description: ogDescription.trim() || null,
      og_image: thumbnailKey, // Map og_image tự động theo Thumbnail
    }

    saveMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          isEditMode
            ? 'Cập nhật bài viết thành công!'
            : 'Xuất bản bài viết thành công!'
        )
        navigate('/articles')
      }
    })
  }

  const isFormDisabled = saveMutation.isPending || (isEditMode && isLoadingDetail)

  return (
    <div className="space-y-6">
      {/* Header breadcrumb & back */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackWithDraft}
          className="gap-1.5 -ml-2 cursor-pointer hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h2>
            {isEditMode && isLoadingDetail && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Đang đồng bộ dữ liệu...
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditMode
              ? 'Cập nhật lại nội dung và các tùy chỉnh cấu hình bài viết'
              : 'Soạn thảo nội dung và xuất bản bài viết mới lên trang tin tức'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              asChild
              className="gap-2 text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              <a href={`/articles/${currentArticleId}/preview`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Xem trước bài viết</span>
              </a>
            </Button>
          )}

          {showDraftsFeature && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDraftsModalOpen(true)}
              className="gap-2 text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Bản nháp của tôi</span>
              {draftCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                  {draftCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-8) - Editor & Basic info */}
        <div className="lg:col-span-8 space-y-6">
          <ArticleBasicInfoSection
            title={title}
            setTitle={setTitle}
            slug={slug}
            setSlug={setSlug}
            excerpt={excerpt}
            setExcerpt={setExcerpt}
            disabled={isFormDisabled}
            isCheckingSlug={isCheckingSlug}
            errors={errors}
          />

          <ArticleEditorSection
            content={content}
            setContent={setContent}
            disabled={isFormDisabled}
            errors={errors}
          />

          <ArticleSeoSection
            title={title}
            slug={slug}
            content={content}
            excerpt={excerpt}
            categoryName={categories.find((c) => c.id === categoryId)?.name || 'tin-tuc'}
            seoTitle={seoTitle}
            setSeoTitle={(val) => {
              setIsSeoTitleOverridden(true)
              setSeoTitle(val)
            }}
            seoDescription={seoDescription}
            setSeoDescription={(val) => {
              setIsSeoDescriptionOverridden(true)
              setSeoDescription(val)
            }}
            canonicalUrl={canonicalUrl}
            setCanonicalUrl={setCanonicalUrl}
            robots={robots}
            setRobots={setRobots}
            ogTitle={ogTitle}
            setOgTitle={setOgTitle}
            ogDescription={ogDescription}
            setOgDescription={setOgDescription}
            disabled={isFormDisabled}
            isSeoTitleOverridden={isSeoTitleOverridden}
            setIsSeoTitleOverridden={setIsSeoTitleOverridden}
            isSeoDescriptionOverridden={isSeoDescriptionOverridden}
            setIsSeoDescriptionOverridden={setIsSeoDescriptionOverridden}
          />
        </div>

        {/* Right Column (col-span-4) - Sidebar config & images */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-6">
            <ArticlePublishSection
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              isCategoriesLoading={isCategoriesLoading}
              tags={tags}
              tagIds={tagIds}
              setTagIds={setTagIds}
              isTagsLoading={isTagsLoading}
              status={status}
              setStatus={setStatus}
              publishAt={publishAt}
              setPublishAt={setPublishAt}
              expireAt={expireAt}
              setExpireAt={setExpireAt}
              isFeatured={isFeatured}
              setIsFeatured={setIsFeatured}
              isPinned={isPinned}
              setIsPinned={setIsPinned}
              disabled={isFormDisabled}
              onCreateTag={handleCreateTag}
              errors={errors}
            />

            <ArticleMediaSection
              thumbnailKey={thumbnailKey}
              setThumbnailKey={setThumbnailKey}
              coverKey={coverKey}
              setCoverKey={setCoverKey}
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <div className="lg:col-span-12 flex justify-end gap-3 pt-6 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackWithDraft}
            disabled={isFormDisabled}
            className="cursor-pointer hover:bg-muted"
          >
            Hủy bỏ
          </Button>

          {showDraftsFeature && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSaveDraft()}
              disabled={isFormDisabled}
              className="cursor-pointer"
            >
              Lưu bản nháp
            </Button>
          )}

          <Button
            type="submit"
            disabled={isFormDisabled || (isEditMode && !isFormDirty())}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 disabled:pointer-events-none"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : isEditMode ? (
              'Cập nhật bài viết'
            ) : (
              'Xuất bản bài viết'
            )}
          </Button>
        </div>
      </form>

      {showDraftsFeature && (
        <MyDraftsModal
          open={isDraftsModalOpen}
          onOpenChange={setIsDraftsModalOpen}
          onSelectDraft={handleSelectDraft}
        />
      )}
    </div>
  )
}
