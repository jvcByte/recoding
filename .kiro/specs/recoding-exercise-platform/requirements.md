# Requirements Document

## Introduction

The Recoding Exercise Platform is a web application that allows participants to log in and complete recoding exercises derived from existing question files in the `docs/` folder. The platform covers two categories of exercises: Go coding projects (ascii-art, ascii-art-web, go-reloaded) and prompt-piscine theory questions. A central concern is preventing dishonest responses — the platform's design must structurally discourage and detect AI-generated or copy-pasted answers.

## Glossary

- **Platform**: The recoding exercise web application described in this document.
- **Participant**: An authenticated user who completes exercises.
- **Instructor**: An authenticated administrator who manages exercises, reviews submissions, and monitors sessions.
- **Exercise**: A set of scenario-based questions derived from a single topic (e.g., `prompt-basics`, `go-reloaded`).
- **Question**: A single scenario-based prompt within an Exercise requiring a written response.
- **Submission**: A Participant's saved or final answer to a Question.
- **Session**: A timed, controlled window during which a Participant completes an Exercise.
- **Anti-Cheat Controls**: Platform features that structurally reduce the opportunity for dishonest responses.
- **Response_Editor**: The in-browser text input component used by Participants to write answers.

---

## Requirements

### Requirement 1: Participant Authentication

**User Story:** As a participant, I want to log in with my credentials, so that my submissions are tied to my identity and access is restricted to registered users.

#### Acceptance Criteria

1. THE Platform SHALL require Participants to authenticate before accessing any exercise content.
2. WHEN a Participant submits valid credentials, THE Platform SHALL create an authenticated session and redirect the Participant to their exercise dashboard.
3. IF a Participant submits invalid credentials, THEN THE Platform SHALL display an error message and deny access.
4. WHEN a Participant's session expires or they log out, THE Platform SHALL invalidate the session and redirect to the login page.
5. THE Platform SHALL store passwords using a one-way cryptographic hash with a per-user salt.

---

### Requirement 2: Instructor Authentication and Access Control

**User Story:** As an instructor, I want a separate privileged login, so that I can manage exercises and review submissions without exposing admin functions to participants.

#### Acceptance Criteria

1. THE Platform SHALL distinguish between Participant and Instructor roles at the authentication layer.
2. WHILE a user is authenticated as an Instructor, THE Platform SHALL grant access to exercise management, submission review, and session monitoring interfaces.
3. IF a Participant attempts to access an Instructor-only route, THEN THE Platform SHALL return a 403 response and redirect to the Participant dashboard.

---

### Requirement 3: Exercise Catalogue and Navigation

**User Story:** As a participant, I want to see which exercises are available to me, so that I can navigate to the one I am assigned.

#### Acceptance Criteria

1. THE Platform SHALL display a catalogue of Exercises available to the authenticated Participant.
2. WHEN a Participant selects an Exercise, THE Platform SHALL display the Exercise's questions in a sequential, one-at-a-time layout.
3. THE Platform SHALL source Exercise content from the question files located in the `docs/` directory, covering at minimum: `prompt-basics`, `prompt-patterns`, `ai-ethics`, `debug-control`, `ethical-ai`, `reasoning-flow`, `role-prompt`, `tool-prompts`, `go-reloaded`, `ascii-art`, and `ascii-art-web`.
4. WHILE a Session is not yet open for an Exercise, THE Platform SHALL display the Exercise as locked and prevent the Participant from starting it.

---

### Requirement 4: Timed Exercise Sessions

**User Story:** As an instructor, I want exercises to run within a defined time window, so that participants cannot take unlimited time to look up or generate answers.

#### Acceptance Criteria

1. THE Platform SHALL allow Instructors to configure a start time, end time, and duration limit for each Exercise Session.
2. WHEN a Participant starts an Exercise Session, THE Platform SHALL start a countdown timer visible to the Participant.
3. WHEN the Session duration limit is reached, THE Platform SHALL automatically save the Participant's current responses and close the Response_Editor.
4. IF a Participant attempts to submit responses after the Session end time, THEN THE Platform SHALL reject the submission and notify the Participant that the Session has closed.
5. THE Platform SHALL record the exact timestamp of each Submission.

---

### Requirement 5: Response Submission and Persistence

**User Story:** As a participant, I want my answers saved as I write them, so that I do not lose progress if my browser closes unexpectedly.

#### Acceptance Criteria

1. THE Platform SHALL auto-save the Participant's in-progress response at intervals not exceeding 30 seconds.
2. WHEN a Participant explicitly submits a final answer, THE Platform SHALL mark the Submission as final and prevent further edits.
3. THE Platform SHALL persist all Submissions — including intermediate auto-saves — to durable storage.
4. WHEN a Participant reloads the page during an active Session, THE Platform SHALL restore the Participant's last saved response in the Response_Editor.
5. IF a Participant navigates away from a Question without submitting, THEN THE Platform SHALL preserve the draft response and display a warning that the answer has not been finalised.

