# Design Document — Platform Improvements

## Overview

This document covers the technical design for four improvements to the recoding platform:

1. **Paste detector fix** — capture exact pasted text, not just char count
2. **Auto-grading** — score calculation, threshold configuration, and score display
3. **Flag dismissal** — per-reason dismissal with audit trail and score recalculation
4. **Timezone display** — unified WAT (UTC+1) formatting utility across all UI timestamps

All changes are additive migrations; no existing data is destroyed.

---

## Architecture

The platform is a Next.js 14 app-router application backed by PostgreSQL (accessed via the `sql` tagged-template helper from `lib/db`). The relevant layers are:

```
Browser (React / Monaco)
  │
  ▼
Next.js API Routes  ──►  lib/flagging.ts
                    ──►  lib/scoring.ts   (new)
                    ──►  lib/format.ts    (new)
                    ──►  PostgreSQL
```

Score recalculation is synchronous and in-process (no background queue needed at this scale). All mutations that affect a score call `recalculateSessionScore(sessionId)` from `lib/scoring.ts` before returning.

---

## Components and Interfaces

### New / modified files

| File | Change |
|---|---|
| `lib/format.ts` | New — `formatWAT` utility |
| `lib/scoring.ts` | New — `recalculateSessionScore` |
| `lib/flagging.ts` | Modified — exclude dismissed flags |
| `app/api/events/paste/route.ts` | Modified — accept + store `pasted_text` |
| `app/api/instructor/exercises/[id]/route.ts` | Modified — accept `pass_mark` |
| `app/api/instructor/submissions/[id]/dismiss-flag/route.ts` | New |
| `app/api/submissions/[sessionId]/final/route.ts` | Modified — trigger score calc |
| `app/participant/page.tsx` | Modified — show score badge |
| `app/participant/session/[id]/CodeEditor.tsx` | Modified — send `pasted_text` |
| `app/instructor/exercises/[id]/ExerciseManager.tsx` | Modified — pass mark input |
| `app/instructor/exercises/[id]/submissions/SubmissionsTable.tsx` | Modified — score column |
| `app/instructor/submissions/[id]/page.tsx` | Modified — dismiss UI, WAT timestamps, pasted text |
| All timestamp display sites | Modified — use `formatWAT` |

---

## Data Models

### Migration 0008 — platform improvements

```sql
-- 1. Paste text capture
ALTER TABLE paste_events
  ADD COLUMN pasted_text TEXT;

-- 2. Pass mark threshold on exercises
ALTER TABLE exercises
  ADD COLUMN pass_mark NUMERIC;   -- nullable; NULL = no threshold

-- 3. Score on sessions
ALTER TABLE sessions
  ADD COLUMN score NUMERIC;       -- nullable until first calculation

-- 4. Flag dismissal audit on submissions
ALTER TABLE submissions
  ADD COLUMN dismissed_flags JSONB NOT NULL DEFAULT '[]'::jsonb;
  -- shape: [{ reason: string, dismissed_by: string (user id), dismissed_at: string (ISO) }]
```

### Shape of `dismissed_flags`

```ts
type DismissedFlag = {
  reason: string;       // matches a string in flag_reasons[]
  dismissed_by: string; // instructor user id
  dismissed_at: string; // ISO 8601 UTC
};
```

The original `flag_reasons TEXT[]` column is never modified after a dismissal — it is the permanent audit record. `dismissed_flags` is the mutable overlay.

---

## `lib/format.ts` — WAT Formatting Utility

```ts
/**
 * Format an ISO timestamp string (or Date) in West Africa Time (UTC+1).
 * Uses the 'Africa/Lagos' IANA timezone which is permanently UTC+1.
 *
 * @param iso  - ISO 8601 string or Date object
 * @param opts - Intl.DateTimeFormatOptions overrides (optional)
 * @returns    - Formatted string, e.g. "12/06/2025, 14:30:00 WAT"
 */
export function formatWAT(
  iso: string | Date,
  opts?: Intl.DateTimeFormatOptions
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const base: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
    ...opts,
  };
  return date.toLocaleString('en-NG', base) + ' WAT';
}

/** Date-only variant — no time component, no WAT suffix */
export function formatDateWAT(
  iso: string | Date,
  opts?: Intl.DateTimeFormatOptions
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return date.toLocaleDateString('en-NG', {
    timeZone: 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit',
    ...opts,
  });
}
```

