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
  
  let origin = ''
  try {
    origin = new URL(env.VITE_API_URL).origin
  } catch {
    origin = 'http://localhost:8000'
  }

  if (cleanKey.startsWith('api/v1/portal/media/file/')) {
    return `${origin}/${cleanKey}`
  }

  return `${origin}/api/v1/portal/media/file/${cleanKey}`
}
