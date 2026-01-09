-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension failed to install';
  END IF;
END $$;

-- Test vector operations
DO $$
DECLARE
  test_vector vector(3);
BEGIN
  test_vector := '[1,2,3]'::vector;
  RAISE NOTICE 'pgvector extension verified successfully';
END $$;
