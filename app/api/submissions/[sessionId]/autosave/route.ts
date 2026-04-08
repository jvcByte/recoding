import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';
import { evaluateFlags } from '@/lib/flagging';

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
  if (dbSession.closed_at || (dbSession.end_time && new Date() > new Date(dbSession.end_time))) {
    return NextResponse.json({ error: 'Session is closed' }, { status: 410 });
  }

  const body = await req.json();
  const { question_index, response_text } = body as {
    question_index: number;
    response_text: string;
  };

  // Check if a final submission already exists for this (session, question)
  const existing = await sql`
    SELECT id, is_final
    FROM submissions
    WHERE session_id = ${sessionId}
      AND question_index = ${question_index}
    LIMIT 1
  `;

  if (existing.length > 0 && existing[0].is_final) {
    return NextResponse.json(
      { error: 'Submission is already final' },
      { status: 409 }
    );
  }

  // Upsert the submission
  const upserted = await sql`
    INSERT INTO submissions (session_id, question_index, response_text, submitted_at)
    VALUES (${sessionId}, ${question_index}, ${response_text}, now())
    ON CONFLICT (session_id, question_index)
    DO UPDATE SET
      response_text = EXCLUDED.response_text,
      submitted_at  = EXCLUDED.submitted_at
    RETURNING id
  `;

  const submissionId: string = upserted[0].id;

  // Insert into autosave_history
  await sql`
    INSERT INTO autosave_history (submission_id, response_text, saved_at)
    VALUES (${submissionId}, ${response_text}, now())
  `;

  // Evaluate anti-cheat flags and persist results
  const { is_flagged, flag_reasons } = await evaluateFlags(submissionId);
  await sql`
    UPDATE submissions
    SET is_flagged   = ${is_flagged},
        flag_reasons = ${flag_reasons}
    WHERE id = ${submissionId}
  `;

  return NextResponse.json({ submission_id: submissionId, is_flagged }, { status: 200 });
}
