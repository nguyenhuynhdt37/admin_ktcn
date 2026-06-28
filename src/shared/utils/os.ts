/**
 * Kiểm tra xem hệ điều hành của người dùng có phải là macOS hay không.
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.userAgent.indexOf('Mac') !== -1
}

/**
 * Trả về biểu tượng hoặc nhãn phím Control/Command tương ứng với hệ điều hành.
 * macOS -> ⌘, Windows/Linux -> Ctrl
 */
export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl'
}

/**
 * Trả về biểu tượng hoặc nhãn phím Alt/Option tương ứng với hệ điều hành.
 * macOS -> ⌥, Windows/Linux -> Alt
 */
export function getAltKey(): string {
  return isMac() ? '⌥' : 'Alt'
}

/**
 * Trả về tên hiển thị đầy đủ của phím bổ trợ chính.
 */
export function getModifierName(): string {
  return isMac() ? 'Command' : 'Control'
}
