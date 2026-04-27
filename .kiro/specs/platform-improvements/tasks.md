# Implementation Plan: Platform Improvements

## Overview

Incremental implementation of four improvements: paste text capture, auto-grading, flag dismissal, and WAT timezone display. Each task builds on the previous, ending with full integration.

## Tasks

- [x] 1. Database migration and shared utilities
  - [x] 1.1 Write migration `migrations/0008_platform_improvements.sql`
    - Add `pasted_text TEXT` to `paste_events`
    - Add `pass_mark NUMERIC` to `exercises`
    - Add `score NUMERIC` to `sessions`
    - Add `dismissed_flags JSONB NOT NULL DEFAULT '[]'` to `submissions`
    - _Requirements: 1.2, 2.2, 3.8, 5.2_

  - [x] 1.2 Create `lib/format.ts` with `formatWAT` and `formatDateWAT`
    - Implement as specified in design using `Africa/Lagos` timezone
    - Handle invalid date strings gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 1.3 Write property test for `formatWAT` (Property 13)
    - **Property 13: WAT formatting is UTC+1**
    - For any valid UTC timestamp, output must represent time + 1 hour and end with `WAT`
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

  - [x] 1.4 Create `lib/scoring.ts` with `recalculateSessionScore`
    - Implement formula: `max(0, min(100, (F/Q)*100 - A*FLAG_PENALTY))`
    - Read `FLAG_PENALTY` from `process.env.FLAG_PENALTY` defaulting to `10`
    - Handle `totalQuestions === 0` edge case (return 0)
    - Persist score to `sessions.score`
    - _Requirements: 3.1, 3.2, 3.3, 3.8_

  - [ ]* 1.5 Write property test for `recalculateSessionScore` formula (Property 4)
    - **Property 4: Score formula correctness**
    - Mock `sql` and verify `max(0, min(100, (F/Q)*100 - A*FLAG_PENALTY))` for arbitrary F, Q, A
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 1.6 Write property test for score non-negativity (Property 5)
    - **Property 5: Score is never negative**
    - Use extreme inputs (large flag counts, zero submissions) to confirm score >= 0
    - **Validates: Requirements 3.3**

- [ ] 2. Checkpoint — Ensure migration and utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Paste detector fix
  - [x] 3.1 Modify `app/participant/session/[id]/CodeEditor.tsx`
    - In `onDidPaste` handler, extract `pastedText` via `model?.getValueInRange(e.range)`
    - Derive `charCount` from `pastedText.length`
    - Include `pasted_text` field in the paste API request body
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7_

  - [x] 3.2 Modify `app/api/events/paste/route.ts`
    - Accept optional `pasted_text` in request body (null for backward compat)
    - Insert `pasted_text` into `paste_events`
    - _Requirements: 1.1, 1.2_

  - [ ]* 3.3 Write property test for paste text round-trip (Property 1)
    - **Property 1: Paste text round-trip**
    - For any string, the value stored in `paste_events.pasted_text` must equal the original pasted string exactly
    - **Validates: Requirements 1.1, 1.2**

- [x] 4. Auto-grading — scoring API and session finalisation
  - [x] 4.1 Modify `app/api/submissions/[sessionId]/final/route.ts`
    - After marking submission final, check if all questions for the session are now final
    - If so, set `sessions.closed_at = now()` and call `recalculateSessionScore(sessionId)`
    - _Requirements: 3.1, 3.8_

  - [x] 4.2 Modify `app/api/instructor/exercises/[id]/route.ts` (PUT handler)
    - Accept `pass_mark?: number | null` in request body
    - Validate `pass_mark >= 0`; return `400` if negative or non-numeric
    - Persist `pass_mark` to `exercises`
    - Call `recalculateSessionScore` for every session belonging to this exercise
    - _Requirements: 2.2, 2.4_

  - [ ]* 4.3 Write property test for pass mark validation (Property 3)
    - **Property 3: Pass mark validation**
    - For any `v >= 0`, API must accept; for any `v < 0`, API must return 400 and leave `pass_mark` unchanged
    - **Validates: Requirements 2.2**

