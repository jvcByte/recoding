# Implementation Plan: Feedback Improvements

## Overview

Addressing critical issues from participant feedback to improve platform reliability, navigation, and user experience.

---

## Phase 1: Critical Fixes (Before Next Use)

### Task 1: Network Resilience & Autosave

- [ ] 1.1 Implement localStorage backup in CodeEditor
  - Add `saveToLocalStorage(sessionId, questionIndex, code)` helper
  - Call before server autosave attempt
  - Clear on successful server save
  - _Requirements: 1.1_

- [ ] 1.2 Implement localStorage backup in ResponseEditor
  - Add `saveToLocalStorage(sessionId, questionIndex, text)` helper
  - Call before server autosave attempt
  - Clear on successful server save
  - _Requirements: 1.1_

- [ ] 1.3 Add offline queue for failed autosaves
  - Create `lib/offline-queue.ts` with retry logic
  - Store failed requests in localStorage
  - Process queue on reconnection
  - _Requirements: 1.2, 1.4_

- [ ] 1.4 Add save status indicator component
  - Create `SaveStatusIndicator.tsx` with states: idle, saving, saved, offline, error
  - Show in editor toolbar
  - Update based on autosave state
  - _Requirements: 1.3_

- [ ] 1.5 Reduce autosave interval to 3 seconds
  - Update debounce in CodeEditor from 10s to 3s
  - Update debounce in ResponseEditor from 10s to 3s
  - _Requirements: 1.5_

- [ ] 1.6 Add unsaved changes warning
  - Track dirty state in editors
  - Show warning modal before navigation if unsaved
  - Prevent navigation until saved or user confirms
  - _Requirements: 1.6, 1.7_

---

### Task 2: Non-Linear Navigation

- [ ] 2.1 Add `status` column to submissions table
  - Write migration `migrations/0009_submission_status.sql`
  - Add `status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'draft', 'skipped', 'final'))`
  - Backfill existing data: `'final'` if `is_final`, else `'draft'` if has content
  - _Requirements: 2.3_

- [ ] 2.2 Update submission API to handle status
  - Modify `/api/submissions/[sessionId]/autosave/route.ts` to set status = 'draft'
  - Modify `/api/submissions/[sessionId]/final/route.ts` to set status = 'final'
  - _Requirements: 2.4_

- [ ] 2.3 Add skip functionality to session advance API
  - Modify `/api/exercises/[id]/session/advance/route.ts`
  - Accept optional `{ skip: boolean }` in body
  - If skip=true, set status = 'skipped' instead of 'draft'
  - _Requirements: 2.1_

- [ ] 2.4 Update SessionView to allow navigation to reached questions
  - Modify `app/participant/session/[id]/SessionView.tsx`
  - Allow clicking progress dots for questions with index <= current_question_index
  - Add `viewingIndex` state separate from `current_question_index`
  - Show "Back to Current" button when viewing non-current question
  - _Requirements: 2.2_

- [ ] 2.5 Add Skip button to SessionView
  - Add "Skip Question" button next to "Next Question"
  - Call advance API with `skip: true`
  - Update UI to show skipped status
  - _Requirements: 2.1_

- [ ] 2.6 Update progress dots to show all statuses
  - Modify ProgressBar component in SessionView
  - Use different colors/icons for: not_started, draft, skipped, final
  - Add legend explaining status indicators
  - _Requirements: 2.3, 2.6_

- [ ] 2.7 Allow editing non-final submissions
  - Remove `isFinal` check that disables editors
  - Only disable if status = 'final'
  - Add "Reopen" button for final submissions (instructor only)
  - _Requirements: 2.4, 2.5_

---

### Task 3: Question Count Accuracy

- [ ] 3.1 Audit and fix question counting logic
  - Review all queries that count submissions
  - Ensure counting only status = 'final'
  - Fix any caching issues
  - _Requirements: 6.1, 6.2_

- [ ] 3.2 Add unit tests for question status tracking
  - Test status transitions: not_started → draft → final
  - Test status transitions: not_started → skipped → draft → final
  - Test counting logic with various status combinations
  - _Requirements: 6.3_

- [ ] 3.3 Add real-time sync of question counts
  - Use React Query for automatic cache invalidation
  - Refetch on navigation and submission changes
  - _Requirements: 6.4, 6.5_

---

### Task 4: Code Execution Stability

- [ ] 4.1 Improve error messages in code runner
  - Modify `/api/run-code/route.ts`
  - Categorize errors: syntax, runtime, platform, timeout
  - Return structured error with category and user-friendly message
  - _Requirements: 5.2_

- [ ] 4.2 Add error handling and retry logic
  - Wrap code execution in try-catch
  - Log platform errors for debugging
  - Add automatic retry for transient failures
  - _Requirements: 5.3_

- [ ] 4.3 Add syntax checking before submission
  - Add pre-submission validation
  - Show syntax errors before allowing final submission
  - _Requirements: 5.4_

---

