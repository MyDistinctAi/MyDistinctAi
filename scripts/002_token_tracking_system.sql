-- =====================================================
-- Migration: Token Tracking System
-- Description: Add usage tracking tables for token monitoring
-- Date: October 28, 2025
-- =====================================================

-- =====================================================
-- Table 1: usage_tracking
-- Purpose: Track per-user token usage with monthly resets
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  tokens_used BIGINT NOT NULL DEFAULT 0,
  last_nudge_sent INTEGER DEFAULT 0, -- 0=none, 50, 80, 90
  last_nudge_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per user per month
  UNIQUE(user_id, month)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month
  ON public.usage_tracking(user_id, month);

-- =====================================================
-- Table 2: plan_metadata
-- Purpose: Define plan limits and pricing
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plan_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name VARCHAR(50) NOT NULL UNIQUE,
  monthly_token_cap BIGINT NOT NULL, -- Monthly token limit
  overage_price DECIMAL(10, 4), -- Price per additional token (optional)
  price_monthly DECIMAL(10, 2) NOT NULL, -- Monthly subscription price
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature descriptions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Table 3: token_usage_log
-- Purpose: Detailed log of every API request with tokens
-- =====================================================
CREATE TABLE IF NOT EXISTS public.token_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  tokens_used INTEGER NOT NULL,
  request_type VARCHAR(50), -- 'chat', 'training', 'embedding', etc.
  model_name VARCHAR(100), -- e.g., 'gpt-4', 'mistral-7b'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_token_usage_log_user
  ON public.token_usage_log(user_id, created_at DESC);

-- Index for monthly aggregation
CREATE INDEX IF NOT EXISTS idx_token_usage_log_month
  ON public.token_usage_log(user_id, date_trunc('month', created_at));

-- =====================================================
-- Insert Default Plans
-- =====================================================
INSERT INTO public.plan_metadata (plan_name, monthly_token_cap, overage_price, price_monthly, features)
VALUES
  ('starter', 100000, 0.00001, 29.00, '["3 custom models", "10GB storage", "Email support", "Web app access"]'::jsonb),
  ('professional', 1000000, 0.000008, 99.00, '["Unlimited models", "100GB storage", "Priority support", "White-label branding", "API access", "Desktop app"]'::jsonb),
  ('enterprise', -1, NULL, 0.00, '["Everything in Pro", "Self-hosting support", "Dedicated support", "Custom integrations", "SLA guarantees", "On-premise deployment"]'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;

-- =====================================================
-- Function: log_token_usage
-- Purpose: Log token usage and update monthly totals
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_token_usage(
  p_user_id UUID,
  p_tokens INTEGER,
  p_model_id UUID DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_request_type VARCHAR DEFAULT 'chat',
  p_model_name VARCHAR DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_month VARCHAR(7);
BEGIN
  -- Get current month in YYYY-MM format
  v_current_month := to_char(NOW(), 'YYYY-MM');

  -- Insert into detailed log
  INSERT INTO public.token_usage_log (
    user_id, model_id, session_id, tokens_used, request_type, model_name
  )
  VALUES (
    p_user_id, p_model_id, p_session_id, p_tokens, p_request_type, p_model_name
  );

  -- Update or insert monthly total
  INSERT INTO public.usage_tracking (user_id, month, tokens_used)
  VALUES (p_user_id, v_current_month, p_tokens)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    tokens_used = usage_tracking.tokens_used + p_tokens,
    updated_at = NOW();
END;
$$;

-- =====================================================
-- Function: get_user_usage
-- Purpose: Get current month usage with plan limits
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS TABLE (
  tokens_used BIGINT,
  monthly_cap BIGINT,
  usage_percentage NUMERIC,
  last_nudge_sent INTEGER,
  plan_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_month VARCHAR(7);
BEGIN
  v_current_month := to_char(NOW(), 'YYYY-MM');

  RETURN QUERY
  SELECT
    COALESCE(ut.tokens_used, 0) AS tokens_used,
    COALESCE(pm.monthly_token_cap, 100000) AS monthly_cap,
    ROUND(
      (COALESCE(ut.tokens_used, 0)::NUMERIC / NULLIF(pm.monthly_token_cap, 0)) * 100,
      2
    ) AS usage_percentage,
    COALESCE(ut.last_nudge_sent, 0) AS last_nudge_sent,
    COALESCE(s.plan_type, 'starter') AS plan_name
  FROM public.users u
  LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status = 'active'
  LEFT JOIN public.plan_metadata pm ON pm.plan_name = COALESCE(s.plan_type, 'starter')
  LEFT JOIN public.usage_tracking ut ON ut.user_id = u.id AND ut.month = v_current_month
  WHERE u.id = p_user_id;
END;
$$;

-- =====================================================
-- Function: update_nudge_sent
-- Purpose: Record that a nudge was sent to user
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_nudge_sent(
  p_user_id UUID,
  p_nudge_level INTEGER -- 50, 80, or 90
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_month VARCHAR(7);
BEGIN
  v_current_month := to_char(NOW(), 'YYYY-MM');

  INSERT INTO public.usage_tracking (user_id, month, tokens_used, last_nudge_sent, last_nudge_at)
  VALUES (p_user_id, v_current_month, 0, p_nudge_level, NOW())
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    last_nudge_sent = p_nudge_level,
    last_nudge_at = NOW(),
    updated_at = NOW();
END;
$$;

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to usage_tracking
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to plan_metadata
DROP TRIGGER IF EXISTS update_plan_metadata_updated_at ON public.plan_metadata;
CREATE TRIGGER update_plan_metadata_updated_at
  BEFORE UPDATE ON public.plan_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage_log ENABLE ROW LEVEL SECURITY;

-- usage_tracking policies
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON public.usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- plan_metadata policies (public read)
CREATE POLICY "Anyone can view plan metadata"
  ON public.plan_metadata FOR SELECT
  USING (true);

CREATE POLICY "Only service role can modify plans"
  ON public.plan_metadata FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- token_usage_log policies
CREATE POLICY "Users can view their own token logs"
  ON public.token_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage token logs"
  ON public.token_usage_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT SELECT ON public.plan_metadata TO authenticated;
GRANT SELECT ON public.usage_tracking TO authenticated;
GRANT SELECT ON public.token_usage_log TO authenticated;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON TABLE public.usage_tracking IS 'Tracks monthly token usage per user with nudge history';
COMMENT ON TABLE public.plan_metadata IS 'Defines subscription plans with token limits and pricing';
COMMENT ON TABLE public.token_usage_log IS 'Detailed log of every API request with token counts';
COMMENT ON FUNCTION public.log_token_usage IS 'Logs token usage and updates monthly totals atomically';
COMMENT ON FUNCTION public.get_user_usage IS 'Returns current usage statistics with plan limits';
COMMENT ON FUNCTION public.update_nudge_sent IS 'Records that a usage nudge was sent to the user';

-- =====================================================
-- Migration Complete
-- =====================================================
