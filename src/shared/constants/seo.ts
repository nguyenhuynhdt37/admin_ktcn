/**
 * Cấu hình SEO tập trung cho toàn hệ thống CMS.
 * Tránh hard-code và giúp dễ dàng thay đổi hậu tố, thương hiệu sau này.
 */
export const SEO_CONFIG = {
  // Hậu tố SEO Title (ví dụ: tên trường/thương hiệu)
  SUFFIX: ' | Trường Kỹ Thuật Và Công Nghệ - Đại học Vinh',
  
  // Giới hạn chiều dài tối đa của SEO Title sau khi ghép hậu tố
  MAX_TOTAL_TITLE_LENGTH: 60,
  
  // Giới hạn chiều dài tối đa của SEO Description
  MAX_DESCRIPTION_LENGTH: 160,
} as const
