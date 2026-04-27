import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { recalculateSessionScore } from '@/lib/scoring';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { sessionId } = params;

  // Verify session belongs to current user
  const sessionRows = await sql`
    SELECT id, closed_at, end_time
    FROM sessions
    WHERE id = ${sessionId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  if (sessionRows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const dbSession = sessionRows[0];

  // Reject if session is closed or past end_time
  if (dbSession.closed_at || (dbSession.end_time && new Date() > new Date(dbSession.end_time as string))) {
    return NextResponse.json({ error: 'Session is closed' }, { status: 410 });
  }

  const body = await req.json();
  const { question_index } = body as { question_index: number };

  // Look up the submission
  const submissionRows = await sql`
    SELECT id, is_final
    FROM submissions
    WHERE session_id = ${sessionId}
      AND question_index = ${question_index}
    LIMIT 1
  `;

  if (submissionRows.length === 0) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const submission = submissionRows[0];

  if (submission.is_final) {
    return NextResponse.json(
      { error: 'Submission is already final' },
      { status: 409 }
    );
  }

  // Mark as final
  await sql`
    UPDATE submissions
    SET is_final = true
    WHERE id = ${submission.id}
  `;

  // Check if all questions for this session are now final; if so, close and score
  const exerciseRows = await sql`
    SELECT e.question_count
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.id = ${sessionId}
    LIMIT 1
  `;
  const totalQuestions = (exerciseRows[0]?.question_count as number) ?? 0;

  const finalCountRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM submissions
    WHERE session_id = ${sessionId} AND is_final = true
  `;
  const finalCount = (finalCountRows[0]?.count as number) ?? 0;

  if (totalQuestions > 0 && finalCount >= totalQuestions) {
    await sql`
      UPDATE sessions SET closed_at = now()
      WHERE id = ${sessionId} AND closed_at IS NULL
    `;
    await recalculateSessionScore(sessionId).catch(() => {});
  }

  return NextResponse.json({ submission_id: submission.id }, { status: 200 });
}
