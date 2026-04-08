# Implementation Plan: Recoding Exercise Platform

## Overview

Incremental implementation of the Next.js 14 App Router platform. Each task builds on the previous, starting with project scaffolding and database schema, then auth, then participant flows, then anti-cheat capture, then instructor tooling, and finally wiring everything together.

## Tasks

- [x] 1. Project scaffolding and database schema
  - Initialise a Next.js 14 App Router project with TypeScript (`npx create-next-app@latest`)
  - Install dependencies: `@neondatabase/serverless`, `next-auth`, `bcryptjs`, `@types/bcryptjs`, `fast-check` (dev)
  - Create `schema.sql` with all tables: `users`, `exercises`, `exercise_assignments`, `sessions`, `submissions`, `autosave_history`, `paste_events`, `focus_events`, `edit_events`
  - Create `lib/db.ts` exporting a Neon SQL client instance
  - Create `lib/questions.ts` with `loadExercise(slug)` that reads question markdown files from `docs/` using `fs`
  - Create `lib/flagging.ts` with `evaluateFlags(submissionId)` that checks paste count, focus-loss count, and edit-event count against thresholds and returns `{ is_flagged, flag_reasons }`
  - _Requirements: 3.3, 5.3, 8.4, 7.4_

- [ ] 2. Authentication and RBAC
  - [x] 2.1 Implement NextAuth credentials provider
    - Create `app/api/auth/[...nextauth]/route.ts` with a credentials provider that queries `users` table and verifies password with `bcryptjs.compare`
    - Extend the JWT and session callbacks to include `role` and `id` fields
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1_

  - [x] 2.2 Implement RBAC middleware
    - Create `middleware.ts` that reads the NextAuth JWT cookie, checks `role`, and returns 403 / redirects for mismatched routes (`/instructor/*` requires `instructor`, `/participant/*` requires `participant`)
    - _Requirements: 2.2, 2.3_

  - [ ]* 2.3 Write property test for auth enforcement (Properties 1–4)
    - **Property 1: Unauthenticated requests are denied** — generate random API route paths, assert 401 with no session token
    - **Property 2: Invalid credentials never create a session** — generate random credential pairs, assert no session created
    - **Property 3: Password storage is non-reversible** — generate random passwords, assert stored hash ≠ plaintext and bcrypt verify returns true
    - **Property 4: Role enforcement on instructor routes** — generate participant tokens, assert 403 on instructor routes
    - **Validates: Requirements 1.1, 1.3, 1.5, 2.1, 2.3**

  - [ ]* 2.4 Write unit tests for login flow
    - Test valid credentials → session created with correct role
    - Test invalid credentials → error response, no session
    - Test logout → session invalidated, redirect to login
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 3. Checkpoint — Ensure auth tests pass, ask the user if questions arise.

- [ ] 4. Exercise catalogue and question serving
  - [x] 4.1 Seed exercises table and implement catalogue API
    - Write a seed script (`scripts/seed.ts`) that inserts all 11 exercise slugs into the `exercises` table with `enabled = false`
    - Create `GET /api/exercises` route handler that returns exercises assigned to the current participant that are enabled
    - _Requirements: 3.1, 3.3, 11.1, 11.2_

  - [x] 4.2 Implement sequential question API
    - Create `GET /api/exercises/[id]/session` route handler returning current session state (current question index, timing, per-question draft/final status, warning flag when < 300 s remain)
    - Create `GET /api/exercises/[id]/question/[n]` route handler that checks `session.current_question_index >= n` before serving content; returns 403 if not yet reached
    - _Requirements: 3.2, 4.2, 9.1, 9.2, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 4.3 Write property test for catalogue and question access (Properties 5, 6, 15, 20, 21)
    - **Property 5: Exercise catalogue reflects assignment and enabled state** — generate random assignment configs, assert API returns exactly the correct set
    - **Property 6: Question content matches source files** — for each slug, assert API response equals parsed `docs/` content
    - **Property 15: Sequential question access is enforced** — generate session states at index N, assert question N+1 returns 403
    - **Property 20: Remaining time warning threshold** — generate sessions with < 300 s remaining, assert warning flag present
    - **Property 21: Question status reflects draft and final state** — generate mixed submission states, assert per-question status list is accurate
    - **Validates: Requirements 3.1, 3.3, 9.1, 9.2, 12.3, 12.4**

  - [x] 4.4 Build ExerciseCatalogue and SessionView UI
    - Create `app/participant/page.tsx` (Server Component) rendering the exercise catalogue from `GET /api/exercises`; show locked state for disabled/unassigned exercises
    - Create `app/participant/session/[id]/page.tsx` hosting `SessionView` Client Component with `QuestionDisplay`, `ProgressBar`, and `TimerDisplay`
    - _Requirements: 3.1, 3.4, 12.1, 12.2, 12.3_

