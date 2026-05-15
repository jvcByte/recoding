-- ============================================================
-- Reset script — wipes all session/exercise data, keeps users
-- Safe to run between exam cohorts.
-- Run with: psql $DATABASE_URL -f migrations/reset_keep_users.sql
-- ============================================================

-- Delete in dependency order
TRUNCATE TABLE
  audit_log,
  autosave_history,
  edit_events,
  paste_events,
  focus_events,
  submissions,
  sessions,
  exercise_assignments,
  questions,
  exercises,
  feedback
RESTART IDENTITY CASCADE;
