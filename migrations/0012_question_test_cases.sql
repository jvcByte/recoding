-- Migration: Add test_cases JSONB field to questions table
-- Stores array of { input: string, expected_output: string }
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT NULL;
