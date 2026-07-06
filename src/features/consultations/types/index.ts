export type ConsultationStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'CONSULTING'
  | 'COMPLETED'
  | 'NOT_QUALIFIED'

export type ConsultationRequestType =
  | 'ADMISSION_CONSULTING'
  | 'CAMPUS_VISIT'
  | 'RECEIVE_MATERIALS'
  | 'APPLICATION_REGISTRATION'

export interface ConsultationLead {
  id: string
  reference_code: string
  full_name: string
  phone: string
  email: string
  interested_major: string
  request_type: ConsultationRequestType
  message?: string | null
  status: ConsultationStatus
  assigned_to_id?: string | null
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

export interface ConsultationPagination {
  items: ConsultationLead[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface ConsultationListParams {
  page: number
  page_size: number
  search?: string
  status?: ConsultationStatus
}
