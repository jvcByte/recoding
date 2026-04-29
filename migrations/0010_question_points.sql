-- Migration: Add optional points field to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT NULL;
