-- Reset embeddings and re-process files with current Ollama model
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Delete all embeddings
DELETE FROM document_embeddings;

-- 2. Reset training data status
UPDATE training_data 
SET status = 'uploaded', processed_at = NULL
WHERE model_id = '353608a6-c981-4dfb-9e75-c70fcdeeba2b';

-- 3. Clear old jobs
DELETE FROM job_queue 
WHERE job_type = 'process_training_data';

-- 4. Create new jobs for file processing
INSERT INTO job_queue (job_type, payload, priority)
SELECT 
  'process_training_data',
  jsonb_build_object('trainingDataId', id::text),
  1
FROM training_data
WHERE status = 'uploaded'
  AND model_id = '353608a6-c981-4dfb-9e75-c70fcdeeba2b';

COMMIT;

-- Verify
SELECT 'Jobs created:' as status, COUNT(*) as count 
FROM job_queue 
WHERE job_type = 'process_training_data';

SELECT 'Training data reset:' as status, COUNT(*) as count 
FROM training_data 
WHERE status = 'uploaded' 
  AND model_id = '353608a6-c981-4dfb-9e75-c70fcdeeba2b';
