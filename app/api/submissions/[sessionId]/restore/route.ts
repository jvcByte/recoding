import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { sessionId } = params;

  // Verify session belongs to current user and get current question index
  const sessionRows = await sql`
    SELECT id, current_question_index
    FROM sessions
    WHERE id = ${sessionId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  if (sessionRows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const dbSession = sessionRows[0];
  const questionIndex: number = dbSession.current_question_index;

  // Look up the submission for the current question
  const submissionRows = await sql`
    SELECT id, response_text, is_final
    FROM submissions
    WHERE session_id = ${sessionId}
      AND question_index = ${questionIndex}
    LIMIT 1
  `;

  if (submissionRows.length === 0) {
    return NextResponse.json(
      { response_text: '', question_index: questionIndex },
      { status: 200 }
    );
  }

  const submission = submissionRows[0];

  return NextResponse.json(
    {
      response_text: submission.response_text,
      question_index: questionIndex,
      is_final: submission.is_final,
    },
    { status: 200 }
  );
}
