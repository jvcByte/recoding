import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/db';
import { evaluateFlags } from '@/lib/flagging';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json();
  const { session_id, lost_at, regained_at, duration_ms } = body as {
    session_id: string;
    lost_at: string;
    regained_at?: string;
    duration_ms?: number;
  };

  if (!session_id || !lost_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate session belongs to the current user
  const ownerCheck = await sql`
    SELECT id
    FROM sessions
    WHERE id = ${session_id}
      AND user_id = ${userId}
    LIMIT 1
  `;

  if (ownerCheck.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Insert focus event
  const inserted = await sql`
    INSERT INTO focus_events (session_id, lost_at, regained_at, duration_ms)
    VALUES (
      ${session_id},
      ${lost_at},
      ${regained_at ?? null},
      ${duration_ms ?? null}
    )
    RETURNING id
  `;

  const id: string = inserted[0].id;

  // Get the current submission for this session to evaluate flags
  const submissionRows = await sql`
    SELECT s.id
    FROM submissions s
    JOIN sessions sess ON sess.id = s.session_id
    WHERE sess.id = ${session_id}
      AND s.question_index = sess.current_question_index
    LIMIT 1
  `;

  if (submissionRows.length > 0) {
    const submissionId: string = submissionRows[0].id;
    const { is_flagged, flag_reasons } = await evaluateFlags(submissionId);

    await sql`
      UPDATE submissions
      SET is_flagged = ${is_flagged},
          flag_reasons = ${flag_reasons}
      WHERE id = ${submissionId}
    `;
  }

  return NextResponse.json({ id }, { status: 201 });
}