- [ ] 5. Response submission and persistence
  - [x] 5.1 Implement autosave, final submit, and restore API routes
    - Create `POST /api/submissions/[sessionId]/autosave` — upserts `submissions` row and inserts into `autosave_history`; rejects if session closed or submission is final
    - Create `POST /api/submissions/[sessionId]/final` — sets `is_final = true`; rejects if already final or session closed
    - Create `GET /api/submissions/[sessionId]/restore` — returns latest `response_text` for the current question
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Implement ResponseEditor with autosave loop
    - Create `ResponseEditor` Client Component with a `useEffect` autosave interval (≤ 30 s) calling `POST autosave`
    - On mount, call `GET restore` and populate the textarea
    - Display unsaved-draft warning when navigating away without finalising
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ]* 5.3 Write property test for submission persistence (Properties 7–9)
    - **Property 7: Late submissions are rejected** — generate timestamps after session end time, assert 410 response
    - **Property 8: Finalized submissions cannot be edited** — mark submission final, assert subsequent autosave returns 409
    - **Property 9: Autosave round-trip preserves response text** — generate random response texts, autosave then restore, assert equality
    - **Validates: Requirements 4.4, 5.2, 5.3, 5.4**

  - [ ]* 5.4 Write unit tests for session lifecycle
    - Test session start, expiry (duration limit reached → auto-save + close editor), and manual close
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Checkpoint — Ensure all submission and session tests pass, ask the user if questions arise.

- [ ] 7. Anti-cheat event capture
  - [x] 7.1 Implement anti-cheat API routes
    - Create `POST /api/events/paste` — inserts into `paste_events` with `char_count`, `occurred_at`, `submission_id`
    - Create `POST /api/events/focus` — inserts into `focus_events` with `lost_at`, `regained_at`, `duration_ms`, `session_id`; after insert, calls `evaluateFlags` to check focus-loss threshold
    - Create `POST /api/events/keystrokes` — batch-inserts into `edit_events`; stores `event_type`, `position`, `char_count`, `occurred_at` only (no raw characters)
    - _Requirements: 6.1, 6.2, 7.2, 8.1, 8.2_

  - [x] 7.2 Wire anti-cheat hooks into ResponseEditor
    - Add `onPaste` handler that calls `POST /api/events/paste` and shows the paste-detected warning banner
    - Add `document.addEventListener('visibilitychange')` and `window.addEventListener('blur')` handlers that call `POST /api/events/focus`
    - Add `onInput` handler that records insert/delete edit events locally and batch-uploads to `POST /api/events/keystrokes` on autosave
    - _Requirements: 6.1, 6.3, 7.1, 8.1_

  - [x] 7.3 Implement auto-flagging in `lib/flagging.ts`
    - After each autosave and on session close, call `evaluateFlags(submissionId)` and update `submissions.is_flagged` and `flag_reasons`
    - Flag if paste events > 0, focus-loss events > threshold, or edit events < 10 for response > 200 chars
    - _Requirements: 7.4, 8.4_

  - [ ]* 7.4 Write property tests for anti-cheat event logging (Properties 10–14)
    - **Property 10: Paste events are fully logged** — generate random paste events, assert stored record contains char_count, occurred_at, submission_id
    - **Property 11: Focus-loss events are fully logged** — generate random focus events, assert stored record contains lost_at and duration_ms
    - **Property 12: Focus-loss threshold triggers flagging** — generate sessions exceeding threshold, assert is_flagged = true with focus-loss reason
    - **Property 13: Edit events stored without raw character content** — generate edit events, assert no raw character field in stored record
    - **Property 14: Low-edit-count submissions are auto-flagged** — generate submissions with > 200 chars and < 10 edit events, assert is_flagged = true
    - **Validates: Requirements 6.1, 6.2, 7.2, 7.4, 8.1, 8.4**

- [ ] 8. Timed session management
  - [x] 8.1 Implement session timing API and advance-question logic
    - Extend `GET /api/exercises/[id]/session` to enforce `start_time`, `end_time`, and `duration_limit`; return 423 if not yet open, 410 if closed
    - Add `POST /api/exercises/[id]/session/advance` route that increments `current_question_index`, locks the previous question's submission, and returns the new index
    - _Requirements: 4.1, 4.3, 4.4, 9.3, 9.4_

  - [ ]* 8.2 Write property test for sequential locking (Property 16)
    - **Property 16: Advancing locks the previous question** — generate sessions advanced past question N, assert autosave for question N returns 409
    - **Validates: Requirements 9.3, 9.4**

  - [ ]* 8.3 Write unit tests for session timing edge cases
    - Test session not yet open → 423, session expired → auto-close, duplicate final submit → 409
    - _Requirements: 4.1, 4.4_

