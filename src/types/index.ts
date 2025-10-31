// Core application types

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  conversation_id: string
}

export interface Conversation {
  id: string
  title: string
  user_id: string
  created_at: Date
  updated_at: Date
  messages: Message[]
}

export interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
}

export interface VectorDocument {
  id: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  status: 'active' | 'canceled' | 'past_due'
  plan: 'free' | 'basic' | 'pro'
  current_period_end: Date
}
