import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'instructor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissionId = params.id;

  const subRows = await sql`
    SELECT id, session_id, question_index, response_text, is_final,
           is_flagged, flag_reasons, review_note, submitted_at
    FROM submissions
    WHERE id = ${submissionId}
  `;

  if (subRows.length === 0) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const submission = subRows[0];

  const [autosaveRows, pasteRows, focusRows, editRows] = await Promise.all([
    sql`
      SELECT id, response_text, saved_at
      FROM autosave_history
      WHERE submission_id = ${submissionId}
      ORDER BY saved_at ASC
    `,
    sql`
      SELECT id, char_count, occurred_at
      FROM paste_events
      WHERE submission_id = ${submissionId}
      ORDER BY occurred_at ASC
    `,
    sql`
      SELECT id, lost_at, regained_at, duration_ms
      FROM focus_events
      WHERE session_id = ${submission.session_id}
      ORDER BY lost_at ASC
    `,
    sql`
      SELECT id, event_type, position, char_count, occurred_at
      FROM edit_events
      WHERE submission_id = ${submissionId}
      ORDER BY occurred_at ASC
    `,
  ]);

  return NextResponse.json({
    ...submission,
    autosave_history: autosaveRows,
    paste_events: pasteRows,
    focus_events: focusRows,
    edit_events: editRows,
  });
}
