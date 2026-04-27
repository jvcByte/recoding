import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

const FLAG_PENALTY = parseFloat(process.env.FLAG_PENALTY ?? '10');

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const exerciseId = params.id;

  const exRows = await sql`
    SELECT question_count, pass_mark, min_questions_required, flag_fails,
           max_paste_chars, max_focus_loss, min_edit_events, min_response_length
    FROM exercises WHERE id = ${exerciseId}
  `;
  if (exRows.length === 0) return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });

  const ex = exRows[0] as {
    question_count: number;
    pass_mark: number | null;
    min_questions_required: number | null;
    flag_fails: boolean;
    max_paste_chars: number | null;
    max_focus_loss: number | null;
    min_edit_events: number | null;
    min_response_length: number | null;
  };

  const DEFAULT_FOCUS_THRESHOLD = parseInt(process.env.FLAG_FOCUS_LOSS_THRESHOLD ?? '3', 10);
  const DEFAULT_MIN_EDIT = parseInt(process.env.FLAG_MIN_EDIT_EVENTS ?? '10', 10);
  const DEFAULT_MIN_LENGTH = parseInt(process.env.FLAG_MIN_RESPONSE_LENGTH ?? '200', 10);
  const focusThreshold = ex.max_focus_loss ?? DEFAULT_FOCUS_THRESHOLD;
  const minEditEvents = ex.min_edit_events ?? DEFAULT_MIN_EDIT;
  const minResponseLength = ex.min_response_length ?? DEFAULT_MIN_LENGTH;
  const hasConstraints = ex.pass_mark !== null || ex.min_questions_required !== null || ex.flag_fails || ex.max_paste_chars !== null || ex.max_focus_loss !== null;

  // 1. Mark all submissions final
  await sql`
    UPDATE submissions SET is_final = true
    WHERE session_id IN (SELECT id FROM sessions WHERE exercise_id = ${exerciseId})
      AND is_final = false
  `;

  // 2. Close open sessions
  await sql`
    UPDATE sessions SET closed_at = now()
    WHERE exercise_id = ${exerciseId} AND closed_at IS NULL AND started_at IS NOT NULL
  `;

  // 3. Re-evaluate paste flags with threshold
  if (ex.max_paste_chars !== null) {
    const threshold = ex.max_paste_chars;
    await sql`
      UPDATE submissions sub
      SET
        flag_reasons = (
          ARRAY(
            SELECT r FROM UNNEST(COALESCE(sub.flag_reasons, ARRAY[]::text[])) AS r
            WHERE r NOT LIKE 'paste_detected:%'
          )
          || CASE WHEN EXISTS (
            SELECT 1 FROM paste_events pe
            WHERE pe.submission_id = sub.id AND pe.char_count > ${threshold}
          ) THEN
            ARRAY['paste_detected: exceeds ' || ${threshold}::text || ' char threshold']
          ELSE ARRAY[]::text[] END
        ),
        is_flagged = (
          EXISTS (
            SELECT 1 FROM UNNEST(COALESCE(sub.flag_reasons, ARRAY[]::text[])) AS r
            WHERE r NOT LIKE 'paste_detected:%'
          )
          OR EXISTS (
            SELECT 1 FROM paste_events pe
            WHERE pe.submission_id = sub.id AND pe.char_count > ${threshold}
          )
        )
      WHERE sub.session_id IN (SELECT id FROM sessions WHERE exercise_id = ${exerciseId})
    `;
  }

  // 4. Re-evaluate focus loss flags with per-exercise threshold
  await sql`
    UPDATE submissions sub
    SET
      flag_reasons = (
        ARRAY(
          SELECT r FROM UNNEST(COALESCE(sub.flag_reasons, ARRAY[]::text[])) AS r
          WHERE r NOT LIKE 'focus_loss_exceeded:%'
        )
        || CASE WHEN (
          SELECT COUNT(*)::int FROM focus_events fe WHERE fe.session_id = sub.session_id
        ) > ${focusThreshold} THEN
          ARRAY['focus_loss_exceeded: ' || (
            SELECT COUNT(*)::text FROM focus_events fe WHERE fe.session_id = sub.session_id
          ) || ' focus-loss event(s) (threshold: ' || ${focusThreshold}::text || ')']
        ELSE ARRAY[]::text[] END
      ),
      is_flagged = (
        EXISTS (
          SELECT 1 FROM UNNEST(COALESCE(sub.flag_reasons, ARRAY[]::text[])) AS r
          WHERE r NOT LIKE 'focus_loss_exceeded:%'
        )
        OR (
          SELECT COUNT(*)::int FROM focus_events fe WHERE fe.session_id = sub.session_id
        ) > ${focusThreshold}
      )
    WHERE sub.session_id IN (SELECT id FROM sessions WHERE exercise_id = ${exerciseId})
  `;

  // 5. Re-evaluate low_edit_count flags with per-exercise thresholds
  await sql`
    UPDATE submissions sub
    SET
      flag_reasons = (
        ARRAY(
          SELECT r FROM UNNEST(COALESCE(sub.flag_reasons, ARRAY[]::text[])) AS r
          WHERE r NOT LIKE 'low_edit_count:%'
        )
        || CASE
          WHEN (
            SELECT COUNT(*)::int FROM edit_events ee WHERE ee.submission_id = sub.id
          ) < ${minEditEvents}
          AND LENGTH(COALESCE(sub.response_text, '')) >= ${minResponseLength}
          THEN ARRAY['low_edit_count: ' || (
            SELECT COUNT(*)::text FROM edit_events ee WHERE ee.submission_id = sub.id
          ) || ' edit event(s) for a ' || LENGTH(COALESCE(sub.response_text, ''))::text || '-character response']
          ELSE ARRAY[]::text[]
        END
      ),
      is_flagged = (
        EXISTS (
          SELECT 1 FROM UNNEST(COALESCE(sub.flag_reasons, ARRAY[]::text[])) AS r
          WHERE r NOT LIKE 'low_edit_count:%'
        )
        OR (
          (SELECT COUNT(*)::int FROM edit_events ee WHERE ee.submission_id = sub.id) < ${minEditEvents}
          AND LENGTH(COALESCE(sub.response_text, '')) >= ${minResponseLength}
        )
      )
    WHERE sub.session_id IN (SELECT id FROM sessions WHERE exercise_id = ${exerciseId})
  `;

  // 6. Get per-session aggregates
  const sessionData = await sql`
    SELECT
      s.id AS session_id,
      SUM(CASE WHEN sub.is_final THEN 1 ELSE 0 END)::int AS final_count,
      COALESCE(SUM(
        GREATEST(0,
          COALESCE(array_length(sub.flag_reasons, 1), 0)
          - jsonb_array_length(sub.dismissed_flags)
        )
      ), 0)::int AS active_flag_reasons,
      BOOL_OR(
        sub.is_flagged = true
        AND jsonb_array_length(sub.dismissed_flags) < COALESCE(array_length(sub.flag_reasons, 1), 0)
      ) AS has_active_flag,
      COALESCE((
        SELECT SUM(pe.char_count)
        FROM paste_events pe
        JOIN submissions sub2 ON sub2.id = pe.submission_id
        WHERE sub2.session_id = s.id
      ), 0)::int AS total_paste_chars,
      (SELECT COUNT(*)::int FROM focus_events fe WHERE fe.session_id = s.id) AS focus_loss_count
    FROM sessions s
    LEFT JOIN submissions sub ON sub.session_id = s.id
    WHERE s.exercise_id = ${exerciseId}
    GROUP BY s.id
  `;

  // 5. Compute score + passed in JS, then bulk update
  for (const row of sessionData) {
    const sessionId = row.session_id as string;
    const finalCount = (row.final_count as number) ?? 0;
    const activeFlagReasons = (row.active_flag_reasons as number) ?? 0;
    const hasActiveFlag = (row.has_active_flag as boolean) ?? false;
    const totalPasteChars = (row.total_paste_chars as number) ?? 0;
    const focusLossCount = (row.focus_loss_count as number) ?? 0;

    const raw = (finalCount / ex.question_count) * 100 - activeFlagReasons * FLAG_PENALTY;
    const score = Math.min(100, Math.max(0, raw));

    let passed: boolean | null = null;
    if (hasConstraints) {
      passed = true;
      if (ex.pass_mark !== null && score < ex.pass_mark) passed = false;
      if (ex.min_questions_required !== null && finalCount < ex.min_questions_required) passed = false;
      if (ex.flag_fails && hasActiveFlag) passed = false;
      if (ex.max_paste_chars !== null && totalPasteChars > ex.max_paste_chars) passed = false;
      if (ex.max_focus_loss !== null && focusLossCount > ex.max_focus_loss) passed = false;
    }

    await sql`
      UPDATE sessions SET score = ${score}, passed = ${passed}
      WHERE id = ${sessionId}
    `;
  }

  return NextResponse.json({ recalculated: sessionData.length });
}
