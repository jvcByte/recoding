# Design Document: Recoding Exercise Platform

## Overview

The Recoding Exercise Platform is a web application that enables participants to complete scenario-based recoding exercises in a controlled, monitored environment. The platform serves two roles — Participants and Instructors — and is built around a central anti-cheat concern: structurally discouraging and detecting AI-generated or copy-pasted answers.

Exercises are sourced directly from question files in the `docs/` directory, covering Go coding projects (`ascii-art`, `ascii-art-web`, `go-reloaded`) and prompt-piscine theory topics (`prompt-basics`, `prompt-patterns`, `ai-ethics`, `debug-control`, `ethical-ai`, `reasoning-flow`, `role-prompt`, `tool-prompts`).

The platform enforces a one-question-at-a-time display model, timed sessions, and a multi-signal audit trail (paste events, tab focus loss, keystroke edit sequences) that instructors can review per submission.

### Technology Stack

- **Framework**: Next.js 14 (App Router, TypeScript) — handles both frontend and backend in one project
- **API**: Next.js Route Handlers (`app/api/...`) — replaces a separate Express server
- **Database**: PostgreSQL via [Neon](https://neon.tech) (serverless Postgres, free tier) — accessed with `@neondatabase/serverless`
- **Auth**: [NextAuth.js](https://next-auth.js.org) with credentials provider; bcrypt for password hashing; sessions stored in JWT cookies
- **Real-time**: Server-Sent Events (SSE) via a Route Handler — replaces WebSocket (Vercel serverless does not support persistent WebSocket connections)
- **Deployment**: [Vercel](https://vercel.com) — free tier, zero infrastructure to manage; connects directly to Neon

---

## Architecture

The system is a single Next.js application deployed on Vercel. Route Handlers under `app/api/` serve as the backend. React Server Components and Client Components make up the frontend. There is no separate server process.

```mermaid
graph TD
    subgraph Vercel
        A[Next.js App Router]
        B[Participant Pages<br/>app/participant/...]
        C[Instructor Pages<br/>app/instructor/...]
        D[Route Handlers<br/>app/api/...]
        E[SSE Endpoint<br/>app/api/events/stream]
        F[NextAuth<br/>app/api/auth/...]
        A --> B
        A --> C
        A --> D
        A --> E
        A --> F
    end

    subgraph Neon
        G[(PostgreSQL)]
    end

    subgraph Filesystem
        H[Question Files<br/>docs/ directory]
    end

    D -->|@neondatabase/serverless| G
    E -->|poll or push| G
    D -->|read at build/request time| H
```

### Key Architectural Decisions

1. **Question content is read from `docs/` at request time** inside Route Handlers using `fs` (available in Next.js server context). On Vercel, the `docs/` directory is bundled with the deployment as static assets. Questions are never stored in the database.

2. **Anti-cheat events use Server-Sent Events (SSE)** instead of WebSocket. A Route Handler at `GET /api/events/stream` keeps a response stream open and pushes events to the instructor's browser. Vercel supports long-lived streaming responses via SSE; it does not support persistent WebSocket connections on serverless functions.

3. **Question content is served one at a time via Route Handler** — the server checks `session.current_question_index` before returning any question content, so question N+1 is never sent until the participant advances.

4. **Role-based access control is enforced in Next.js middleware** (`middleware.ts` at the project root). The middleware checks the NextAuth session token and redirects or returns 403 before any Route Handler or page is reached.

---

## Components and Interfaces

### Frontend Components

Next.js pages and components live under `app/`. Server Components handle data fetching; Client Components handle interactivity and event capture.

#### Participant UI (`app/participant/`)

| Component | Type | Responsibility |
|---|---|---|
| `LoginPage` | Server + Client | Credential form via NextAuth `signIn`, error display |
| `ExerciseCatalogue` | Server Component | Lists available/locked exercises fetched server-side |
| `SessionView` | Client Component | Hosts active session: timer, progress, question display |
| `QuestionDisplay` | Client Component | Renders current question markdown |
| `ResponseEditor` | Client Component | Textarea with paste/focus/keystroke event hooks |
| `ProgressBar` | Client Component | Current question index, draft/final status indicators |
| `TimerDisplay` | Client Component | Countdown with <5 min warning state |

#### Instructor UI (`app/instructor/`)

| Component | Type | Responsibility |
|---|---|---|
| `InstructorDashboard` | Server Component | Overview of exercises and live sessions |
| `ExerciseManager` | Client Component | Enable/disable exercises, configure session timing, assign participants |
| `SubmissionList` | Server Component | Filterable list of submissions with flag indicators |
| `SubmissionDetail` | Client Component | Full response, audit logs, typing replay, review note input |
| `TypingReplay` | Client Component | Reconstructs response from edit event sequence |
| `LiveMonitor` | Client Component | Connects to SSE stream, shows real-time anti-cheat events |
| `ExportButton` | Client Component | Triggers CSV/JSON export of all submissions |

### Backend API Routes

All routes live under `app/api/` as Next.js Route Handlers.

#### Auth (NextAuth)
```
POST /api/auth/signin         — NextAuth credentials sign-in
POST /api/auth/signout        — NextAuth sign-out
GET  /api/auth/session        — current session + role (NextAuth built-in)
```

#### Exercises (Participant)
```
GET  /api/exercises                        — list available exercises for current user
GET  /api/exercises/[id]/session           — get active session state
GET  /api/exercises/[id]/question/[n]      — get question n (enforces sequential access)
```

#### Submissions
```
POST /api/submissions/[sessionId]/autosave  — save draft response
POST /api/submissions/[sessionId]/final     — mark response as final
GET  /api/submissions/[sessionId]/restore   — restore last draft on reload
```

#### Anti-Cheat Events
```
POST /api/events/paste         — log paste event
POST /api/events/focus         — log focus-loss event
POST /api/events/keystrokes    — batch-upload edit event sequence
GET  /api/events/stream        — SSE stream for instructor live monitoring
```

#### Instructor
```
GET  /api/instructor/exercises                      — list all exercises with management data
PUT  /api/instructor/exercises/[id]                 — update exercise config (enabled, timing, assignments)
GET  /api/instructor/exercises/[id]/submissions     — list all submissions for exercise
GET  /api/instructor/submissions/[id]               — get full submission detail
PUT  /api/instructor/submissions/[id]/review        — add review note
GET  /api/instructor/exercises/[id]/export          — export submissions as CSV/JSON
```

---

## Data Models

### Users

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('participant', 'instructor')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Exercises

Exercise metadata is stored in the DB; question content is loaded from `docs/` at startup.

```sql
CREATE TABLE exercises (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,   -- e.g. 'prompt-basics', 'go-reloaded'
    title       TEXT NOT NULL,
    enabled     BOOLEAN NOT NULL DEFAULT false,
    question_count INT NOT NULL
);
```

### Exercise Assignments

```sql
CREATE TABLE exercise_assignments (
    exercise_id UUID REFERENCES exercises(id),
    user_id     UUID REFERENCES users(id),
    PRIMARY KEY (exercise_id, user_id)
);
```

### Sessions

```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id     UUID NOT NULL REFERENCES exercises(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    duration_limit  INTERVAL,
    started_at      TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    current_question_index INT NOT NULL DEFAULT 0,
    UNIQUE (exercise_id, user_id)
);
```

### Submissions

```sql
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id),
    question_index  INT NOT NULL,
    response_text   TEXT NOT NULL DEFAULT '',
    is_final        BOOLEAN NOT NULL DEFAULT false,
    is_flagged      BOOLEAN NOT NULL DEFAULT false,
    flag_reasons    TEXT[],
    review_note     TEXT,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, question_index)
);
```

### Auto-Save History

```sql
CREATE TABLE autosave_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    response_text   TEXT NOT NULL,
    saved_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Paste Events

```sql
CREATE TABLE paste_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    char_count      INT NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL
);
```

### Focus Events

```sql
CREATE TABLE focus_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id),
    lost_at         TIMESTAMPTZ NOT NULL,
    regained_at     TIMESTAMPTZ,
    duration_ms     INT
);
```

### Edit Events (Keystroke Capture)

```sql
CREATE TABLE edit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    event_type      TEXT NOT NULL CHECK (event_type IN ('insert', 'delete')),
    position        INT NOT NULL,
    char_count      INT NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL
);
```

### Question File Loader

Since Vercel bundles the `docs/` directory with the deployment, question files are read using Node.js `fs` inside Route Handlers (server context only). There is no startup cache — files are read on demand and the result can be cached with Next.js `unstable_cache` or `fetch` cache semantics.

```typescript
// lib/questions.ts
import { readFileSync } from 'fs';
import path from 'path';

