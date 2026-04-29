-- Migration: Add tab_was_blurred and source_type to paste_events
ALTER TABLE paste_events
  ADD COLUMN IF NOT EXISTS tab_was_blurred BOOLEAN DEFAULT FALSE;

ALTER TABLE paste_events
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'unknown'
  CHECK (source_type IN ('internal', 'external', 'unknown'));
