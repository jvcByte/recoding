import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { parseIntervalToSeconds } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const exerciseId = params.id;

  // Look up or create the session for this exercise + user
  let rows = await sql`
    SELECT s.id, s.start_time, s.end_time, s.duration_limit,
           s.started_at, s.closed_at, s.current_question_index,
           e.question_count
    FROM sessions s
    INNER JOIN exercises e ON e.id = s.exercise_id
    WHERE s.exercise_id = ${exerciseId}
      AND s.user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    // Create a new session, inheriting timing from the exercise
    const created = await sql`
      INSERT INTO sessions (exercise_id, user_id, started_at, current_question_index, start_time, end_time, duration_limit)
      SELECT
        ${exerciseId},
        ${userId},
        now(),
        0,
        e.start_time,
        e.end_time,
        e.duration_limit
      FROM exercises e
      WHERE e.id = ${exerciseId}
      RETURNING id, start_time, end_time, duration_limit,
                started_at, closed_at, current_question_index
    `;

    const exerciseRows = await sql`
      SELECT question_count FROM exercises WHERE id = ${exerciseId}
    `;

    rows = created.map((r) => ({
      ...r,
      question_count: exerciseRows[0]?.question_count ?? 0,
    }));
  }

  const row = rows[0];

  // 423 if start_time is set and now() < start_time
  if (row.start_time && new Date() < new Date(row.start_time as string)) {
    return NextResponse.json(
      { error: 'Session not yet open', opens_at: row.start_time },
      { status: 423 }
    );
  }

  // 410 if session is closed
  if (row.closed_at) {
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  const now = new Date();

  // Auto-close if end_time has passed
  if (row.end_time && now > new Date(row.end_time as string)) {
    await sql`
      UPDATE sessions SET closed_at = now()
      WHERE id = ${row.id} AND closed_at IS NULL
    `;
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  // Auto-close if duration_limit has been exceeded
  if (row.duration_limit && row.started_at) {
    const durationSeconds = parseIntervalToSeconds(row.duration_limit);
    const startedAt = new Date(row.started_at as string).getTime();
    const expiresAt = startedAt + durationSeconds * 1000;
    if (now.getTime() > expiresAt) {
      await sql`
        UPDATE sessions SET closed_at = now()
        WHERE id = ${row.id} AND closed_at IS NULL
      `;
      return NextResponse.json({ error: 'Session closed' }, { status: 410 });
    }
  }

  // Calculate remaining_seconds
  let remainingSeconds: number | null = null;

  if (row.duration_limit && row.started_at) {
    const durationSeconds = parseIntervalToSeconds(row.duration_limit);
    const startedAt = new Date(row.started_at as string).getTime();
    const expiresAt = startedAt + durationSeconds * 1000;
    remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);
  }

  if (row.end_time) {
    const fromEndTime = Math.floor(
      (new Date(row.end_time as string).getTime() - Date.now()) / 1000
    );
    remainingSeconds = remainingSeconds === null ? fromEndTime : Math.min(remainingSeconds, fromEndTime);
  }

  const warningLowTime =
    remainingSeconds !== null && remainingSeconds < 300;

  // Query per-question submission statuses
  const submissions = await sql`
    SELECT question_index, is_final,
           (response_text IS NOT NULL AND response_text <> '') AS has_draft
    FROM submissions
    WHERE session_id = ${row.id}
  `;

  const questionStatuses = submissions.map((s) => ({
    question_index: s.question_index,
    has_draft: Boolean(s.has_draft),
    is_final: Boolean(s.is_final),
  }));

  return NextResponse.json({
    session_id: row.id,
    current_question_index: row.current_question_index,
    question_count: row.question_count,
    remaining_seconds: remainingSeconds,
    warning_low_time: warningLowTime,
    question_statuses: questionStatuses,
  });
}

