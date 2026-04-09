import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

interface EditEvent {
  event_type: 'insert' | 'delete';
  position: number;
  char_count: number;
  occurred_at: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json();
  const { submission_id, events } = body as {
    submission_id: string;
    events: EditEvent[];
  };

  if (!submission_id || !Array.isArray(events) || events.length === 0) {
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

  // Batch-insert edit events — only store event_type, position, char_count, occurred_at (no raw chars)
  for (const event of events) {
    await sql`
      INSERT INTO edit_events (submission_id, event_type, position, char_count, occurred_at)
      VALUES (
        ${submission_id},
        ${event.event_type},
        ${event.position},
        ${event.char_count},
        ${event.occurred_at}
      )
    `;
  }

  return NextResponse.json({ count: events.length }, { status: 201 });
}
