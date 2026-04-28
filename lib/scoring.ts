import { sql } from './db';

const FLAG_PENALTY = parseFloat(process.env.FLAG_PENALTY ?? '10');

export interface ScoreResult {
  score: number;
  passed: boolean | null; // null = no constraints configured
}

/**
 * Recalculates and persists the score and pass/fail status for a session.
 *
 * Score formula: max(0, min(100, (finalSubmissions / totalQuestions) * 100 - activeFlagReasons * FLAG_PENALTY))
 *
 * Pass/fail constraints (all must pass if configured):
 *   - min_questions_required: finalCount >= threshold
 *   - flag_fails: session has no active (non-dismissed) flags
 *   - max_paste_chars: total pasted chars across all paste events <= threshold
 *   - pass_mark: score >= pass_mark
 */
export async function recalculateSessionScore(sessionId: string): Promise<ScoreResult> {
  // 1. Get exercise config + session info
  const sessionRows = await sql`
    SELECT e.question_count, e.pass_mark,
           e.min_questions_required, e.flag_fails, e.max_paste_chars, e.max_focus_loss
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.id = ${sessionId}
    LIMIT 1
  `;
  if (sessionRows.length === 0) throw new Error('Session not found');

  const cfg = sessionRows[0] as {
    question_count: number;
    pass_mark: number | null;
    min_questions_required: number | null;
    flag_fails: boolean;
    max_paste_chars: number | null;
    max_focus_loss: number | null;
  };

  const totalQuestions = cfg.question_count ?? 0;

  if (totalQuestions === 0) {
    await sql`UPDATE sessions SET score = 0, passed = NULL WHERE id = ${sessionId}`;
    return { score: 0, passed: null };
  }

  // 2. Count attempted final submissions:
  // - written: non-empty response_text
  // - code: has at least one edit event (participant actually typed something)
  const finalRows = await sql`
    SELECT SUM(CASE WHEN is_final AND (
      LENGTH(TRIM(COALESCE(response_text, ''))) > 0
      OR EXISTS (SELECT 1 FROM edit_events ee WHERE ee.submission_id = submissions.id)
    ) THEN 1 ELSE 0 END)::int AS count
    FROM submissions
    WHERE session_id = ${sessionId}
  `;
  const finalCount = (finalRows[0]?.count as number) ?? 0;

  // 3. Count active (non-dismissed) flag reasons
  const flagRows = await sql`
    SELECT
      COALESCE(array_length(flag_reasons, 1), 0) AS total_reasons,
      jsonb_array_length(dismissed_flags)          AS dismissed_count
    FROM submissions
    WHERE session_id = ${sessionId}
  `;

  let activeFlagReasonCount = 0;
  let hasActiveFlag = false;
  for (const row of flagRows) {
    const total = (row.total_reasons as number) ?? 0;
    const dismissed = (row.dismissed_count as number) ?? 0;
    const active = Math.max(0, total - dismissed);
    activeFlagReasonCount += active;
    if (active > 0) hasActiveFlag = true;
  }

  // 4. Total pasted chars
  const pasteRows = await sql`
    SELECT COALESCE(SUM(char_count), 0)::int AS total_chars
    FROM paste_events pe
    JOIN submissions sub ON sub.id = pe.submission_id
    WHERE sub.session_id = ${sessionId}
  `;
  const totalPasteChars = (pasteRows[0]?.total_chars as number) ?? 0;

  // 4b. Focus loss count
  const focusRows = await sql`
    SELECT COUNT(*)::int AS count FROM focus_events WHERE session_id = ${sessionId}
  `;
  const focusLossCount = (focusRows[0]?.count as number) ?? 0;

  // 5. Score formula
  const raw = (finalCount / totalQuestions) * 100 - activeFlagReasonCount * FLAG_PENALTY;
  const score = Math.min(100, Math.max(0, raw));

  // 6. Evaluate pass/fail constraints
  const hasAnyConstraint =
    cfg.pass_mark !== null ||
    cfg.min_questions_required !== null ||
    cfg.flag_fails ||
    cfg.max_paste_chars !== null ||
    cfg.max_focus_loss !== null;

  let passed: boolean | null = null;
  if (hasAnyConstraint) {
    passed = true;
    if (cfg.pass_mark !== null && score < cfg.pass_mark) passed = false;
    if (cfg.min_questions_required !== null && finalCount < cfg.min_questions_required) passed = false;
    if (cfg.flag_fails && hasActiveFlag) passed = false;
    if (cfg.max_paste_chars !== null && totalPasteChars > cfg.max_paste_chars) passed = false;
    if (cfg.max_focus_loss !== null && focusLossCount > cfg.max_focus_loss) passed = false;
  }

  // 7. Persist
  await sql`UPDATE sessions SET score = ${score}, passed = ${passed} WHERE id = ${sessionId}`;

  return { score, passed };
}
