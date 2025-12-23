/**
 * Chat Types
 *
 * TypeScript types for chat functionality
 */

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tokens?: number
  created_at: string
}

export interface ChatSession {
  id: string
  model_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  last_message?: string
}

export interface Model {
  id: string
  user_id: string
  name: string
  description: string
  status: 'created' | 'training' | 'ready' | 'failed'
  training_progress?: number
  base_model?: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
}
