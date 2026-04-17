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

  // Check exercise-level start_time BEFORE creating a session
  // This way participants who haven't started yet are blocked at the exercise level
  const exerciseRows = await sql`
    SELECT slug, start_time, end_time, duration_limit, question_count
    FROM exercises WHERE id = ${exerciseId} LIMIT 1
  `;
  if (exerciseRows.length === 0) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }
  const exercise = exerciseRows[0];

  if (exercise.start_time && new Date() < new Date(exercise.start_time as string)) {
    return NextResponse.json(
      { error: 'Session not yet open', opens_at: exercise.start_time },
      { status: 423 }
    );
  }

  // Look up or create the session
  let rows = await sql`
    SELECT s.id, s.end_time, s.duration_limit,
           s.started_at, s.closed_at, s.current_question_index,
           e.question_count
    FROM sessions s
    INNER JOIN exercises e ON e.id = s.exercise_id
    WHERE s.exercise_id = ${exerciseId}
      AND s.user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    // Create session — inherit end_time and duration_limit but NOT start_time
    // (start_time is checked at the exercise level above)
    const created = await sql`
      INSERT INTO sessions (exercise_id, user_id, started_at, current_question_index, end_time, duration_limit)
      SELECT
        ${exerciseId},
        ${userId},
        now(),
        0,
        e.end_time,
        e.duration_limit
      FROM exercises e
      WHERE e.id = ${exerciseId}
      RETURNING id, end_time, duration_limit, started_at, closed_at, current_question_index
    `;

    rows = created.map((r) => ({
      ...r,
      question_count: exercise.question_count ?? 0,
    }));
  }

  const row = rows[0];

  // 410 if session is closed
  if (row.closed_at) {
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  const now = new Date();

  // Auto-close if end_time has passed (check both session and exercise end_time)
  const effectiveEndTime = (row.end_time || exercise.end_time) as string | null;
  if (effectiveEndTime && now > new Date(effectiveEndTime)) {
    await sql`UPDATE sessions SET closed_at = now() WHERE id = ${row.id} AND closed_at IS NULL`;
    return NextResponse.json({ error: 'Session closed' }, { status: 410 });
  }

  // Auto-close if duration_limit exceeded
  if (row.duration_limit && row.started_at) {
    const durationSeconds = parseIntervalToSeconds(row.duration_limit);
    const startedAt = new Date(row.started_at as string).getTime();
    if (now.getTime() > startedAt + durationSeconds * 1000) {
      await sql`UPDATE sessions SET closed_at = now() WHERE id = ${row.id} AND closed_at IS NULL`;
      return NextResponse.json({ error: 'Session closed' }, { status: 410 });
    }
  }

  // Calculate remaining_seconds
  let remainingSeconds: number | null = null;

  if (row.duration_limit && row.started_at) {
    const durationSeconds = parseIntervalToSeconds(row.duration_limit);
    const startedAt = new Date(row.started_at as string).getTime();
    remainingSeconds = Math.floor((startedAt + durationSeconds * 1000 - Date.now()) / 1000);
  }

  if (effectiveEndTime) {
    const fromEndTime = Math.floor((new Date(effectiveEndTime).getTime() - Date.now()) / 1000);
    remainingSeconds = remainingSeconds === null ? fromEndTime : Math.min(remainingSeconds, fromEndTime);
  }

  const submissions = await sql`
    SELECT question_index, is_final,
           (response_text IS NOT NULL AND response_text <> '') AS has_draft
    FROM submissions WHERE session_id = ${row.id}
  `;

  return NextResponse.json({
    session_id: row.id,
    exercise_slug: exercise.slug as string,
    current_question_index: row.current_question_index as number,
    question_count: row.question_count as number,
    remaining_seconds: remainingSeconds,
    warning_low_time: remainingSeconds !== null && remainingSeconds < 300,
    question_statuses: submissions.map((s) => ({
      question_index: s.question_index,
      has_draft: Boolean(s.has_draft),
      is_final: Boolean(s.is_final),
    })),
  });
}
