import { useEffect } from 'react'
import { isMac } from '@/shared/utils/os'

type HotkeyCallback = (event: KeyboardEvent) => void

interface HotkeyOptions {
  enabled?: boolean
  enableOnContentEditable?: boolean
  enableOnInputs?: boolean
}

/**
 * Custom Hook lắng nghe các sự kiện bàn phím (hotkey).
 * @param shortcut Chuỗi phím tắt, ví dụ: 'mod+k', 'alt+d', 'shift+?', '?'
 * @param callback Hàm callback được gọi khi phím tắt khớp
 * @param options Cấu hình bổ sung (cho phép chạy trên input, enable/disable)
 */
export function useHotkeys(
  shortcut: string,
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
) {
  const { enabled = true, enableOnContentEditable = false, enableOnInputs = false } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Bỏ qua nếu đang gõ trong input, trừ khi được cấu hình cụ thể
      if (isInput) {
        if (target.isContentEditable && !enableOnContentEditable) return
        if (!target.isContentEditable && !enableOnInputs) {
          // Vẫn cho phép các phím tắt hệ thống kết hợp với Cmd/Ctrl
          const hasModifier = event.metaKey || event.ctrlKey || event.altKey
          if (!hasModifier) return
        }
      }

      // Chuẩn hóa phím tắt đã khai báo
      const parts = shortcut.toLowerCase().split('+')
      
      const requiresCtrl = parts.includes('ctrl')
      const requiresCmd = parts.includes('cmd')
      const requiresMod = parts.includes('mod')
      const requiresAlt = parts.includes('alt') || parts.includes('opt')
      const requiresShift = parts.includes('shift')

      // Tìm phím chính (không phải là modifier key)
      const mainKey = parts.find(
        (part) => !['ctrl', 'cmd', 'mod', 'alt', 'opt', 'shift'].includes(part)
      )

      if (!mainKey) return

      // Kiểm tra modifier keys
      const mac = isMac()
      
      // modMatch: Nếu yêu cầu mod/cmd/ctrl thì kiểm tra tương ứng
      let modMatch = true
      if (requiresMod) {
        modMatch = mac ? event.metaKey : event.ctrlKey
      } else if (requiresCmd) {
        modMatch = event.metaKey
      } else if (requiresCtrl) {
        modMatch = event.ctrlKey
      } else {
        // Nếu phím tắt không yêu cầu Ctrl/Cmd/Mod thì đảm bảo người dùng không nhấn chúng
        modMatch = !event.metaKey && !event.ctrlKey
      }

      // altMatch
      const altMatch = requiresAlt ? event.altKey : !event.altKey

      // shiftMatch
      const shiftMatch = requiresShift ? event.shiftKey : !event.shiftKey

      // keyMatch: So sánh phím chính
      let keyMatch = false
      const pressedKey = event.key.toLowerCase()

      if (mainKey === '?') {
        keyMatch = event.key === '?'
      } else if (mainKey === '/') {
        keyMatch = event.key === '/'
      } else {
        keyMatch = pressedKey === mainKey
      }

      // Nếu tất cả khớp, thực thi callback
      if (modMatch && altMatch && shiftMatch && keyMatch) {
        event.preventDefault()
        callback(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcut, callback, enabled, enableOnContentEditable, enableOnInputs])
}