All existing `new Date(x).toLocaleString()`, `toLocaleTimeString()`, and `toLocaleDateString()` calls in UI files are replaced with `formatWAT(x)` or `formatDateWAT(x)`.

Affected call sites:
- `app/instructor/exercises/[id]/submissions/SubmissionsTable.tsx` — `submitted_at`
- `app/instructor/submissions/[id]/page.tsx` — `submitted_at`, paste `occurred_at`, focus `lost_at` / `regained_at`
- `app/instructor/feedback/page.tsx` — feedback `submitted_at`
- `app/instructor/users/UserManager.tsx` — user `created_at`
- `app/instructor/LiveMonitor.tsx` — heartbeat timestamps
- Any other display-layer timestamp usage

---

## Score Calculation Algorithm

### `lib/scoring.ts`

```ts
const FLAG_PENALTY = parseFloat(process.env.FLAG_PENALTY ?? '10');

/**
 * Recalculates and persists the score for a session.
 *
 * score = (finalSubmissions / totalQuestions) * 100
 *         - (activeFlagReasonCount * FLAG_PENALTY)
 * floored at 0, capped at 100.
 *
 * "Active" flag reasons = flag_reasons that do NOT appear in dismissed_flags.
 */
export async function recalculateSessionScore(sessionId: string): Promise<number> {
  // 1. Get exercise question count
  const sessionRow = await sql`
    SELECT s.id, e.question_count
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.id = ${sessionId}
    LIMIT 1
  `;
  if (sessionRow.length === 0) throw new Error('Session not found');
  const totalQuestions: number = sessionRow[0].question_count as number;

  // 2. Count final submissions for this session
  const finalRow = await sql`
    SELECT COUNT(*)::int AS count
    FROM submissions
    WHERE session_id = ${sessionId} AND is_final = true
  `;
  const finalCount: number = (finalRow[0]?.count as number) ?? 0;

  // 3. Count active (non-dismissed) flag reasons across all submissions
  const flagRow = await sql`
    SELECT
      COALESCE(array_length(flag_reasons, 1), 0) AS total_reasons,
      jsonb_array_length(dismissed_flags) AS dismissed_count
    FROM submissions
    WHERE session_id = ${sessionId}
  `;

  let activeFlagReasonCount = 0;
  for (const row of flagRow) {
    const total = (row.total_reasons as number) ?? 0;
    const dismissed = (row.dismissed_count as number) ?? 0;
    activeFlagReasonCount += Math.max(0, total - dismissed);
  }

  // 4. Formula
  const raw = (finalCount / totalQuestions) * 100 - activeFlagReasonCount * FLAG_PENALTY;
  const score = Math.min(100, Math.max(0, raw));

  // 5. Persist
  await sql`
    UPDATE sessions SET score = ${score} WHERE id = ${sessionId}
  `;

  return score;
}
```

**Recalculation triggers:**
- Session close (`POST /api/submissions/[sessionId]/final` when last question is finalised and session closes)
- Flag dismissal (`PUT /api/instructor/submissions/[id]/dismiss-flag`)
- Flag restore (same endpoint with `restore: true`)
- Pass mark update (`PUT /api/instructor/exercises/[id]` with `pass_mark`) — recalculates all sessions for that exercise

---

## New and Modified API Routes

### 1. `POST /api/events/paste` — modified

**Request body** (adds `pasted_text`):
```ts
{
  submission_id: string;
  char_count: number;
  pasted_text: string;   // NEW — exact text from getValueInRange
  occurred_at: string;   // ISO 8601
}
```

**Change:** Insert `pasted_text` into `paste_events`. All other behaviour unchanged.

---

### 2. `PUT /api/instructor/exercises/[id]` — modified

