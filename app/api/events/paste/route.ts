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
  const { submission_id, char_count, occurred_at } = body as {
    submission_id: string;
    char_count: number;
    occurred_at: string;
  };

  if (!submission_id || char_count == null || !occurred_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate submission belongs to the current user
  const ownerCheck = await sql`
    SELECT s.id
    FROM submissions s
    JOIN sessions sess ON sess.id = s.session_id
    WHERE s.id = ${submission_id}
      AND sess.user_id = ${userId}
    LIMIT 1
  `;

  if (ownerCheck.length === 0) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // Insert paste event
  const inserted = await sql`
    INSERT INTO paste_events (submission_id, char_count, occurred_at)
    VALUES (${submission_id}, ${char_count}, ${occurred_at})
    RETURNING id
  `;

  const id: string = inserted[0].id;

  // Evaluate flags and update submission
  const { is_flagged, flag_reasons } = await evaluateFlags(submission_id);

  await sql`
    UPDATE submissions
    SET is_flagged = ${is_flagged},
        flag_reasons = ${flag_reasons}
    WHERE id = ${submission_id}
  `;

  return NextResponse.json({ id }, { status: 201 });
}
