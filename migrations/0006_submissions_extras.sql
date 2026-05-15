-- Migration 0006: additional submission fields

-- Manual pass override per submission
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS manually_passed BOOLEAN DEFAULT NULL;
