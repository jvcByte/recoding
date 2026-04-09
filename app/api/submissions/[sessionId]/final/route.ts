import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

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

  return NextResponse.json({ submission_id: submission.id }, { status: 200 });
}
