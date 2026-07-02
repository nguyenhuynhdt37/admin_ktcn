/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { httpClient } from '@/services/http/client'
import { menusService } from '../services/menusService'
import { articleService } from '@/features/articles/services/articleService'
import { departmentService } from '@/features/departments/services/departmentService'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { MenuItemPayload } from '../types'
import { useAuth } from '@/app/providers/AuthProvider'

interface UseMenuItemConfigProps {
  menuId: string
  itemId: string
  item: any
  onClose: () => void
  refetchTree: () => void
}

export interface MenuItemFormState {
  target_type: 'CATEGORY' | 'ARTICLE' | 'PAGE' | 'MODULE' | 'EXTERNAL_LINK' | 'DEPARTMENT' | null
  target_id: string | null
  external_url: string | null
  open_in_new_tab: boolean
  is_visible: boolean
  translations: {
    vi: { title: string }
    en: { title: string }
  }
}

export const INITIAL_TRANSLATION = {
  title: '',
}

export const INITIAL_FORM_STATE: MenuItemFormState = {
  target_type: null,
  target_id: null,
  external_url: null,
  open_in_new_tab: false,
  is_visible: true,
  translations: {
    vi: { ...INITIAL_TRANSLATION },
    en: { ...INITIAL_TRANSLATION },
  }
}

export function parseMenuTranslations(rawTranslations: any) {
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
          title: item.title || '',
        }
      }
    })
  } else if (typeof rawTranslations === 'object') {
    ;['vi', 'en'].forEach((code) => {
      const item = rawTranslations[code]
      if (item) {
        result[code as 'vi' | 'en'] = {
          title: item.title || '',
        }
      }
    })
  }
  return result
}

