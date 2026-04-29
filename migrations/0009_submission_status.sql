-- Migration: Add status column to submissions table
-- Supports non-linear navigation with statuses: not_started, draft, skipped, final

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started'
  CHECK (status IN ('not_started', 'draft', 'skipped', 'final'));

-- Backfill existing data
UPDATE submissions
  SET status = 'final'
  WHERE is_final = TRUE;

UPDATE submissions
  SET status = 'draft'
  WHERE is_final = FALSE
    AND response_text IS NOT NULL
    AND response_text != '';
