-- Job Queue System
-- Simple database-based job queue for background processing

-- Create job_queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job metadata
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INT DEFAULT 0,

  -- Job data
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,

  -- Retry logic
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_next_retry ON job_queue(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_created_at ON job_queue(created_at DESC);

-- Enable RLS
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can do everything (for background worker)
CREATE POLICY "Service role has full access" ON job_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own jobs (based on payload.user_id)
CREATE POLICY "Users can view their own jobs" ON job_queue
  FOR SELECT
  USING (
    auth.uid()::text = (payload->>'user_id')
  );

-- Function to enqueue a job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type VARCHAR,
  p_payload JSONB,
  p_priority INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO job_queue (job_type, payload, priority)
  VALUES (p_job_type, p_payload, p_priority)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- Function to get next pending job
CREATE OR REPLACE FUNCTION get_next_job()
RETURNS TABLE (
  id UUID,
  job_type VARCHAR,
  payload JSONB,
  attempts INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Lock and claim next available job
  SELECT job_queue.id INTO v_job_id
  FROM job_queue
  WHERE status = 'pending'
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If job found, mark as processing
  IF v_job_id IS NOT NULL THEN
    UPDATE job_queue
    SET
      status = 'processing',
      started_at = NOW(),
      attempts = attempts + 1
    WHERE job_queue.id = v_job_id;

    -- Return the job
    RETURN QUERY
    SELECT
      job_queue.id,
      job_queue.job_type,
      job_queue.payload,
      job_queue.attempts
    FROM job_queue
    WHERE job_queue.id = v_job_id;
  END IF;
END;
$$;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE job_queue
  SET
    status = 'completed',
    result = p_result,
    completed_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- Function to mark job as failed
CREATE OR REPLACE FUNCTION fail_job(
  p_job_id UUID,
  p_error TEXT,
  p_should_retry BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempts INT;
  v_max_attempts INT;
BEGIN
  -- Get current attempts
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM job_queue
  WHERE id = p_job_id;

  -- Check if should retry
  IF p_should_retry AND v_attempts < v_max_attempts THEN
    -- Schedule retry with exponential backoff
    UPDATE job_queue
    SET
      status = 'pending',
      error = p_error,
      next_retry_at = NOW() + (POWER(2, v_attempts) || ' minutes')::INTERVAL
    WHERE id = p_job_id;
  ELSE
    -- Mark as permanently failed
    UPDATE job_queue
    SET
      status = 'failed',
      error = p_error,
      failed_at = NOW()
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_job_stats()
RETURNS TABLE (
  total_jobs BIGINT,
  pending_jobs BIGINT,
  processing_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT
)
LANGUAGE sql
AS $$
  SELECT
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs
  FROM job_queue;
$$;

-- Function to clean up old completed jobs (retention: 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM job_queue
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '7 days'
    OR failed_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON TABLE job_queue IS 'Background job queue for async processing';
COMMENT ON FUNCTION enqueue_job IS 'Add a new job to the queue';
COMMENT ON FUNCTION get_next_job IS 'Get and claim the next pending job (FIFO with priority)';
COMMENT ON FUNCTION complete_job IS 'Mark a job as successfully completed';
COMMENT ON FUNCTION fail_job IS 'Mark a job as failed, optionally scheduling retry';
COMMENT ON FUNCTION get_job_stats IS 'Get statistics about job queue status';
COMMENT ON FUNCTION cleanup_old_jobs IS 'Remove completed/failed jobs older than 7 days';
