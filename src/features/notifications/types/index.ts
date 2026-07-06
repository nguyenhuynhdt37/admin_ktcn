export interface AdminNotification {
  id: string
  type:
    | 'CONSULTATION_CREATED'
    | 'APPLICATION_CREATED'
    | 'CONTACT_CREATED'
    | 'ACTION_REQUIRED'
  title: string
  message?: string | null
  related_url?: string | null
  read_at?: string | null
  created_at: string
}

export interface NotificationPagination {
  items: AdminNotification[]
  unread_count: number
  total_items: number
}
