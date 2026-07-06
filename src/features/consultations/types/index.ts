export type ConsultationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'

export interface UserMin {
  id: string
  username: string
  full_name: string
}

export interface Consultation {
  id: string
  request_code: string
  fullname: string
  phone: string
  email?: string
  notes?: string
  status: ConsultationStatus
  assigned_to?: string
  assignee?: UserMin
  created_at: string
  updated_at: string
}

export interface ConsultationPagination {
  items: Consultation[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface ConsultationUpdatePayload {
  status?: ConsultationStatus
  notes?: string
  assigned_to?: string | null
}
