-- Migration 0008: platform improvements
-- Safe for production: all changes are additive (IF NOT EXISTS / DEFAULT values)

-- 1. Capture exact pasted text in paste events
ALTER TABLE paste_events
  ADD COLUMN IF NOT EXISTS pasted_text TEXT;

-- 2. Pass mark threshold per exercise (nullable = no threshold)
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS pass_mark NUMERIC;

-- 3. Computed score per session (nullable until first calculation)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS score NUMERIC;

-- 4. Flag dismissal audit overlay on submissions
--    Shape: [{ reason, dismissed_by, dismissed_at }]
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS dismissed_flags JSONB NOT NULL DEFAULT '[]'::jsonb;
