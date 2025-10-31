-- Drop the old function first to avoid overloading conflict
DROP FUNCTION IF EXISTS match_documents(vector, uuid, int, float);

-- Create the new function that accepts text
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding text,
  match_model_id uuid,
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  training_data_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.training_data_id,
    de.chunk_text,
    de.chunk_index,
    1 - (de.embedding::vector <=> query_embedding::vector) AS similarity
  FROM document_embeddings de
  WHERE de.model_id = match_model_id
    AND 1 - (de.embedding::vector <=> query_embedding::vector) >= similarity_threshold
  ORDER BY de.embedding::vector <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