**Request body** (adds `pass_mark`):
```ts
{
  enabled?: boolean;
  assign_user_ids?: string[];
  start_time?: string | null;
  end_time?: string | null;
  duration_limit?: string | null;
  pass_mark?: number | null;   // NEW — non-negative or null to clear
}
```

**Change:** When `pass_mark` is present, validate `>= 0`, persist to `exercises.pass_mark`, then call `recalculateSessionScore` for every session belonging to this exercise.

---

### 3. `PUT /api/instructor/submissions/[id]/dismiss-flag` — new

**Auth:** instructor only

**Request body:**
```ts
{
  reason: string;    // must match a string in flag_reasons[]
  restore?: boolean; // if true, removes the dismissal instead
}
```

**Response (200):**
```ts
{
  submission_id: string;
  dismissed_flags: DismissedFlag[];
  is_flagged: boolean;
  score: number;   // updated session score
}
```

**Logic:**
1. Load submission, verify `reason` exists in `flag_reasons`.
2. If `restore: false` (default): append `{ reason, dismissed_by: instructorId, dismissed_at: now() }` to `dismissed_flags` if not already present.
3. If `restore: true`: remove the entry with matching `reason` from `dismissed_flags`.
4. Recompute `is_flagged`: `flag_reasons.some(r => !dismissed_flags.find(d => d.reason === r))`.
5. Update `submissions` row.
6. Call `recalculateSessionScore(sessionId)`.
7. Audit log the action.

**Error responses:**
- `401` — not authenticated
- `403` — not instructor
- `404` — submission not found
- `400` — reason not in flag_reasons, or already dismissed / not dismissed

---

### 4. `POST /api/submissions/[sessionId]/final` — modified

After marking a submission as final, check if all questions for the session are now final. If so, close the session (`closed_at = now()`) and call `recalculateSessionScore(sessionId)`.

---

## Component Changes

### `app/participant/session/[id]/CodeEditor.tsx`

In the `onDidPaste` handler, extract the pasted text and include it in the API call:

```ts
editor.onDidPaste((e) => {
  const model = editor.getModel();
  const pastedText = e.range ? (model?.getValueInRange(e.range) ?? '') : '';
  const charCount = pastedText.length;
  // ...
  body: JSON.stringify({
    submission_id: submissionId,
    char_count: charCount,
    pasted_text: pastedText,   // NEW
    occurred_at: occurredAt,
  }),
});
```

### `app/instructor/exercises/[id]/ExerciseManager.tsx`

Add a "Scoring" card with a pass mark input:

```tsx
// New state
const [passMark, setPassMark] = useState<string>(
  initial.pass_mark != null ? String(initial.pass_mark) : ''
);

// New card in the JSX
<div className="card">
  <div className="card-header"><span className="card-title">Scoring</span></div>
  <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem' }}>
    Set a pass mark (0–100). Leave blank for no threshold.
  </p>
  <div className="form-group" style={{ maxWidth: 200 }}>
    <label className="form-label">Pass Mark</label>
    <input
      className="form-input"
      type="number"
      min={0}
      max={100}
      step={1}
      placeholder="e.g. 50"
      value={passMark}
      onChange={(e) => setPassMark(e.target.value)}
    />
  </div>
  <button
    onClick={() => patch({ pass_mark: passMark === '' ? null : Number(passMark) })}
    disabled={saving}
    className="btn btn-primary"
  >
    {saving ? 'Saving…' : 'Save Pass Mark'}
  </button>
</div>
```

The `Exercise` interface gains `pass_mark: number | null`.

### `app/instructor/exercises/[id]/submissions/SubmissionsTable.tsx`

- Add `score: number | null` and `pass_mark: number | null` to `SubmissionRow` (pass_mark comes from the exercise, passed as a prop).
- Add a "Score" column to the table.
- Highlight the score cell in red when `score !== null && pass_mark !== null && score < pass_mark`.

```tsx
<td style={{
  fontWeight: 600,
  color: score !== null && pass_mark !== null && score < pass_mark
    ? 'var(--red)'
    : 'var(--text)',
}}>
  {score !== null ? `${score.toFixed(1)}%` : '—'}
</td>
```

