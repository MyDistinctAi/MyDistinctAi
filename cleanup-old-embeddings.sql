-- OpenRouter RAG Testing - Database Cleanup Script
-- Date: November 3, 2025
-- Purpose: Remove old Ollama embeddings (768 dimensions) before re-uploading with OpenAI (1536 dimensions)

-- Step 1: Check current embeddings
SELECT
  model_id,
  COUNT(*) as embedding_count,
  array_length(embedding, 1) as dimension
FROM document_embeddings
GROUP BY model_id, array_length(embedding, 1)
ORDER BY model_id, dimension;

-- Step 2: Check training data files
SELECT
  id,
  file_name,
  status,
  model_id,
  created_at
FROM training_data
WHERE file_name LIKE '%handbook%'
ORDER BY created_at DESC;

-- Step 3: Delete old 768-dimension embeddings (Ollama)
DELETE FROM document_embeddings
WHERE array_length(embedding, 1) = 768;

-- Step 4: Verify deletion
SELECT
  'Embeddings remaining' as status,
  COUNT(*) as count,
  array_length(embedding, 1) as dimension
FROM document_embeddings
GROUP BY array_length(embedding, 1);

-- Step 5: Delete old training data for company-handbook.txt
DELETE FROM training_data
WHERE file_name = 'company-handbook.txt'
AND status = 'processed';

-- Step 6: Final verification
SELECT
  'Training data remaining' as status,
  COUNT(*) as count
FROM training_data
WHERE file_name LIKE '%handbook%';

-- Expected result after cleanup:
-- - 0 embeddings with 768 dimensions
-- - 0 training data entries for company-handbook.txt
-- - Ready for re-upload with OpenAI embeddings (1536 dimensions)

-- Run this in Supabase SQL Editor:
-- 1. Copy and paste this entire script
-- 2. Click "Run" or press Ctrl+Enter
-- 3. Review the results
-- 4. Proceed to re-upload test document
