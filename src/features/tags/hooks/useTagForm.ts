import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { httpClient } from '@/services/http/client'
import { tagService } from '../services/tagService'
import { toast } from 'sonner'
import type { Tag } from '../types'

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

// ---------------------------------------------------------------------------
// Tag Form Schema (Zod)
// ---------------------------------------------------------------------------
const translationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên thẻ là bắt buộc' })
    .max(100, { message: 'Tên thẻ không vượt quá 100 ký tự' }),
  slug: z.string()
    .trim()
    .max(120, { message: 'Slug không vượt quá 120 ký tự' })
    .optional()
    .or(z.literal('')),
  description: z.string()
    .trim()
    .max(500, { message: 'Mô tả không vượt quá 500 ký tự' })
    .optional()
    .or(z.literal('')),
})

export const tagFormSchema = z.object({
  color: z.string()
    .max(7, { message: 'Mã màu HEX tối đa 7 ký tự' })
    .optional()
    .or(z.literal('')),
  sort_order: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0' })
  ),
  is_active: z.boolean().default(true),
  translations: z.object({
    vi: translationSchema,
    en: translationSchema,
  })
})

export type TagFormValues = z.infer<typeof tagFormSchema>

interface UseTagFormProps {
  initialData: Tag | null
  onSubmit: (values: any) => void
}

export function useTagForm({ initialData, onSubmit }: UseTagFormProps) {
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [lastTranslatedVi, setLastTranslatedVi] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const form: any = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    reValidateMode: 'onBlur',
    defaultValues: {
      color: '',
      sort_order: 0,
      is_active: true,
      translations: {
        vi: { name: '', slug: '', description: '' },
        en: { name: '', slug: '', description: '' }
      }
    },
  })

  const currentSlug = form.watch(`translations.${activeTab}.slug`)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)

  // Debounced check slug trùng
  useEffect(() => {
    const slugToTest = currentSlug?.trim()
    if (!slugToTest) return

    // Không check nếu trùng với slug cũ của chính tag này khi sửa
    const oldSlug = initialData?.translations?.[activeTab]?.slug || (activeTab === 'vi' ? initialData?.slug : '')
    if (oldSlug && slugToTest === oldSlug) return

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true)
      try {
        const res = await tagService.checkSlug(slugToTest, initialData?.id, activeTab)
        if (res.exists) {
          form.setValue(`translations.${activeTab}.slug`, res.suggested_slug)
          toast.warning(`Slug "${slugToTest}" đã tồn tại. Hệ thống tự động đổi thành "${res.suggested_slug}" để tránh trùng lặp.`)
        }
      } catch (err) {
        console.error('Lỗi kiểm tra slug:', err)
      } finally {
        setIsCheckingSlug(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [currentSlug, activeTab, initialData, form])

  // Sync form values khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      form.reset({
        color: initialData.color || '',
        sort_order: initialData.sort_order,
        is_active: initialData.is_active,
        translations: {
          vi: {
            name: initialData.translations?.vi?.name || initialData.name || '',
            slug: initialData.translations?.vi?.slug || '',
            description: initialData.translations?.vi?.description || '',
          },
          en: {
            name: initialData.translations?.en?.name || '',
            slug: initialData.translations?.en?.slug || '',
            description: initialData.translations?.en?.description || '',
          }
        }
      })
      if (initialData.translations?.vi?.name) {
        setLastTranslatedVi(initialData.translations.vi.name)
      }
    } else {
      form.reset({
        color: '',
        sort_order: 0,
        is_active: true,
        translations: {
          vi: { name: '', slug: '', description: '' },
          en: { name: '', slug: '', description: '' }
        }
      })
      setLastTranslatedVi('')
    }
    setActiveTab('vi')
  }, [initialData, form])

  // Hàm dịch tự động từ VI sang EN
  const handleAutoTranslate = async () => {
    const nameToTranslate = form.getValues('translations.vi.name')?.trim()
    const descToTranslate = form.getValues('translations.vi.description')?.trim()
    if (!nameToTranslate) {
      toast.error('Vui lòng điền tên thẻ Tiếng Việt trước khi dịch.')
      return
    }

    setIsTranslating(true)
    try {
      // Dịch tên thẻ
      const nameRes = await httpClient.post<Record<string, string>>('/translation', {
        text: nameToTranslate,
        target_languages: ['en'],
        context: 'category_name'
      })
      if (nameRes.data?.en) {
        form.setValue('translations.en.name', nameRes.data.en)
        form.setValue('translations.en.slug', slugify(nameRes.data.en))
      }

      // Dịch mô tả (nếu có)
      if (descToTranslate) {
        const descRes = await httpClient.post<Record<string, string>>('/translation', {
          text: descToTranslate,
          target_languages: ['en'],
          context: 'short_description'
        })
        if (descRes.data?.en) {
          form.setValue('translations.en.description', descRes.data.en)
        }
      }

      setLastTranslatedVi(nameToTranslate)
      toast.success('Dịch tự động thành công!')
    } catch (err) {
      console.error('Lỗi dịch tự động:', err)
      toast.error('Có lỗi xảy ra khi dịch tự động.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleTranslateClick = () => {
    const enName = form.getValues('translations.en.name')?.trim()
    const enDesc = form.getValues('translations.en.description')?.trim()
    if (enName || enDesc) {
      setShowConfirm(true)
    } else {
      handleAutoTranslate()
    }
  }

  const handleFormSubmit = (data: TagFormValues) => {
    const viName = data.translations.vi.name.trim()
    const viSlug = data.translations.vi.slug?.trim() || slugify(viName)
    
    const enName = data.translations.en.name.trim()
    const enSlug = data.translations.en.slug?.trim() || slugify(enName)

    const payload = {
      color: data.color?.trim() || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
      translations: {
        vi: {
          name: viName,
          slug: viSlug,
          description: data.translations.vi.description?.trim() || null
        },
        en: {
          name: enName,
          slug: enSlug,
          description: data.translations.en.description?.trim() || null
        }
      }
    }
    onSubmit(payload)
  }

  return {
    form,
    activeTab,
    setActiveTab,
    isTranslating,
    showConfirm,
    setShowConfirm,
    isCheckingSlug,
    handleTranslateClick,
    handleFormSubmit,
    handleAutoTranslate
  }
}
