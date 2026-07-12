export interface GalleryTranslation {
  title: string
  description: string | null
}

export interface GalleryItem {
  id?: string
  media_item_id: string
  caption: string | null
  alt_text: string | null
  sort_order: number
  is_active: boolean
  media_url?: string
}

export interface Gallery {
  id: string
  department_id: string
  cover_object_key: string
  cover_url?: string
  sort_order: number
  is_active: boolean
  translations: Record<string, GalleryTranslation>
  items: GalleryItem[]
  department_name?: string
  created_at?: string
  updated_at?: string
}

export interface CreateGalleryPayload {
  department_id: string
  cover_object_key: string
  sort_order?: number
  is_active?: boolean
  translations: Record<string, {
    title: string
    description?: string | null
  }>
  items: {
    media_item_id: string
    caption?: string | null
    alt_text?: string | null
    sort_order?: number
    is_active?: boolean
  }[]
}

export interface UpdateGalleryPayload extends Partial<CreateGalleryPayload> {}

export interface GalleryPagination {
  items: Gallery[]
  page: number
  page_size: number
  total: number
  total_pages: number
}