The page query (`submissions/page.tsx`) joins `sessions.score` and passes `exercise.pass_mark` as a prop.

### `app/instructor/submissions/[id]/page.tsx`

1. **Timestamps** — replace all `new Date(x).toLocaleString()` with `formatWAT(x)`.
2. **Pasted text** — add a "Pasted Text" column to the paste events table.
3. **Flag dismissal UI** — replace the static flag reasons alert with a `FlagDismissal` client component (see below).

#### New client component: `FlagDismissal.tsx`

```tsx
'use client';
// Props: submissionId, flagReasons: string[], dismissedFlags: DismissedFlag[]
// Renders each flag reason with:
//   - Active: red badge + "Dismiss" button
//   - Dismissed: muted/strikethrough style + "Restore" button + who dismissed + when
// On dismiss/restore: calls PUT /api/instructor/submissions/[id]/dismiss-flag
//   then updates local state (optimistic) and shows toast
```

### `app/participant/page.tsx`

The query gains `sessions.score` and `exercises.pass_mark`. The exercise card for completed sessions shows:

```tsx
{sessionStatusMap.get(exercise.id) === 'completed' && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    {score !== null && (
      <span className={`badge ${passIndicator}`}>
        {score.toFixed(1)}%
        {passMark !== null && (score >= passMark ? ' ✓ Pass' : ' ✗ Fail')}
      </span>
    )}
    <span className="badge badge-green">Completed</span>
  </div>
)}
```

Where `passIndicator` is `badge-green` if passing or no threshold, `badge-red` if failing.

---

## `lib/flagging.ts` — Updated `evaluateFlags`

The function signature and return type are unchanged. The paste-count query is unchanged (it counts all paste events regardless of dismissal — dismissal affects score, not re-flagging). However, `is_flagged` derivation after dismissal is handled by the dismiss-flag route, not by `evaluateFlags`. `evaluateFlags` continues to be called only on new events and always reflects the raw signal state.

> Rationale: `evaluateFlags` is the detection layer. Dismissal is the review layer. Keeping them separate avoids re-running detection on every review action.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `pasted_text` missing from paste event body | API accepts it as `null` (backward compat with old clients) |
| `pass_mark` is negative | API returns `400 { error: 'pass_mark must be >= 0' }` |
| `pass_mark` is non-numeric | API returns `400 { error: 'pass_mark must be a number' }` |
| Dismiss reason not in `flag_reasons` | API returns `400 { error: 'reason not found in flag_reasons' }` |
| Dismiss already-dismissed reason | API returns `400 { error: 'flag already dismissed' }` |
| Restore non-dismissed reason | API returns `400 { error: 'flag is not dismissed' }` |
| Score recalculation fails | Error is logged; API still returns success for the primary action; score remains stale |
| `totalQuestions` is 0 | `recalculateSessionScore` returns 0 without dividing |
| `formatWAT` receives invalid date string | Returns `'Invalid Date WAT'` — callers should ensure valid ISO strings |

---

## Testing Strategy

### Unit tests

- `lib/format.ts` — `formatWAT` with known UTC inputs, verify output matches expected WAT string
- `lib/scoring.ts` — `recalculateSessionScore` with mocked `sql`, various combinations of final counts, flag counts, dismissed counts
- `lib/flagging.ts` — existing tests remain valid; add test for submission with dismissed flags to confirm `evaluateFlags` still returns raw reasons
- Dismiss-flag route — unit test auth guard (non-instructor returns 403), valid dismiss, valid restore, error cases

### Property-based tests

Use a property-based testing library (e.g. `fast-check` for TypeScript).

Each property test runs a minimum of 100 iterations.

### Integration tests

- End-to-end paste flow: paste in editor → API stores `pasted_text` → review page shows it
- Score recalculation on threshold change: set pass_mark, verify all session scores updated
- Flag dismiss → score increases; restore → score decreases back

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Paste text round-trip

