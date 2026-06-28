export interface AISettings {
  id: string
  provider: string
  setting_type: string // "text" | "embedding"
  model: string
  base_url: string | null
  temperature: number
  max_tokens: number
  timeout: number
  is_enabled: boolean
  is_active: boolean
  monthly_budget_limit: number
  monthly_spent: number
  budget_reset_day: number
  currency: string
  api_key_masked: string | null
  updated_at: string
}

export interface AISettingsUpdatePayload {
  setting_type: string // BẮT BUỘC: "text" | "embedding"
  provider: string
  model: string
  base_url: string | null
  api_key?: string | null
  temperature: number
  max_tokens: number
  timeout: number
  is_enabled: boolean
  monthly_budget_limit: number
  budget_reset_day: number
}

export interface AITestConnectionPayload {
  provider: string
  setting_type: string // BẮT BUỘC: "text" | "embedding"
  base_url: string | null
  api_key: string | null
  model: string
  timeout: number
}

export interface AIDetectedModelResponse {
  model_name: string
  input_price_per_1m: number
  output_price_per_1m: number
}

export interface AITestConnectionResponse {
  success: boolean
  message: string
  error_details?: string
  detected_models?: AIDetectedModelResponse[]
}

export interface AISpendingByModelResponse {
  provider: string
  model: string
  total_spent: number
  percentage_of_limit: number
}

export interface AIModelPricing {
  id: string
  provider: string
  model_name: string
  input_price_per_1m: number
  output_price_per_1m: number
  created_at: string
}

export interface AIUsageLog {
  id: string
  user_id: string
  user_username?: string
  provider: string
  model: string
  feature: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
  created_at: string
}

export interface SEOGeneratePayload {
  title: string
  description: string
  content?: string
}

export interface SEOGenerateResponse {
  seo_title: string
  seo_description: string
  seo_keywords: string
}
