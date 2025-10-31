-- Add preferred_ai_model column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_ai_model TEXT DEFAULT 'google/gemini-flash-1.5-8b';

-- Add comment
COMMENT ON COLUMN profiles.preferred_ai_model IS 'User preferred AI model for chat (OpenRouter model ID)';