- [x] 9. Checkpoint — Ensure all anti-cheat and session timing tests pass, ask the user if questions arise.

- [ ] 10. SSE live monitoring stream
  - [x] 10.1 Implement SSE endpoint
    - Create `GET /api/events/stream` Route Handler that returns a `ReadableStream` with `Content-Type: text/event-stream`
    - On each anti-cheat event write (paste, focus, keystroke batch), push a server-sent event to connected instructor clients (use a simple in-memory event emitter or poll the DB every few seconds)
    - _Requirements: (supports Requirement 10 instructor monitoring)_

  - [x] 10.2 Build LiveMonitor Client Component
    - Create `LiveMonitor` in `app/instructor/` that opens an `EventSource` to `/api/events/stream` and renders incoming anti-cheat events in real time
    - _Requirements: 10.1, 10.3_

- [ ] 11. Instructor management and submission review
  - [x] 11.1 Implement instructor exercise management API
    - Create `GET /api/instructor/exercises` and `PUT /api/instructor/exercises/[id]` route handlers for enabling/disabling exercises, updating session timing, and managing participant assignments
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 11.2 Implement submission review API
    - Create `GET /api/instructor/exercises/[id]/submissions` returning all submissions with flag indicators
    - Create `GET /api/instructor/submissions/[id]` returning full detail: response text, autosave history, paste events, focus events, edit events
    - Create `PUT /api/instructor/submissions/[id]/review` for adding a review note
    - Create `GET /api/instructor/exercises/[id]/export` returning CSV or JSON of all submissions
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [ ]* 11.3 Write property tests for instructor data completeness (Properties 17–19)
    - **Property 17: Submission detail contains all audit data** — generate submissions with events, assert detail endpoint returns all audit fields
    - **Property 18: Submission export is complete** — generate random submission sets, assert export contains one record per submission with all required fields
    - **Property 19: Session timing updates propagate to unstarted sessions** — update timing, assert unstarted session state reflects new timing
    - **Validates: Requirements 10.2, 10.5, 11.3**

  - [ ]* 11.4 Write unit tests for instructor CRUD
    - Test enable/disable exercise, assign participant, add review note, export CSV and JSON structure
    - _Requirements: 11.1, 11.2, 10.4, 10.5_

  - [x] 11.5 Build instructor UI pages
    - Create `app/instructor/page.tsx` (Server Component) with `InstructorDashboard` and `LiveMonitor`
    - Create `app/instructor/exercises/[id]/page.tsx` with `ExerciseManager` (enable/disable, timing, assignments, preview)
    - Create `app/instructor/submissions/[id]/page.tsx` with `SubmissionDetail`, `TypingReplay`, and `ExportButton`
    - Create `SubmissionList` Server Component with flag indicators for the exercise submissions view
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.4_

- [x] 12. Checkpoint — Ensure all instructor and SSE tests pass, ask the user if questions arise.

- [ ] 13. Integration wiring and login page
  - [x] 13.1 Create login page
    - Create `app/login/page.tsx` with a credential form that calls NextAuth `signIn`; display error messages on failure; redirect to role-appropriate dashboard on success
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 13.2 Wire session expiry into the UI
    - In `SessionView`, poll `GET /api/exercises/[id]/session` every 10 s; when session is closed or time runs out, disable `ResponseEditor` and show a session-closed banner
    - _Requirements: 4.3, 4.4_

  - [-] 13.3 Wire question advance and locking into SessionView
    - Connect the "Next Question" button to `POST /api/exercises/[id]/session/advance`; on success, lock the previous `ResponseEditor` and render the next `QuestionDisplay`
    - _Requirements: 9.3, 9.4_

  - [ ]* 13.4 Write integration tests for end-to-end flows
    - Test: login → start session → answer questions → submit final → instructor views submission with all audit data
    - Test: SSE stream delivers paste and focus events to instructor in real time
    - _Requirements: 1.2, 5.2, 6.4, 7.3, 10.2_

- [~] 14. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** and are tagged with their design property number
- Unit tests use the Next.js built-in Jest/Vitest setup
- The `docs/` directory is bundled with the Vercel deployment — `fs` reads work in Route Handlers
- Anti-cheat event hooks live entirely in `ResponseEditor` (Client Component); no raw keystrokes are ever sent to the server
