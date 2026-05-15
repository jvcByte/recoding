-- Migration 0005: scoring, pass/fail constraints, and flag controls

-- Pass/fail result per session
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS passed          BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS passed_override BOOLEAN DEFAULT NULL;

-- Per-exercise pass/fail constraints
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS min_questions_required INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flag_fails             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_paste_chars        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_focus_loss         INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_edit_events        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_response_length    INTEGER DEFAULT NULL;
