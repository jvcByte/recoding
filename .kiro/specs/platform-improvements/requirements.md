# Requirements Document

## Introduction

This spec covers four improvements to the recoding platform:

1. **Paste detector fix** — the paste event currently saves the entire editor content instead of only the pasted text, preventing accurate integrity review.
2. **Auto-grading** — students have no visibility into their scores; instructors need to define thresholds and the platform should calculate and display scores automatically.
3. **Flag dismissal** — instructors cannot currently dismiss flags they deem legitimate, so valid student behaviour is unfairly penalised.
4. **Timezone display** — all timestamps are shown in UTC, appearing 1 hour behind for users in WAT (UTC+1).

## Glossary

- **Submission** — a student's final or draft response to a question in an exercise session
- **Flag** — an indicator of suspicious behaviour (paste event, excessive focus loss, etc.)
- **Exercise_Score** — the calculated total score for a student's exercise session
- **Threshold** — a numeric boundary defined by an instructor (e.g. pass mark, grade cutoff)
- **WAT** — West Africa Time, UTC+1

---

## Requirement 1: Paste Detector Captures Exact Pasted Text

**User Story:** As an instructor, I want to see exactly what a student pasted, so that I can accurately assess integrity events.

### Acceptance Criteria

1. WHEN a user pastes text into the Monaco code editor THEN the system SHALL extract and save the exact pasted text content alongside the character count
2. WHEN a paste event is recorded in the database THEN the `paste_events` table SHALL store a `pasted_text` field containing only the text that was pasted, not the full editor content
3. WHEN the Monaco `onDidPaste` event fires THEN the system SHALL read the text from the pasted range using `editor.getModel()?.getValueInRange(range)`
4. WHEN a paste event occurs THEN the system SHALL CONTINUE TO display the toast warning notification to the user
5. WHEN a paste event is recorded THEN the system SHALL CONTINUE TO trigger flag evaluation and update submission flags
6. WHEN a paste event occurs without an existing `submission_id` THEN the system SHALL CONTINUE TO trigger an autosave first to obtain a `submission_id`
7. WHEN a paste event is recorded THEN the system SHALL CONTINUE TO store the `occurred_at` timestamp and `char_count` fields

---

## Requirement 2: Instructor Configures Scoring Thresholds

**User Story:** As an instructor, I want to set a pass mark and optional grade boundaries for an exercise, so that scores are calculated consistently.

### Acceptance Criteria

1. WHEN an instructor opens an exercise THEN the system SHALL display a threshold configuration section
2. WHEN an instructor saves a threshold THEN the system SHALL validate that the value is a non-negative number and persist it to the database
3. THE system SHALL support at minimum a single pass/fail threshold per exercise
4. WHEN an instructor updates a threshold THEN the system SHALL recalculate all existing Exercise_Score values for that exercise
5. WHEN recalculation is in progress THEN the system SHALL display a loading indicator

---

## Requirement 3: Auto-Grading Calculates and Displays Student Scores

**User Story:** As a student, I want to see my total score after completing an exercise, so that I know how I performed without waiting for manual grading.

### Acceptance Criteria

1. WHEN a student's session is finalised THEN the system SHALL compute an Exercise_Score based on the number of questions answered and active (non-dismissed) flags
2. WHEN a submission is flagged and the flag has not been dismissed THEN the system SHALL apply a penalty to the Exercise_Score
3. THE system SHALL ensure the Exercise_Score is never negative
4. WHEN a student views their dashboard THEN the system SHALL display the Exercise_Score for each completed exercise
5. WHEN an exercise has a configured threshold THEN the student dashboard SHALL show a pass/fail indicator alongside the score
6. WHEN an exercise has no configured threshold THEN the student dashboard SHALL display the raw score only
7. WHEN a student has not finalised an exercise THEN the system SHALL NOT display a score for that exercise
8. WHEN the Score_Calculator computes an Exercise_Score THEN the system SHALL persist it to the database associated with the session

---

## Requirement 4: Instructor Views Scores in Submissions Table

**User Story:** As an instructor, I want to see each student's score in the submissions table, so that I can quickly assess class performance.

### Acceptance Criteria

1. WHEN an instructor views the submissions table THEN the system SHALL display the Exercise_Score for each student
2. THE system SHALL highlight scores that fall below the configured pass threshold
3. WHEN an instructor updates a flag or threshold THEN the system SHALL recalculate and refresh the displayed scores

---

## Requirement 5: Instructor Dismisses Flags

**User Story:** As an instructor, I want to dismiss a flag on a submission when the reason was valid, so that the student is not unfairly penalised.

### Acceptance Criteria

1. WHEN an instructor views a flagged submission THEN the system SHALL display each flag with a dismiss action
2. WHEN an instructor dismisses a flag THEN the system SHALL record the dismissal with the instructor's ID and a timestamp
3. WHEN an instructor dismisses a flag THEN the system SHALL preserve the original flag data for audit purposes
4. WHEN all flags on a submission are dismissed THEN the system SHALL update the submission's `is_flagged` status to `false`
5. WHEN an instructor dismisses a flag THEN the system SHALL recalculate the Exercise_Score excluding the dismissed flag's penalty
6. WHEN displaying a dismissed flag THEN the system SHALL apply a distinct visual style (e.g. muted colour, strikethrough) to distinguish it from active flags
7. WHEN a non-instructor attempts to dismiss a flag THEN the system SHALL return an authorisation error and not perform the dismissal
8. WHEN an instructor wants to undo a dismissal THEN the system SHALL provide a restore action that re-activates the flag and recalculates the score

---

## Requirement 6: All Timestamps Display in WAT

**User Story:** As a platform user in Nigeria, I want all times shown in WAT (UTC+1), so that timestamps match my local clock.

### Acceptance Criteria

1. WHEN displaying submission timestamps THEN the system SHALL format them in WAT (UTC+1) and label them as WAT
2. WHEN displaying paste event timestamps THEN the system SHALL format them in WAT
3. WHEN displaying focus loss event timestamps THEN the system SHALL format them in WAT
4. WHEN displaying feedback submission timestamps THEN the system SHALL format them in WAT
5. WHEN displaying user creation dates THEN the system SHALL format them in WAT
6. WHEN displaying live monitor heartbeat timestamps THEN the system SHALL format them in WAT
7. WHEN storing timestamps in the database THEN the system SHALL CONTINUE TO store them in UTC
8. WHEN performing date calculations or duration comparisons THEN the system SHALL CONTINUE TO use UTC internally
