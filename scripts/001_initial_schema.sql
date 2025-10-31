-- =====================================================
-- MyDistinctAI Database Schema Migration
-- Version: 001 - Initial Schema
-- Description: Creates all core tables, indexes, RLS policies, and triggers
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: users
-- Description: User accounts and profiles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    niche TEXT,
    avatar_url TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- -----------------------------------------------------
-- Table: models
-- Description: Custom AI models created by users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'training', 'ready', 'failed')),
    training_progress INTEGER DEFAULT 0 CHECK (training_progress >= 0 AND training_progress <= 100),
    base_model TEXT NOT NULL DEFAULT 'mistral:7b',
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at DESC);

-- -----------------------------------------------------
-- Table: branding_config
-- Description: White-label branding configuration
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS branding_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0ea5e9',
    secondary_color TEXT DEFAULT '#64748b',
    company_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for domain lookup
CREATE INDEX IF NOT EXISTS idx_branding_config_user_id ON branding_config(user_id);
CREATE INDEX IF NOT EXISTS idx_branding_config_domain ON branding_config(domain);

-- -----------------------------------------------------
-- Table: training_data
-- Description: Files uploaded for model training
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_training_data_model_id ON training_data(model_id);
CREATE INDEX IF NOT EXISTS idx_training_data_status ON training_data(status);

-- -----------------------------------------------------
-- Table: chat_sessions
-- Description: Chat conversation sessions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_model_id ON chat_sessions(model_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- -----------------------------------------------------
-- Table: chat_messages
-- Description: Individual messages in chat sessions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tokens INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- -----------------------------------------------------
-- Table: subscriptions
-- Description: User subscription and payment data
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- -----------------------------------------------------
-- Table: waitlist
-- Description: Pre-launch waitlist signups
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    niche TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_config_updated_at BEFORE UPDATE ON branding_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Users Table Policies
-- -----------------------------------------------------

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile (needed for registration)
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- -----------------------------------------------------
-- Models Table Policies
-- -----------------------------------------------------

-- Users can view their own models
CREATE POLICY "Users can view own models" ON models
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own models
CREATE POLICY "Users can create own models" ON models
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own models
CREATE POLICY "Users can update own models" ON models
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own models
CREATE POLICY "Users can delete own models" ON models
    FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- Branding Config Policies
-- -----------------------------------------------------

-- Users can view their own branding config
CREATE POLICY "Users can view own branding" ON branding_config
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own branding config
CREATE POLICY "Users can create own branding" ON branding_config
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own branding config
CREATE POLICY "Users can update own branding" ON branding_config
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own branding config
CREATE POLICY "Users can delete own branding" ON branding_config
    FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- Training Data Policies
-- -----------------------------------------------------

-- Users can view training data for their models
CREATE POLICY "Users can view own training data" ON training_data
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM models
            WHERE models.id = training_data.model_id
            AND models.user_id = auth.uid()
        )
    );

-- Users can insert training data for their models
CREATE POLICY "Users can create training data" ON training_data
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM models
            WHERE models.id = training_data.model_id
            AND models.user_id = auth.uid()
        )
    );

-- Users can delete training data for their models
CREATE POLICY "Users can delete training data" ON training_data
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM models
            WHERE models.id = training_data.model_id
            AND models.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------
-- Chat Sessions Policies
-- -----------------------------------------------------

-- Users can view their own chat sessions
CREATE POLICY "Users can view own sessions" ON chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own chat sessions
CREATE POLICY "Users can create own sessions" ON chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat sessions
CREATE POLICY "Users can update own sessions" ON chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own sessions" ON chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- Chat Messages Policies
-- -----------------------------------------------------

-- Users can view messages in their sessions
CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Users can insert messages in their sessions
CREATE POLICY "Users can create messages" ON chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------
-- Subscriptions Policies
-- -----------------------------------------------------

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscription" ON subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- Waitlist Policies (Public insert only)
-- -----------------------------------------------------

-- Anyone can insert to waitlist (pre-auth)
CREATE POLICY "Anyone can join waitlist" ON waitlist
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for training data (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-data', 'training-data', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for logos
CREATE POLICY "Logo images are publicly accessible" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'logos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own logo" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'logos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own logo" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'logos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for training data (private)
CREATE POLICY "Users can access their own training data" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'training-data' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload training data" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'training-data' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their training data" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'training-data' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - models';
    RAISE NOTICE '  - branding_config';
    RAISE NOTICE '  - training_data';
    RAISE NOTICE '  - chat_sessions';
    RAISE NOTICE '  - chat_messages';
    RAISE NOTICE '  - subscriptions';
    RAISE NOTICE '  - waitlist';
    RAISE NOTICE '';
    RAISE NOTICE 'Storage buckets created:';
    RAISE NOTICE '  - avatars (public)';
    RAISE NOTICE '  - logos (public)';
    RAISE NOTICE '  - training-data (private)';
    RAISE NOTICE '';
    RAISE NOTICE 'Row Level Security enabled on all tables';
    RAISE NOTICE 'Triggers configured for automatic updated_at timestamps';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Test the connection with: node scripts/test-supabase.mjs';
END $$;
