/**
 * Database type definitions for Supabase
 *
 * These types represent the database schema and are used throughout the application
 * to ensure type safety when interacting with Supabase.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month: string
          tokens_used: number
          last_nudge_sent: number
          last_nudge_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          tokens_used?: number
          last_nudge_sent?: number
          last_nudge_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          tokens_used?: number
          last_nudge_sent?: number
          last_nudge_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plan_metadata: {
        Row: {
          id: string
          plan_name: string
          monthly_token_cap: number
          overage_price: number | null
          price_monthly: number
          features: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_name: string
          monthly_token_cap: number
          overage_price?: number | null
          price_monthly: number
          features?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_name?: string
          monthly_token_cap?: number
          overage_price?: number | null
          price_monthly?: number
          features?: Json
          created_at?: string
          updated_at?: string
        }
      }
      token_usage_log: {
        Row: {
          id: string
          user_id: string
          model_id: string | null
          session_id: string | null
          tokens_used: number
          request_type: string | null
          model_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model_id?: string | null
          session_id?: string | null
          tokens_used: number
          request_type?: string | null
          model_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model_id?: string | null
          session_id?: string | null
          tokens_used?: number
          request_type?: string | null
          model_name?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          niche: string | null
          avatar_url: string | null
          subscription_status: 'free' | 'basic' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          niche?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'basic' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          niche?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'basic' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      models: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'created' | 'training' | 'ready' | 'failed'
          training_progress: number
          base_model: string
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'created' | 'training' | 'ready' | 'failed'
          training_progress?: number
          base_model: string
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'created' | 'training' | 'ready' | 'failed'
          training_progress?: number
          base_model?: string
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      branding_config: {
        Row: {
          id: string
          user_id: string
          domain: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          company_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          company_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          company_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      training_data: {
        Row: {
          id: string
          model_id: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          status: 'uploaded' | 'processing' | 'processed' | 'failed'
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          status?: 'uploaded' | 'processing' | 'processed' | 'failed'
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          file_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          status?: 'uploaded' | 'processing' | 'processed' | 'failed'
          processed_at?: string | null
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          model_id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model_id: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          tokens: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          tokens?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          tokens?: number | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_type: 'free' | 'starter' | 'professional' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due'
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: 'free' | 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: 'free' | 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          name: string
          email: string
          niche: string | null
          company: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          niche?: string | null
          company?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          niche?: string | null
          company?: string | null
          created_at?: string
        }
      }
      document_embeddings: {
        Row: {
          id: string
          model_id: string
          training_data_id: string
          chunk_text: string
          chunk_index: number
          start_char: number | null
          end_char: number | null
          embedding: number[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model_id: string
          training_data_id: string
          chunk_text: string
          chunk_index: number
          start_char?: number | null
          end_char?: number | null
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          training_data_id?: string
          chunk_text?: string
          chunk_index?: number
          start_char?: number | null
          end_char?: number | null
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      job_queue: {
        Row: {
          id: string
          job_type: string
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          priority: number
          payload: Json
          result: Json | null
          error: string | null
          attempts: number
          max_attempts: number
          created_at: string
          started_at: string | null
          completed_at: string | null
          failed_at: string | null
          next_retry_at: string | null
        }
        Insert: {
          id?: string
          job_type: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          priority?: number
          payload: Json
          result?: Json | null
          error?: string | null
          attempts?: number
          max_attempts?: number
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          failed_at?: string | null
          next_retry_at?: string | null
        }
        Update: {
          id?: string
          job_type?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          priority?: number
          payload?: Json
          result?: Json | null
          error?: string | null
          attempts?: number
          max_attempts?: number
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          failed_at?: string | null
          next_retry_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_model_id: string
          match_count?: number
          similarity_threshold?: number
        }
        Returns: {
          id: string
          model_id: string
          training_data_id: string
          chunk_text: string
          chunk_index: number
          similarity: number
        }[]
      }
      enqueue_job: {
        Args: {
          p_job_type: string
          p_payload: Json
          p_priority?: number
        }
        Returns: string
      }
      get_next_job: {
        Args: Record<string, never>
        Returns: {
          id: string
          job_type: string
          payload: Json
          attempts: number
        }[]
      }
      complete_job: {
        Args: {
          p_job_id: string
          p_result?: Json
        }
        Returns: void
      }
      fail_job: {
        Args: {
          p_job_id: string
          p_error: string
          p_should_retry?: boolean
        }
        Returns: void
      }
      get_job_stats: {
        Args: Record<string, never>
        Returns: {
          total_jobs: number
          pending_jobs: number
          processing_jobs: number
          completed_jobs: number
          failed_jobs: number
        }[]
      }
      cleanup_old_jobs: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
