import { httpClient } from '@/services/http/client'

export interface Program {
  id: string
  department_id: string
  code: string | null
  degree_level: string
  duration_years: number | null
  training_mode: string | null
  thumbnail_object_key: string | null
  sort_order: number
  is_active: boolean
  is_published: boolean
  name: string
  short_description: string | null
  translations: Record<string, { name: string; slug?: string; short_description?: string }>
}

export interface GalleryItem {
  id?: string
  media_item_id: string
  object_key?: string | null
  caption?: string | null
  alt_text?: string | null
  sort_order: number
  is_active: boolean
}

export interface Gallery {
  id: string
  department_id: string
  title: string
  description: string | null
  is_active: boolean
  items: GalleryItem[]
}

export const academicContentService = {
  listPrograms: async (departmentId?: string) => {
    const { data } = await httpClient.get('/admin/programs', { params: { page_size: 200, department_id: departmentId || undefined } })
    return data as { items: Program[]; total: number }
  },
  createProgram: async (payload: unknown) => (await httpClient.post('/admin/programs', payload)).data as Program,
  updateProgram: async (id: string, payload: unknown) => (await httpClient.put(`/admin/programs/${id}`, payload)).data as Program,
  deleteProgram: async (id: string) => httpClient.delete(`/admin/programs/${id}`),
  listGalleries: async (departmentId?: string) => {
    const { data } = await httpClient.get('/admin/galleries', { params: { page_size: 200, department_id: departmentId || undefined } })
    return data as { items: Gallery[]; total: number }
  },
  createGallery: async (payload: unknown) => (await httpClient.post('/admin/galleries', payload)).data as Gallery,
  updateGallery: async (id: string, payload: unknown) => (await httpClient.put(`/admin/galleries/${id}`, payload)).data as Gallery,
  deleteGallery: async (id: string) => httpClient.delete(`/admin/galleries/${id}`),
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{ id: string; object_key: string }>('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
