// Định nghĩa các vị trí hiển thị Banner
export enum BannerPosition {
  HOME_HERO = 'HOME_HERO',         // Banner trượt lớn đầu trang chủ (Carousel)
  HOME_POPUP = 'HOME_POPUP',       // Popup quảng cáo/thông báo khi vào trang chủ
  HOME_TOP = 'HOME_TOP',           // Banner ngang phía trên trang chủ
  NEWS_TOP = 'NEWS_TOP',           // Banner đầu trang tin tức
  CATEGORY_TOP = 'CATEGORY_TOP',   // Banner đầu trang danh mục bài viết
  PAGE_TOP = 'PAGE_TOP'            // Banner đầu trang tĩnh/trang con
}

// Đối tượng Banner
export interface Banner {
  id: string
  title: string
  description?: string
  desktop_image_object_key: string  // Đã được BE tự chuyển thành Full HTTP URL khi GET
  mobile_image_object_key?: string // Đã được BE tự chuyển thành Full HTTP URL (nếu có) khi GET
  link_url?: string | null
  open_in_new_tab: boolean
  position: BannerPosition
  sort_order: number
  start_at?: string               // ISO Date String
  end_at?: string                 // ISO Date String
  is_active: boolean
  target_type: 'ARTICLE' | 'EXTERNAL'
  article_id?: string | null
  created_at: string
  updated_at: string
}

// Cấu trúc phân trang danh sách Admin
export interface BannerPagination {
  items: Banner[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// Payloads cho API
export interface CreateBannerPayload {
  title: string
  description?: string | null
  desktop_image_object_key: string
  mobile_image_object_key?: string | null
  link_url?: string | null
  open_in_new_tab: boolean
  position: BannerPosition
  sort_order: number
  start_at?: string | null
  end_at?: string | null
  is_active: boolean
  target_type: 'ARTICLE' | 'EXTERNAL'
  article_id?: string | null
}

export interface UpdateBannerPayload {
  title?: string
  description?: string | null
  desktop_image_object_key?: string
  mobile_image_object_key?: string | null
  link_url?: string | null
  open_in_new_tab?: boolean
  position?: BannerPosition
  sort_order?: number
  start_at?: string | null
  end_at?: string | null
  is_active?: boolean
  target_type?: 'ARTICLE' | 'EXTERNAL'
  article_id?: string | null
}

export interface UpdateBannerStatusPayload {
  is_active: boolean
}

// Parameters để lấy danh sách (phục vụ lọc & phân trang)
export interface BannerListParams {
  page?: number
  page_size?: number
  search?: string | null
  position?: string | null
  sort_by?: string
  order?: 'asc' | 'desc'
}
