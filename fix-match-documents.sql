-- Update match_documents function to handle string embeddings
-- The embeddings are stored as JSON strings, not vector type
-- So we need to cast them in the function

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding text, -- Changed from vector to text
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

-- Test it
SELECT * FROM match_documents(
  (SELECT embedding FROM document_embeddings LIMIT 1),
  '353608a6-c981-4dfb-9e75-c70fcdeeba2b'::uuid,
  5,
  0.0
);
