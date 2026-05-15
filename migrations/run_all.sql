-- ============================================================
-- Master migration script — safe to run on any DB at any state
-- All statements use IF NOT EXISTS / IF EXISTS guards
-- Run with: psql $DATABASE_URL -f migrations/run_all.sql
-- ============================================================

-- ── 0001: Initial schema ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('participant', 'instructor')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug           TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    enabled        BOOLEAN NOT NULL DEFAULT false,
    question_count INT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_assignments (
    exercise_id UUID REFERENCES exercises(id),
    user_id     UUID REFERENCES users(id),
    PRIMARY KEY (exercise_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id            UUID NOT NULL REFERENCES exercises(id),
    user_id                UUID NOT NULL REFERENCES users(id),
    start_time             TIMESTAMPTZ,
    end_time               TIMESTAMPTZ,
    duration_limit         INTERVAL,
    started_at             TIMESTAMPTZ,
    closed_at              TIMESTAMPTZ,
    current_question_index INT NOT NULL DEFAULT 0,
    UNIQUE (exercise_id, user_id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     UUID NOT NULL REFERENCES sessions(id),
    question_index INT NOT NULL,
    response_text  TEXT NOT NULL DEFAULT '',
    is_final       BOOLEAN NOT NULL DEFAULT false,
    is_flagged     BOOLEAN NOT NULL DEFAULT false,
    flag_reasons   TEXT[],
    review_note    TEXT,
    submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, question_index)
);

CREATE TABLE IF NOT EXISTS autosave_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    response_text TEXT NOT NULL,
    saved_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paste_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    char_count    INT NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS focus_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES sessions(id),
    lost_at     TIMESTAMPTZ NOT NULL,
    regained_at TIMESTAMPTZ,
    duration_ms INT
);

CREATE TABLE IF NOT EXISTS edit_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    event_type    TEXT NOT NULL CHECK (event_type IN ('insert', 'delete')),
    position      INT NOT NULL,
    char_count    INT NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL
);

-- ── 0002: Audit log ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL REFERENCES users(id),
    action      TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    detail      JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx  ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS audit_log_target_idx ON audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS audit_log_time_idx   ON audit_log (occurred_at DESC);

-- ── 0003: Exercise timing ────────────────────────────────────

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS start_time     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_limit INTERVAL;

-- ── 0004: Questions table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id    UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    text           TEXT NOT NULL,
    type           TEXT NOT NULL DEFAULT 'written' CHECK (type IN ('written', 'code')),
    language       TEXT NOT NULL DEFAULT 'text',
    starter        TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (exercise_id, question_index)
);

CREATE INDEX IF NOT EXISTS questions_exercise_idx ON questions (exercise_id, question_index);

-- ── 0005: Scoring and flags ──────────────────────────────────

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS passed          BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS passed_override BOOLEAN DEFAULT NULL;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS min_questions_required INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flag_fails             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_paste_chars        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_focus_loss         INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_edit_events        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_response_length    INTEGER DEFAULT NULL;

-- ── 0006: Submission extras ──────────────────────────────────

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS manually_passed BOOLEAN DEFAULT NULL;

-- ── 0007: Feedback table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating         INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments       TEXT,
    challenges     TEXT,
    improvements   TEXT,
    malfunctions   TEXT,
    attachment_url TEXT,
    submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user      ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted ON feedback (submitted_at DESC);

-- ── 0008: Platform improvements ──────────────────────────────

ALTER TABLE paste_events
  ADD COLUMN IF NOT EXISTS pasted_text TEXT;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS pass_mark NUMERIC;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS score NUMERIC;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS dismissed_flags JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── 0009: Submission status ──────────────────────────────────

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started'
  CHECK (status IN ('not_started', 'draft', 'skipped', 'final'));

-- Backfill existing data
UPDATE submissions SET status = 'final' WHERE is_final = TRUE AND status = 'not_started';
UPDATE submissions SET status = 'draft'
  WHERE is_final = FALSE
    AND status = 'not_started'
    AND response_text IS NOT NULL
    AND response_text != '';

-- ── 0010: Question points ────────────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT NULL;

-- ── 0011: Paste event context ────────────────────────────────

ALTER TABLE paste_events
  ADD COLUMN IF NOT EXISTS tab_was_blurred BOOLEAN DEFAULT FALSE;

ALTER TABLE paste_events
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'unknown'
  CHECK (source_type IN ('internal', 'external', 'unknown'));

-- ── 0012: Question test cases ────────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT NULL;

-- ── 0013: Question package metadata ─────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS allowed_packages    JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS required_package    TEXT  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS documentation_links JSONB DEFAULT NULL;

-- ── 0014: Submission tests_passed ───────────────────────────

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS tests_passed BOOLEAN DEFAULT NULL;