---

### Requirement 6: Anti-Cheat — Paste Detection

**User Story:** As an instructor, I want the platform to flag pasted content, so that I can identify responses that were composed outside the platform.

#### Acceptance Criteria

1. THE Platform SHALL detect and log each paste event (keyboard shortcut or context menu) that occurs inside the Response_Editor.
2. WHEN a paste event is detected, THE Platform SHALL record the pasted character count, the timestamp, and the Question identifier in the Submission audit log.
3. THE Platform SHALL display a visible warning to the Participant at the moment a paste is detected, stating that paste activity is being recorded.
4. THE Platform SHALL make the paste event log available to Instructors in the submission review interface.

---

### Requirement 7: Anti-Cheat — Tab and Window Focus Monitoring

**User Story:** As an instructor, I want to know when a participant leaves the exercise tab, so that I can identify likely external lookups during a session.

#### Acceptance Criteria

1. THE Platform SHALL monitor browser visibility and focus events for the duration of an active Session.
2. WHEN the Participant's browser tab loses focus or becomes hidden, THE Platform SHALL record the event with a timestamp and duration.
3. THE Platform SHALL make the focus-loss event log available to Instructors alongside the corresponding Submission.
4. WHEN the number of focus-loss events for a Participant exceeds a configurable threshold within a Session, THE Platform SHALL flag the Submission for Instructor review.

---

### Requirement 8: Anti-Cheat — Typing Behaviour Capture

**User Story:** As an instructor, I want to see evidence that a response was typed progressively, so that I can distinguish genuine writing from a single paste or AI-generated dump.

#### Acceptance Criteria

1. THE Platform SHALL record keystroke-level edit events (insertions and deletions) in the Response_Editor throughout the Session, without capturing the raw keystrokes themselves.
2. THE Platform SHALL store the edit event sequence per Submission so that the writing progression can be replayed.
3. THE Platform SHALL provide Instructors with a replay view that shows how a Submission was constructed over time.
4. IF a Submission's edit history shows fewer than 10 distinct edit events for a response longer than 200 characters, THEN THE Platform SHALL automatically flag the Submission as suspicious.

---

### Requirement 9: Anti-Cheat — One Question at a Time Display

**User Story:** As an instructor, I want participants to see only one question at a time, so that they cannot pre-read all questions and prepare answers in advance.

#### Acceptance Criteria

1. THE Platform SHALL display exactly one Question at a time to the Participant during an active Session.
2. THE Platform SHALL not render or transmit subsequent Question content to the client until the Participant advances to that Question.
3. WHEN a Participant advances to the next Question, THE Platform SHALL lock the previous Question's Response_Editor and prevent further edits.
4. THE Platform SHALL not allow Participants to navigate backwards to a previously answered Question during an active Session.

---

### Requirement 10: Submission Review for Instructors

**User Story:** As an instructor, I want to review all submissions for an exercise, so that I can assess quality and identify suspicious responses.

#### Acceptance Criteria

1. THE Platform SHALL provide Instructors with a submission list view showing all Participants and their submission status for a given Exercise.
2. WHEN an Instructor selects a Submission, THE Platform SHALL display the full response text, the auto-save history, the paste event log, the focus-loss event log, and the typing replay.
3. THE Platform SHALL visually distinguish flagged Submissions (paste events, focus-loss threshold exceeded, or low edit-event count) from unflagged ones in the list view.
4. THE Platform SHALL allow Instructors to add a written review note to any Submission.
5. THE Platform SHALL allow Instructors to export all Submissions for an Exercise as a structured file (CSV or JSON).

---

### Requirement 11: Exercise Content Management

**User Story:** As an instructor, I want to control which exercises are visible and when sessions open, so that I can coordinate the exercise schedule.

#### Acceptance Criteria

1. THE Platform SHALL allow Instructors to enable or disable individual Exercises from the catalogue visible to Participants.
2. THE Platform SHALL allow Instructors to assign specific Participants or groups to specific Exercises.
3. WHEN an Instructor updates Session timing for an Exercise, THE Platform SHALL immediately reflect the new timing for all Participants who have not yet started that Session.
4. THE Platform SHALL allow Instructors to preview Exercise content as it will appear to Participants before enabling it.

---

### Requirement 12: Participant Progress Visibility

**User Story:** As a participant, I want to see my progress through an exercise, so that I can manage my time effectively.

#### Acceptance Criteria

1. THE Platform SHALL display the current Question number and total Question count to the Participant throughout the Session.
2. THE Platform SHALL display the remaining Session time to the Participant throughout the Session.
3. WHEN fewer than 5 minutes remain in the Session, THE Platform SHALL display a prominent time warning to the Participant.
4. THE Platform SHALL indicate to the Participant which Questions have a saved draft and which have been marked as final.
