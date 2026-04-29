-- Migration: Add package metadata fields to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS allowed_packages JSONB DEFAULT NULL;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS required_package TEXT DEFAULT NULL;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS documentation_links JSONB DEFAULT NULL;