## Phase 2: UX Improvements

### Task 5: Question Overview Panel

- [ ] 5.1 Create QuestionOverview component
  - Create `app/participant/session/[id]/QuestionOverview.tsx`
  - Show list of all questions with title, type, status
  - Allow clicking to navigate to reached questions
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5.2 Add toggle button to SessionView
  - Add "Overview" button in header
  - Slide in/out overview panel
  - Maintain current view as default
  - _Requirements: 3.5_

- [ ] 5.3 Show point values in overview
  - Add `points` field to questions table (optional)
  - Display in overview if configured
  - _Requirements: 3.4_

---

### Task 6: Improved Paste Detection

- [ ] 6.1 Add tab blur tracking to paste events
  - Track last blur/focus events in SessionView
  - Add `tab_was_blurred` field to paste_events table
  - Include in paste event API request
  - _Requirements: 4.2_

- [ ] 6.2 Add paste source detection
  - Add `source_type` field to paste_events table
  - Detect internal vs external pastes
  - Compare pasted text with existing submission text
  - _Requirements: 4.3_

- [ ] 6.3 Update paste flagging logic
  - Modify `lib/flagging.ts`
  - Only flag if: char_count > threshold AND (tab_was_blurred OR source_type = 'external')
  - _Requirements: 4.1_

- [ ] 6.4 Add paste event review UI
  - Enhance `FlagDismissal.tsx` to show paste context
  - Show tab blur status and source type
  - Allow instructors to dismiss false positives
  - _Requirements: 4.4, 4.5_

---

### Task 7: Code Testing with Sample Cases

- [ ] 7.1 Add test cases to questions
  - Add `test_cases` JSONB field to questions table
  - Store array of { input, expected_output }
  - _Requirements: 5.5_

- [ ] 7.2 Add "Run Tests" button to CodeEditor
  - Add button in editor toolbar
  - Call `/api/run-code` with test cases
  - Show results in collapsible panel
  - _Requirements: 5.1_

- [ ] 7.3 Display test results
  - Create TestResults component
  - Show pass/fail for each test case
  - Display stdout, stderr, execution time
  - _Requirements: 5.1_

---

## Phase 3: Flexibility & Documentation

### Task 8: Package Flexibility

- [ ] 8.1 Add package metadata to questions
  - Add `allowed_packages` JSONB field to questions table
  - Add `required_package` TEXT field (nullable)
  - Add `documentation_links` JSONB field
  - _Requirements: 7.1, 7.3_

- [ ] 8.2 Update starter code templates
  - Add comments about allowed packages
  - Include documentation links
  - Make templates more flexible
  - _Requirements: 7.2, 7.4_

---

### Task 9: Documentation Access

- [ ] 9.1 Create documentation viewer component
  - Create `app/participant/session/[id]/DocsViewer.tsx`
  - Embed iframe with whitelisted domains
  - Add search functionality
  - _Requirements: 8.1, 8.2_

- [ ] 9.2 Add documentation button to editor
  - Add "Docs" button in toolbar
  - Open docs panel in sidebar
  - Track time spent (not flagged)
  - _Requirements: 8.1_

- [ ] 9.3 Implement domain whitelist
  - Create whitelist of allowed documentation sites
  - Monitor navigation attempts
  - Flag non-whitelisted domain access
  - _Requirements: 8.2, 8.3_

- [ ] 9.4 Bundle offline documentation
  - Package common language/package docs
  - Create searchable index
  - Serve from platform
  - _Requirements: 8.4_

---

## Phase 4: Testing & Deployment

### Task 10: Comprehensive Testing

- [ ] 10.1 Platform stability audit
  - Test all critical user flows
  - Load testing with concurrent users
  - Network failure scenarios
  - _Requirements: 9.1_

- [ ] 10.2 Integration testing
  - Test navigation flows
  - Test autosave reliability
  - Test code execution
  - _Requirements: 9.2_

- [ ] 10.3 User acceptance testing
  - Beta test with small group
  - Gather feedback
  - Iterate on issues
  - _Requirements: 9.2_

---

### Task 11: Timeline & Communication

- [ ] 11.1 Assess timeline feasibility
  - Review remaining work
  - Estimate completion dates
  - Identify scope reduction options
  - _Requirements: 9.3_

- [ ] 11.2 Communicate with participants
  - Share improvement roadmap
  - Set realistic expectations
  - Provide timeline updates
  - _Requirements: 9.4_

---

## Success Criteria

- [ ] Zero data loss incidents in testing
- [ ] All critical bugs fixed
- [ ] Average rating target: 4.0+/5.0
- [ ] <5% false positive paste flags
- [ ] 100% code execution success rate
- [ ] Positive feedback on navigation flexibility

---

## Notes

- Phase 1 tasks are critical and must be completed before next deployment
- Phase 2-3 tasks improve UX but are not blocking
- Phase 4 ensures quality and manages expectations
- Each task references specific requirements from design document
- Prioritize based on participant feedback severity