export interface Question {
  index: number;
  text: string; // raw markdown
}

export interface ExerciseContent {
  slug: string;
  title: string;
  questions: Question[];
}

export function loadExercise(slug: string): ExerciseContent {
  const dir = path.join(process.cwd(), 'docs', slug);
  // finds question*.md files, sorts by filename, parses into Question[]
  // ...
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Unauthenticated requests are denied

*For any* API route that serves exercise content, submissions, or session data, a request without a valid authentication token SHALL receive a 401 response and no exercise content.

**Validates: Requirements 1.1**

### Property 2: Invalid credentials never create a session

*For any* combination of username and password that does not match a stored credential pair, the login endpoint SHALL return an error response and SHALL NOT create an authenticated session.

**Validates: Requirements 1.3**

### Property 3: Password storage is non-reversible

*For any* plaintext password, the value stored in the database SHALL NOT equal the plaintext, and bcrypt verification of the plaintext against the stored hash SHALL return true.

**Validates: Requirements 1.5**

### Property 4: Role enforcement on instructor routes

*For any* user with role `participant`, any request to an instructor-only route SHALL return a 403 response. *For any* user with role `instructor`, those same routes SHALL be accessible.

**Validates: Requirements 2.1, 2.3**

### Property 5: Exercise catalogue reflects assignment and enabled state

*For any* participant, the exercise catalogue API SHALL return exactly the set of exercises that are both enabled and assigned to that participant — no more, no fewer.

**Validates: Requirements 3.1, 11.1, 11.2**

### Property 6: Question content matches source files

*For any* exercise slug, the questions served by the API SHALL match the content parsed from the corresponding `docs/` question file, with no additions or omissions.

**Validates: Requirements 3.3**

### Property 7: Late submissions are rejected

*For any* submission attempt with a timestamp after the session's configured end time, the API SHALL reject the submission and return an error indicating the session is closed.

**Validates: Requirements 4.4**

### Property 8: Finalized submissions cannot be edited

*For any* submission that has been marked as final, any subsequent autosave or edit request for that submission SHALL be rejected.

**Validates: Requirements 5.2**

### Property 9: Autosave round-trip preserves response text

*For any* response text autosaved during an active session, calling the restore endpoint for that session SHALL return the same response text.

**Validates: Requirements 5.3, 5.4**

### Property 10: Paste events are fully logged

*For any* paste event submitted to the API, the stored record SHALL contain the character count, timestamp, and the submission identifier (question reference), and SHALL be retrievable by an instructor via the submission detail endpoint.

**Validates: Requirements 6.1, 6.2, 6.4**

### Property 11: Focus-loss events are fully logged

*For any* focus-loss event submitted to the API, the stored record SHALL contain the `lost_at` timestamp and `duration_ms`, and SHALL be retrievable by an instructor via the submission detail endpoint.

**Validates: Requirements 7.2, 7.3**

### Property 12: Focus-loss threshold triggers flagging

*For any* session where the number of focus-loss events exceeds the configured threshold, the corresponding submission SHALL have `is_flagged = true` and `flag_reasons` SHALL include a focus-loss indicator.

**Validates: Requirements 7.4**

### Property 13: Edit events are stored without raw character content

*For any* edit event submitted to the API, the stored record SHALL contain `event_type`, `position`, `char_count`, and `occurred_at`, and SHALL NOT contain the raw character value that was inserted or deleted.

**Validates: Requirements 8.1, 8.2**

### Property 14: Low-edit-count submissions are auto-flagged

*For any* submission where the response text length exceeds 200 characters and the number of distinct edit events is fewer than 10, the submission SHALL have `is_flagged = true` and `flag_reasons` SHALL include a low-edit-count indicator.

**Validates: Requirements 8.4**

### Property 15: Sequential question access is enforced

*For any* active session at question index N, a request for question N+1 or higher SHALL be denied. Only after the participant advances to question N+1 SHALL that question's content be served.

**Validates: Requirements 9.1, 9.2**

### Property 16: Advancing locks the previous question

*For any* session where the participant has advanced past question N, any edit or autosave attempt targeting question N SHALL be rejected.

**Validates: Requirements 9.3, 9.4**

### Property 17: Submission detail contains all audit data

*For any* submission, the instructor submission detail endpoint SHALL return the response text, autosave history, paste events, focus events, and edit events.

**Validates: Requirements 10.2**

### Property 18: Submission export is complete

*For any* exercise, the export endpoint SHALL return a structured file containing one record per submission, with all required fields present for each record.

**Validates: Requirements 10.5**

### Property 19: Session timing updates propagate to unstarted sessions

*For any* session timing update made by an instructor, participants who have not yet started that session SHALL receive the updated timing on their next session state request.

**Validates: Requirements 11.3**

### Property 20: Remaining time warning threshold

*For any* active session where the remaining time is less than 300 seconds, the session state API SHALL include a warning flag in its response.

**Validates: Requirements 12.3**

### Property 21: Question status reflects draft and final state

*For any* session, the session state API SHALL return a per-question status list that accurately reflects which questions have a saved draft and which have been marked as final.

**Validates: Requirements 12.4**

---

## Error Handling

### Authentication Errors
- Invalid credentials → 401 with generic message (do not reveal whether username or password was wrong)
- Expired/invalid JWT → 401, client redirects to login
- Insufficient role → 403, client redirects to participant dashboard

### Session Errors
- Session not yet open → 423 Locked with `opens_at` timestamp
- Session already closed → 410 Gone
- Submission after session end → 410 Gone with message
- Duplicate final submission → 409 Conflict

### Question Access Errors
- Request for question beyond current index → 403 Forbidden
- Request for question in a closed session → 410 Gone

### Submission Errors
- Edit on finalized submission → 409 Conflict
- Autosave with no active session → 404 Not Found

### General
- All unhandled server errors → 500 with a generic message; full error logged server-side only
- Validation errors (missing fields, wrong types) → 400 with field-level error details

---

## Testing Strategy

### Dual Testing Approach

The platform uses both unit/example-based tests and property-based tests. Unit tests cover specific flows, edge cases, and integration points. Property tests verify universal invariants across randomized inputs.

### Property-Based Testing

The platform's business logic — access control, flagging rules, sequential question enforcement, session timing, and audit log completeness — is well-suited to property-based testing. The chosen library is **fast-check** (TypeScript/Node.js).

Each property test runs a minimum of 100 iterations. Tests are tagged with the design property they validate:

```
// Feature: recoding-exercise-platform, Property 14: Low-edit-count submissions are auto-flagged
```

Properties to implement as PBT:
- Properties 1–4 (auth and role enforcement) — generate random route paths and credential pairs
- Properties 5–6 (catalogue and content) — generate random assignment configurations
- Properties 7–9 (session timing and persistence) — generate random timestamps and response texts
- Properties 10–13 (anti-cheat event logging) — generate random event sequences
- Properties 14–16 (flagging and sequential access) — generate random edit counts and session states
- Properties 17–21 (instructor data, export, timing) — generate random submission sets

### Unit / Example-Based Tests

Focus on:
- Login flow (valid credentials, invalid credentials, logout)
- Session lifecycle (start, expire, close)
- Autosave and restore flow
- Instructor CRUD operations (enable/disable exercise, assign participants, add review note)
- Export format correctness (CSV and JSON structure)
- UI warning display at <5 minutes remaining

### Integration Tests

- Full login → session start → answer questions → submit flow (end-to-end)
- Instructor views submission with all audit data after participant completes session
- SSE stream delivers anti-cheat events to instructor in real time

### Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── exercises/[id]/
│   │   │   ├── session/route.ts
│   │   │   └── question/[n]/route.ts
│   │   ├── submissions/[sessionId]/
│   │   │   ├── autosave/route.ts
│   │   │   ├── final/route.ts
│   │   │   └── restore/route.ts
│   │   ├── events/
│   │   │   ├── paste/route.ts
│   │   │   ├── focus/route.ts
│   │   │   ├── keystrokes/route.ts
│   │   │   └── stream/route.ts        ← SSE endpoint
│   │   └── instructor/
│   │       ├── exercises/[id]/route.ts
│   │       └── submissions/[id]/route.ts
│   ├── participant/
│   │   ├── page.tsx                   ← exercise catalogue
│   │   └── session/[id]/page.tsx      ← active session view
│   ├── instructor/
│   │   ├── page.tsx                   ← dashboard
│   │   ├── exercises/[id]/page.tsx
│   │   └── submissions/[id]/page.tsx
│   └── login/page.tsx
├── lib/
│   ├── db.ts                          ← Neon client
│   ├── questions.ts                   ← docs/ file loader
│   └── flagging.ts                    ← auto-flag logic
├── middleware.ts                      ← RBAC enforcement
├── docs/                              ← exercise question files
└── schema.sql                         ← DB migration
```
