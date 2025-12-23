-- Migration: Add search_documents function
-- Run this in Supabase SQL Editor

-- Add columns to training_data table
ALTER TABLE training_data 
ADD COLUMN IF NOT EXISTS chunk_count INTEGER,
ADD COLUMN IF NOT EXISTS character_count INTEGER,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create or replace search_documents function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding VECTOR(1536),
  p_model_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.chunk_text AS content,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity,
    document_embeddings.metadata
  FROM document_embeddings
  WHERE document_embeddings.model_id = p_model_id
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
