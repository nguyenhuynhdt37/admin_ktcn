export interface AIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface AISettings {
  active_model: string;
  active_embedding_model: string;
  chat_models: AIModel[];
  embedding_models: AIModel[];
  embedding_priority_list?: string[];
}

export interface AIPlaygroundRequest {
  model: string;
  prompt: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AIPlaygroundResponse {
  response: string;
  latency_ms: number;
  actual_model: string;
}

export interface AIEmbeddingPlaygroundRequest {
  model: string;
  input: string;
}

export interface AIEmbeddingPlaygroundResponse {
  embedding: number[];
  dimensions: number;
  latency_ms: number;
  actual_model: string;
}

export interface AILogItem {
  id: string;
  user_id: string | null;
  username: string | null;
  model: string;
  prompt: string;
  response: string | null;
  tokens_prompt: number;
  tokens_completion: number;
  cost: number;
  latency_ms: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface AILogListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AILogItem[];
}

export interface AISpendItem {
  label: string;
  total_cost: number;
  total_tokens: number;
  total_requests: number;
}

export interface AIUserSpendItem {
  user_id: string | null;
  username: string;
  full_name: string | null;
  total_cost: number;
  total_tokens: number;
  total_requests: number;
}

export interface AISpendResponse {
  time_series: AISpendItem[];
  user_spend: AIUserSpendItem[];
}