*For any* string pasted into the Monaco editor, the `pasted_text` value stored in `paste_events` SHALL equal the exact string that was pasted (not the full editor content, not a truncated version).

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Paste event triggers flagging

*For any* submission that receives at least one paste event, after the paste API call completes, `submissions.is_flagged` SHALL be `true` and `flag_reasons` SHALL contain at least one paste-related reason.

**Validates: Requirements 1.5**

---

### Property 3: Pass mark validation

*For any* numeric value `v`, the exercise update API SHALL accept `v` if and only if `v >= 0`. For any `v < 0`, the API SHALL return a 400 error and leave `pass_mark` unchanged.

**Validates: Requirements 2.2**

---

### Property 4: Score formula correctness

*For any* session with `F` final submissions out of `Q` total questions and `A` active (non-dismissed) flag reasons, the computed `Exercise_Score` SHALL equal `max(0, min(100, (F / Q) * 100 - A * FLAG_PENALTY))`.

**Validates: Requirements 3.1, 3.2**

---

### Property 5: Score is never negative

*For any* combination of final submission count, question count, and active flag count, `Exercise_Score` SHALL always be `>= 0`.

**Validates: Requirements 3.3**

> Note: Property 5 is implied by Property 4 (the `max(0, ...)` clamp), but is stated separately because it is an explicit safety invariant worth testing independently with extreme inputs.

---

### Property 6: Pass/fail indicator correctness

*For any* `Exercise_Score` value `s` and pass mark `p`, the pass/fail indicator shown to the student SHALL display "Pass" if and only if `s >= p`, and "Fail" if and only if `s < p`.

**Validates: Requirements 3.5**

---

### Property 7: Score below threshold is highlighted

*For any* score `s` and pass mark `p` where `s < p`, the score cell in the instructor submissions table SHALL be rendered with the failure highlight style. For any `s >= p`, the failure highlight SHALL NOT be applied.

**Validates: Requirements 4.2**

---

### Property 8: Dismissal is recorded with correct metadata

*For any* flag reason `r` dismissed by instructor `i`, the resulting `dismissed_flags` array SHALL contain exactly one entry with `reason === r`, `dismissed_by === i`, and a `dismissed_at` timestamp within a reasonable window of the request time.

**Validates: Requirements 5.2**

---

### Property 9: Original flag data is preserved after dismissal

*For any* submission, after dismissing any subset of its flag reasons, `flag_reasons` SHALL still contain all original reasons unchanged.

**Validates: Requirements 5.3**

---

### Property 10: All-dismissed clears is_flagged

*For any* submission with `N` flag reasons, after dismissing all `N` reasons, `is_flagged` SHALL be `false`. After restoring any one of them, `is_flagged` SHALL be `true` again.

**Validates: Requirements 5.4**

---

### Property 11: Dismiss/restore is a round-trip

*For any* submission, dismissing a flag and then restoring it SHALL return the submission to its exact pre-dismissal state (`dismissed_flags`, `is_flagged`, and `score` all restored).

**Validates: Requirements 5.8**

---

### Property 12: Non-instructor cannot dismiss flags

*For any* request to `PUT /api/instructor/submissions/[id]/dismiss-flag` made by a user whose role is not `instructor`, the system SHALL return a 401 or 403 response and SHALL NOT modify `dismissed_flags`.

**Validates: Requirements 5.7**

---

### Property 13: WAT formatting is UTC+1

*For any* valid UTC timestamp `t`, `formatWAT(t)` SHALL produce a string representing the time `t + 1 hour`, and the string SHALL end with the suffix `WAT`.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

---

### Property Reflection

After reviewing all 13 properties:

- Properties 4 and 5 overlap (5 is implied by 4), but 5 is retained as an independent invariant test with extreme inputs.
- Properties 8 and 9 are distinct: 8 tests the new `dismissed_flags` entry, 9 tests that `flag_reasons` is immutable.
- Properties 10 and 11 are distinct: 10 tests the `is_flagged` derived state, 11 tests full round-trip identity.
- No further consolidation is warranted.
