-- Migration: Add tests_passed column to submissions
-- NULL = no test cases configured (not applicable)
-- TRUE = all test cases passed
-- FALSE = test cases exist but not all passed yet
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS tests_passed BOOLEAN DEFAULT NULL;
