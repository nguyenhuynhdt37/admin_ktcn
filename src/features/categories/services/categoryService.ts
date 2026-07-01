import { httpClient } from '@/services/http/client'
import type {
  Category,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  CategoryTreeNode,
  CategoryReorderPayload,
} from '../types'

export const categoryService = {
  /** Lấy danh sách danh mục phẳng (hỗ trợ search, filter status) */
  listCategories: async (params?: { search?: string; status?: string }): Promise<Category[]> => {
    const response = await httpClient.get('/categories', { params })
    return response.data
  },

  /** Lấy cấu trúc cây danh mục đầy đủ */
  getCategoryTree: async (): Promise<CategoryTreeNode[]> => {
    const response = await httpClient.get('/categories/tree')
    return response.data
  },

  /** Lấy chi tiết 1 danh mục theo ID */
  getCategory: async (id: string): Promise<Category> => {
    const response = await httpClient.get(`/categories/${id}`)
    return response.data
  },

  /** Tạo mới danh mục */
  createCategory: async (payload: CategoryCreatePayload): Promise<Category> => {
    const response = await httpClient.post('/categories', payload)
    return response.data
  },

  /** Cập nhật danh mục */
  updateCategory: async (id: string, payload: CategoryUpdatePayload): Promise<Category> => {
    const response = await httpClient.put(`/categories/${id}`, payload)
    return response.data
  },

  /** Xóa mềm danh mục (chặn nếu có danh mục con) */
  deleteCategory: async (id: string): Promise<void> => {
    await httpClient.delete(`/categories/${id}`)
  },

  /** Đồng bộ vị trí sau kéo thả (batch reorder) */
  reorderCategories: async (payload: CategoryReorderPayload): Promise<{ success: boolean; reordered: number }> => {
    const response = await httpClient.put('/categories/reorder', payload)
    return response.data
  },

  /** Kiểm tra trùng lặp slug và lấy gợi ý */
  checkSlug: async (slug: string, excludeId?: string | null, lang: string = 'vi'): Promise<{ exists: boolean; suggested_slug: string }> => {
    const response = await httpClient.get('/categories/check-slug', {
      params: {
        slug,
        exclude_id: excludeId || undefined,
        lang,
      },
    })
    return response.data
  },
}
