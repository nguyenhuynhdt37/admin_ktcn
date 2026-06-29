import { env } from '@/app/config/env'

/**
 * Chuyển đổi object key của media (từ S3/MinIO) hoặc avatar thành URL đầy đủ để hiển thị.
 */
export function getMediaUrl(key: string | null | undefined): string {
  if (!key) return ''
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key
  }
  const cleanKey = key.replace(/^\//, '')
  // Trỏ trực tiếp đến máy chủ lưu trữ MinIO
  return `http://localhost:9000/university-media/${cleanKey}`
}
