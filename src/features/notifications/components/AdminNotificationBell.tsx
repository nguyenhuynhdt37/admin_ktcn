import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import { notificationService } from '../services/notificationService'
import type { AdminNotification } from '../types'

export function AdminNotificationBell() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    try {
      const data = await notificationService.list()
      setItems(data.items)
      setUnreadCount(data.unread_count)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const poll = window.setInterval(refresh, 30_000)
    const stream = new EventSource(notificationService.streamUrl, { withCredentials: true })
    stream.addEventListener('notification', () => void refresh())
    return () => {
      window.clearInterval(poll)
      stream.close()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [isOpen])

  const openNotification = async (item: AdminNotification) => {
    if (!item.read_at) {
      await notificationService.markRead(item.id)
      setUnreadCount((count) => Math.max(0, count - 1))
    }
    setIsOpen(false)
    if (item.related_url) navigate(item.related_url)
  }

  const markAllRead = async () => {
    await notificationService.markAllRead()
    setItems((current) => current.map((item) => ({ ...item, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-[calc(100%+0.6rem)] right-0 z-50 w-[min(23rem,calc(100vw-1rem))] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b px-4">
            <div>
              <h2 className="text-sm font-semibold">Thông báo nội bộ</h2>
              <p className="text-xs text-muted-foreground">{unreadCount} thông báo chưa đọc</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary hover:bg-accent"
              >
                <CheckCheck className="size-4" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-36 items-center justify-center px-5 text-center text-sm text-muted-foreground">
                Chưa có thông báo mới.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openNotification(item)}
                  className={cn(
                    'flex w-full gap-3 border-b px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-accent',
                    !item.read_at && 'bg-primary/[0.045]'
                  )}
                >
                  <span
                    className={cn(
                      'mt-2 size-2 shrink-0 rounded-full',
                      item.read_at ? 'bg-border' : 'bg-primary'
                    )}
                  />
                  <span className="min-w-0">
                    <span className={cn('line-clamp-2 text-sm', !item.read_at && 'font-semibold')}>
                      {item.title}
                    </span>
                    {item.message && (
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.message}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
