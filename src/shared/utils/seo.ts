import { SEO_CONFIG } from '../constants/seo'

/**
 * Decode các thực thể HTML entities (ví dụ: &nbsp;, &lt;, &gt;, &amp;, &#39;, &quot;,...) về văn bản thuần.
 * Sử dụng phần tử DOM trên client-side để đảm bảo giải mã đầy đủ và chính xác tất cả các thực thể.
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return ''
  // Kiểm tra môi trường browser để tránh lỗi crash nếu chạy trong môi trường phi trình duyệt (ví dụ: SSR, test)
  if (typeof document === 'undefined') {
    const translate: Record<string, string> = {
      'nbsp': ' ',
      'amp': '&',
      'quot': '"',
      'lt': '<',
      'gt': '>',
      'apos': "'"
    }
    return html
      .replace(/&(nbsp|amp|quot|lt|gt|apos);/g, (_, entity) => translate[entity] || _)
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  }
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

/**
 * Loại bỏ toàn bộ thẻ HTML, thẻ CKEditor, decode HTML Entities, loại bỏ xuống dòng và chuẩn hóa khoảng trắng.
 * Trả về văn bản thuần (Plain Text).
 */
export function cleanHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  // 1. Loại bỏ các tag HTML/CKEditor bằng regex
  let text = html.replace(/<[^>]*>/g, ' ')
  
  // 2. Decode các thực thể HTML entities (như &nbsp;, &amp;,...)
  text = decodeHtmlEntities(text)
  
  // 3. Loại bỏ ký tự xuống dòng và chuẩn hóa khoảng trắng
  text = text.replace(/[\r\n]+/g, ' ')
  text = text.replace(/\s+/g, ' ')
  
  return text.trim()
}

/**
 * Tự động sinh SEO Title thô từ Title bài viết (chưa bao gồm hậu tố thương hiệu).
 * Chỉ lấy tối đa (MAX_TOTAL_TITLE_LENGTH - SUFFIX.length) ký tự.
 */
export function generateSeoTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return ''
  const maxRawLength = Math.max(0, SEO_CONFIG.MAX_TOTAL_TITLE_LENGTH - SEO_CONFIG.SUFFIX.length)
  return trimmed.length > maxRawLength ? trimmed.slice(0, maxRawLength) : trimmed
}

/**
 * Tự động sinh SEO Description từ trích dẫn (excerpt) hoặc nội dung (content).
 * Đã được làm sạch HTML và cắt ngắn theo MAX_DESCRIPTION_LENGTH.
 */
export function generateSeoDescription(content: string, excerpt?: string): string {
  const baseText = excerpt?.trim() || cleanHtml(content)
  return baseText.length > SEO_CONFIG.MAX_DESCRIPTION_LENGTH
    ? baseText.slice(0, SEO_CONFIG.MAX_DESCRIPTION_LENGTH)
    : baseText
}
