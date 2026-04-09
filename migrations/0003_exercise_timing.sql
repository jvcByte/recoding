-- Migration 0003: add timing fields to exercises table
-- These serve as defaults applied when a new session is created.

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS start_time     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_limit INTERVAL;
