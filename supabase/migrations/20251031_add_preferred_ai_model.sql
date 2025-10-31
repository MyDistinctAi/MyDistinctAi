-- Add preferred_ai_model column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_ai_model TEXT DEFAULT 'google/gemini-flash-1.5-8b';

-- Add comment
COMMENT ON COLUMN users.preferred_ai_model IS 'User preferred AI model for chat (OpenRouter model ID)';