export function useMenuItemConfig({
  menuId,
  itemId,
  item,
  onClose,
  refetchTree,
}: UseMenuItemConfigProps) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission('menu.update')
  const queryClient = useQueryClient()

  // State đa ngôn ngữ và tab
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [isTranslating, setIsTranslating] = useState(false)

  // State quản lý toàn bộ Form
  const [form, setForm] = useState<MenuItemFormState>({ ...INITIAL_FORM_STATE })

  // Ref lưu giá trị tiếng Việt đã dịch gần nhất để tránh dịch lặp lại
  const lastTranslatedViRef = useState<string>('')
  const [lastTranslatedVi, setLastTranslatedVi] = lastTranslatedViRef

  // Đổ dữ liệu item ban đầu khi mở edit
  useEffect(() => {
    if (item) {
      const parsedTrans = parseMenuTranslations(item.translations)
      
      // Fallback
      if (!parsedTrans.vi.title && item.title) {
        parsedTrans.vi.title = item.title
      }

      setForm({
        target_type: item.target_type || null,
        target_id: item.target_id || null,
        external_url: item.external_url || null,
        open_in_new_tab: !!item.open_in_new_tab,
        is_visible: item.is_visible !== false,
        translations: parsedTrans,
      })
      setLastTranslatedVi(parsedTrans.vi.title)
    }
  }, [item, setLastTranslatedVi])


  const targetType = form.target_type || 'NONE'
  const targetId = form.target_id || ''
  const externalUrl = form.external_url || ''
  const openInNewTab = form.open_in_new_tab
  const isVisible = form.is_visible

  // Cập nhật trường phẳng
  const handleFieldChange = useCallback((field: keyof MenuItemFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Cập nhật trường dịch thuật
  const handleTranslationChange = useCallback((lang: 'vi' | 'en', field: 'title', value: string) => {
    setForm((prev) => {
      const nextTrans = { ...prev.translations }
      nextTrans[lang] = { ...nextTrans[lang], [field]: value }
      return { ...prev, translations: nextTrans }
    })
  }, [])

  const setTargetType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      target_type: type === 'NONE' ? null : (type as any),
      target_id: null,
      external_url: null,
    }))
  }

  const setTargetId = (id: string | null) => {
    setForm((prev) => ({ ...prev, target_id: id }))
  }

  const setExternalUrl = (url: string) => {
    setForm((prev) => ({ ...prev, external_url: url }))
  }

  const setOpenInNewTab = (val: boolean) => {
    setForm((prev) => ({ ...prev, open_in_new_tab: val }))
  }

  const setIsVisible = (val: boolean) => {
    setForm((prev) => ({ ...prev, is_visible: val }))
  }

  // State tìm kiếm bài viết khởi tạo từ tên bài viết hiện tại
  const [articleSearch, setArticleSearch] = useState(() => 
    item?.target_type === 'ARTICLE' && item?.target_info ? item.target_info.name || '' : ''
  )
  const debouncedArticleSearch = useDebounce(articleSearch, 400)

  // Queries danh sách bài viết & bộ môn
  const { data: articlesData, isLoading: isLoadingArticles } = useQuery({
    queryKey: ['menus-search-articles', debouncedArticleSearch],
    queryFn: () => articleService.list({
      status: 'PUBLISHED',
      is_draft: false,
      page: 1,
      page_size: 100,
      search: debouncedArticleSearch || undefined
    }),
    enabled: form.target_type === 'ARTICLE',
  })

  const { data: departmentsData } = useQuery({
    queryKey: ['menus-active-departments'],
    queryFn: () => departmentService.list({
      is_active: true,
      page: 1,
      page_size: 1000
    }),
    enabled: form.target_type === 'DEPARTMENT',
  })

  // Xử lý options fallback gộp phần tử hiện tại vào đầu danh sách
  const articlesList = useMemo(() => {
    const list = [...(articlesData?.items || [])]
    if (item && item.target_type === 'ARTICLE' && item.target_id && item.target_info) {
      const hasCurrent = list.some((art) => art.id === item.target_id)
      if (!hasCurrent) {
        list.unshift({
          id: item.target_id,
          title: item.target_info.name,
          category: { name: (item.target_info as any).category_name || 'Bài viết' },
          created_at: (item.target_info as any).created_at || null,
          author: { full_name: (item.target_info as any).author_name || 'Hệ thống' }
        } as any)
      }
    }
    return list
  }, [articlesData, item])

  const departmentsList = useMemo(() => {
    const list = [...(departmentsData?.items || [])]
    if (item && item.target_type === 'DEPARTMENT' && item.target_id && item.target_info) {
      const hasCurrent = list.some((dept) => dept.id === item.target_id)
      if (!hasCurrent) {
        list.unshift({
          id: item.target_id,
          name: item.target_info.name,
          code: (item.target_info as any).code || ''
        } as any)
      }
    }
    return list
  }, [departmentsData, item])

  // Dịch tự động tiêu đề
  const handleAutoTranslate = async () => {
    const textToTranslate = form.translations?.vi?.title?.trim() || ''
    if (!textToTranslate) {
      toast.error('Vui lòng nhập Tiêu đề Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslating(true)
    try {
      const res = await httpClient.post<Record<string, string>>('/translation', {
        text: textToTranslate,
        target_languages: ['en'],
        context: 'menu_name'
      }, {
        timeout: 60000
      })
      
      if (res.data?.en) {
        handleTranslationChange('en', 'title', res.data.en)
        toast.success('Đã dịch tự động sang Tiếng Anh thành công!')
      } else {
        toast.error('Không nhận được bản dịch từ máy chủ.')
      }
    } catch {
      toast.error('Dịch tự động thất bại.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Mutation cập nhật cấu hình item
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<MenuItemPayload>) =>
      menusService.updateItem(menuId, itemId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật cấu hình mục menu thành công!')
      queryClient.invalidateQueries({ queryKey: ['menu-item', menuId, itemId] })
      refetchTree()
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error_code
      const errorMap: Record<string, string> = {
        TARGET_CATEGORY_NOT_FOUND: 'Danh mục được chọn không tồn tại.',
        TARGET_CATEGORY_DELETED: 'Danh mục đã bị xóa. Vui lòng chọn danh mục khác.',
        TARGET_CATEGORY_NOT_ACTIVE: 'Chỉ cho phép liên kết với danh mục đang hoạt động (ACTIVE).',
        TARGET_DEPARTMENT_NOT_FOUND: 'Bộ môn được chọn không tồn tại.',
        TARGET_DEPARTMENT_NOT_ACTIVE: 'Chỉ liên kết với bộ môn đang hoạt động.',
        TARGET_ARTICLE_NOT_FOUND: 'Bài viết được chọn không tồn tại hoặc chưa xuất bản.',
      }
      toast.error(errorMap[errorCode] || 'Không thể cập nhật cấu hình.')
    },
  })

  // Xử lý lưu
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canUpdate) {
      toast.error('Bạn không có quyền cập nhật menu.')
      return
    }

    if (!form.translations.vi.title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề hiển thị ở Tiếng Việt 🇻🇳')
      setActiveTab('vi')
      return
    }
    if (!form.translations.en.title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề hiển thị ở Tiếng Anh 🇬🇧')
      setActiveTab('en')
      return
    }

    const payload: MenuItemPayload = {
      target_type: form.target_type || null,
      target_id: ['CATEGORY', 'ARTICLE', 'MODULE', 'DEPARTMENT'].includes(form.target_type || '') ? (form.target_id || null) : null,
      external_url: form.target_type === 'EXTERNAL_LINK' ? (form.external_url || null) : null,
      open_in_new_tab: form.open_in_new_tab,
      is_visible: form.is_visible,
      translations: {
        vi: { title: form.translations.vi.title.trim() },
        en: { title: form.translations.en.title.trim() },
      }
    }

    updateMutation.mutate(payload)
  }

  const isTabComplete = (lang: 'vi' | 'en') => {
    return !!form.translations?.[lang]?.title?.trim()
  }

  const isFormValid = () => {
    return isTabComplete('vi') && isTabComplete('en')
  }

  return {
    form,
    activeTab,
    setActiveTab,
    isTranslating,
    title: form.translations[activeTab].title,
    targetType,
    targetId,
    externalUrl,
    openInNewTab,
    isVisible,
    setTargetType,
    setTargetId,
    setExternalUrl,
    setOpenInNewTab,
    setIsVisible,
    handleTranslationChange,
    handleAutoTranslate,
    articleSearch,
    setArticleSearch,
    articlesList,
    departmentsList,
    isLoadingArticles,
    canUpdate,
    handleSubmit,
    updateMutation,
    isFormValid,
    isTabComplete,
  }
}