- [-] 5. Flag dismissal API
  - [x] 5.1 Create `app/api/instructor/submissions/[id]/dismiss-flag/route.ts`
    - Auth guard: return 403 for non-instructors
    - Accept `{ reason: string, restore?: boolean }` in body
    - Validate `reason` exists in `flag_reasons`; return 400 otherwise
    - Dismiss: append `{ reason, dismissed_by, dismissed_at }` to `dismissed_flags` if not already present
    - Restore: remove matching entry from `dismissed_flags`
    - Recompute `is_flagged` based on remaining active reasons
    - Call `recalculateSessionScore(sessionId)`
    - Return `{ submission_id, dismissed_flags, is_flagged, score }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_

  - [ ]* 5.2 Write property test for dismissal metadata (Property 8)
    - **Property 8: Dismissal is recorded with correct metadata**
    - For any reason `r` dismissed by instructor `i`, `dismissed_flags` must contain exactly one entry with matching `reason`, `dismissed_by`, and a recent `dismissed_at`
    - **Validates: Requirements 5.2**

  - [ ]* 5.3 Write property test for flag data immutability (Property 9)
    - **Property 9: Original flag data is preserved after dismissal**
    - After dismissing any subset of reasons, `flag_reasons` must remain unchanged
    - **Validates: Requirements 5.3**

  - [ ]* 5.4 Write property test for all-dismissed clears is_flagged (Property 10)
    - **Property 10: All-dismissed clears is_flagged**
    - After dismissing all N reasons, `is_flagged` must be false; after restoring any one, `is_flagged` must be true
    - **Validates: Requirements 5.4**

  - [ ]* 5.5 Write property test for dismiss/restore round-trip (Property 11)
    - **Property 11: Dismiss/restore is a round-trip**
    - Dismissing then restoring a flag must return `dismissed_flags`, `is_flagged`, and `score` to their exact pre-dismissal state
    - **Validates: Requirements 5.8**

  - [ ]* 5.6 Write property test for non-instructor auth guard (Property 12)
    - **Property 12: Non-instructor cannot dismiss flags**
    - Any request from a non-instructor role must return 401 or 403 and must not modify `dismissed_flags`
    - **Validates: Requirements 5.7**

- [ ] 6. Checkpoint — Ensure all API and scoring tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Instructor UI — exercise manager and submissions table
  - [x] 7.1 Modify `app/instructor/exercises/[id]/ExerciseManager.tsx`
    - Add `pass_mark: number | null` to the `Exercise` interface
    - Add `passMark` state and a "Scoring" card with a number input (0–100)
    - Wire "Save Pass Mark" button to call `patch({ pass_mark: ... })`
    - Show loading indicator while saving
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 7.2 Modify `app/instructor/exercises/[id]/submissions/page.tsx`
    - Join `sessions.score` in the query
    - Pass `exercise.pass_mark` as a prop to `SubmissionsTable`
    - _Requirements: 4.1, 4.2_

  - [x] 7.3 Modify `app/instructor/exercises/[id]/submissions/SubmissionsTable.tsx`
    - Add `score: number | null` to `SubmissionRow` and `pass_mark: number | null` prop
    - Add "Score" column displaying `score.toFixed(1)%` or `—`
    - Highlight score cell in `var(--red)` when `score < pass_mark`
    - _Requirements: 4.1, 4.2_

  - [ ]* 7.4 Write property test for score highlight logic (Property 7)
    - **Property 7: Score below threshold is highlighted**
    - For any `s < p`, failure style must be applied; for any `s >= p`, it must not
    - **Validates: Requirements 4.2**

- [x] 8. Instructor UI — submission review page
  - [x] 8.1 Create `app/instructor/submissions/[id]/FlagDismissal.tsx` client component
    - Accept `submissionId`, `flagReasons`, `dismissedFlags` as props
    - Render each reason with active (red badge + Dismiss button) or dismissed (muted/strikethrough + Restore button + who/when) style
    - On dismiss/restore, call `PUT /api/instructor/submissions/[id]/dismiss-flag` and update local state
    - _Requirements: 5.1, 5.2, 5.6, 5.8_

  - [x] 8.2 Modify `app/instructor/submissions/[id]/page.tsx`
    - Replace static flag reasons alert with `<FlagDismissal>` component
    - Add "Pasted Text" column to the paste events table
    - Replace all `new Date(x).toLocaleString()` calls with `formatWAT(x)`
    - _Requirements: 1.2, 5.1, 5.6, 6.1, 6.2, 6.3_

- [x] 9. WAT timestamps across remaining instructor pages
  - [x] 9.1 Modify `app/instructor/exercises/[id]/submissions/SubmissionsTable.tsx`
    - Replace `submitted_at` formatting with `formatWAT`
    - _Requirements: 6.1_

  - [x] 9.2 Modify `app/instructor/feedback/page.tsx`
    - Replace feedback `submitted_at` formatting with `formatWAT`
    - _Requirements: 6.4_

  - [x] 9.3 Modify `app/instructor/users/UserManager.tsx`
    - Replace `created_at` formatting with `formatWAT` or `formatDateWAT`
    - _Requirements: 6.5_

  - [x] 9.4 Modify `app/instructor/LiveMonitor.tsx`
    - Replace heartbeat timestamp formatting with `formatWAT`
    - _Requirements: 6.6_

- [x] 10. Participant dashboard — score display
  - [x] 10.1 Modify `app/participant/page.tsx`
    - Join `sessions.score` and `exercises.pass_mark` in the query
    - For completed sessions, render score badge with pass/fail indicator when threshold is set
    - Use `badge-green` when passing or no threshold, `badge-red` when failing
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [ ]* 10.2 Write property test for pass/fail indicator (Property 6)
    - **Property 6: Pass/fail indicator correctness**
    - For any score `s` and pass mark `p`, "Pass" shown iff `s >= p`, "Fail" shown iff `s < p`
    - **Validates: Requirements 3.5_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check`; run with `npx vitest --run`
- `FLAG_PENALTY` defaults to `10` and is configurable via environment variable
- The `dismissed_flags` overlay never modifies `flag_reasons` — original audit data is always preserved
